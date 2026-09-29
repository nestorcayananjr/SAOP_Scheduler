import { SolverInput, RoomType } from "@saop/schema";
import type { Config } from "./config.js";
import { pick, shuffle } from "./rng.js";

// §3g answer-key record — SCHED-009's linter can assert "did I find exactly these?"
//
// That assertion only holds if every record is exactly true, so the preference mutators below
// are given DISJOINT target lists by applyMessy: no student receives more than one defect.
// They used to draw their own targets independently, which let a later mutator silently undo an
// earlier one's work (blanking a survey erased a duplicate; appending to a blanked survey
// un-blanked it) while the earlier record survived and lied about it.
export type MessyRecord = { kind: string; studentId?: number; detail: string };

// §3g: schema-INVALID — fails Preference's dupe refine ([7,7,3]). Duplicates an existing
// ranked-elective id within each target's preferences.
export function injectDuplicateRanks(input: SolverInput, rng: () => number, targets: number[]): { input: SolverInput; records: MessyRecord[] } {
    const records: MessyRecord[] = [];
    const targeted = new Set(targets);

    const preferences = input.preferences.map(p => {
        if (!targeted.has(p.studentId)) return p;
        const dupeId = pick(rng, p.rankedElectiveIds);
        records.push({ kind: "duplicateRank", studentId: p.studentId, detail: `duplicated elective ${dupeId} in rankedElectiveIds` });
        return { ...p, rankedElectiveIds: [...p.rankedElectiveIds, dupeId] };
    });

    return { input: { ...input, preferences }, records };
}

// §3g: schema-valid — empty rankedElectiveIds. Blanks out each target's preferences entirely.
export function injectBlankSurveys(input: SolverInput, targets: number[]): { input: SolverInput; records: MessyRecord[] } {
    const records: MessyRecord[] = [];
    const targeted = new Set(targets);

    const preferences = input.preferences.map(p => {
        if (!targeted.has(p.studentId)) return p;
        records.push({ kind: "blankSurvey", studentId: p.studentId, detail: "rankedElectiveIds cleared" });
        return { ...p, rankedElectiveIds: [] };
    });

    return { input: { ...input, preferences }, records };
}

// §3g: schema-valid (no cross-entity refine catches it) — ranks an elective the student's
// grade isn't eligible for (H20 violation).
export function injectIneligibleRankings(input: SolverInput, rng: () => number, targets: number[]): { input: SolverInput; records: MessyRecord[] } {
    const records: MessyRecord[] = [];
    const targeted = new Set(targets);

    const preferences = input.preferences.map(p => {
        if (!targeted.has(p.studentId)) return p;

        const student = input.students.find(s => s.id === p.studentId)!;
        const ineligible = input.electives.filter(e => !e.eligibleGradeLevels.includes(student.grade));
        // applyMessy only targets students whose grade has something ineligible, so this is a
        // broken invariant rather than a case to skip past quietly.
        if (ineligible.length === 0) {
            throw new Error(`No elective is ineligible for grade ${student.grade}, so student ${p.studentId} cannot be given an ineligibleRanking defect.`);
        }

        const badElectiveId = pick(rng, ineligible).id;
        records.push({ kind: "ineligibleRanking", studentId: p.studentId, detail: `ranked ineligible elective ${badElectiveId}` });
        return { ...p, rankedElectiveIds: [...p.rankedElectiveIds, badElectiveId] };
    });

    return { input: { ...input, preferences }, records };
}

// §3g: schema-valid — demand > capacity isn't a schema concern. Shrinks one specialty room's
// capacity to force oversubscription. No target list — a single room-level event.
export function oversubscribeSpecialtyRoom(input: SolverInput, rng: () => number): { input: SolverInput; records: MessyRecord[] } {
    const specialtyRooms = input.rooms.filter(r => r.type !== RoomType.GeneralClassroom);
    if (specialtyRooms.length === 0) return { input, records: [] };

    const target = pick(rng, specialtyRooms);
    const records: MessyRecord[] = [{ kind: "oversubscribedSpecialtyRoom", detail: `room ${target.id} (${target.type}) capacity shrunk to 1` }];

    const rooms = input.rooms.map(r => r.id === target.id ? { ...r, capacity: 1 } : r);
    return { input: { ...input, rooms }, records };
}

// Draws `n` students from `pool` that `accepts` allows, removing them so no other mutator can
// claim them. Students this mutator can't use go back for the others rather than being burned.
function drawTargets(pool: number[], n: number, knob: string, accepts: (studentId: number) => boolean): number[] {
    const picked: number[] = [];
    const passedOver: number[] = [];

    while (pool.length > 0 && picked.length < n) {
        const studentId = pool.shift()!;
        (accepts(studentId) ? picked : passedOver).push(studentId);
    }
    pool.unshift(...passedOver);

    if (picked.length < n) {
        throw new Error(
            `--messy could only place ${picked.length} of ${n} ${knob} defects — not enough distinct ` +
            `students qualify. Lower config.messiness.${knob}.`
        );
    }

    return picked;
}

// §5 Step 5: applies all four mutators on top of a clean, feasible base, per config.messiness.
export function applyMessy(input: SolverInput, config: Config, rng: () => number): { input: SolverInput; records: MessyRecord[] } {
    const { duplicateRankCount, blankSurveyCount, ineligibleRankingCount } = config.messiness;

    const ranked = new Map(input.preferences.map(p => [p.studentId, p.rankedElectiveIds]));
    const gradeOf = new Map(input.students.map(s => [s.id, s.grade]));
    const gradesWithIneligibleElectives = new Set(
        input.students
            .map(s => s.grade)
            .filter(grade => input.electives.some(e => !e.eligibleGradeLevels.includes(grade)))
    );

    // One shuffled pool, dealt out disjointly — see the note on MessyRecord above.
    const pool = shuffle(rng, input.preferences.map(p => p.studentId));
    const hasRankings = (id: number) => (ranked.get(id)?.length ?? 0) > 0;

    // duplicate and blank both need a non-empty list to act on; ineligible needs the student's
    // grade to have something it can't take.
    const dupeTargets = drawTargets(pool, duplicateRankCount, "duplicateRankCount", hasRankings);
    const blankTargets = drawTargets(pool, blankSurveyCount, "blankSurveyCount", hasRankings);
    const ineligibleTargets = drawTargets(pool, ineligibleRankingCount, "ineligibleRankingCount",
        id => gradesWithIneligibleElectives.has(gradeOf.get(id)!));

    let current = input;
    const allRecords: MessyRecord[] = [];

    for (const step of [
        () => injectDuplicateRanks(current, rng, dupeTargets),
        () => injectBlankSurveys(current, blankTargets),
        () => injectIneligibleRankings(current, rng, ineligibleTargets),
        () => oversubscribeSpecialtyRoom(current, rng),
    ]) {
        const result = step();
        current = result.input;
        allRecords.push(...result.records);
    }

    return { input: current, records: allRecords };
}
