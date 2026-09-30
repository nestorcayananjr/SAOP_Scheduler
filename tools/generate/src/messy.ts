import { SolverInput, RoomType } from "@saop/schema";
import type { Config } from "./config.js";
import { pick, shuffle } from "./rng.js";

export type MessyRecord = { kind: string; studentId?: number; detail: string };

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

// Schema-valid (no cross-entity refine catches it) — ranks an elective the student's
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

export function oversubscribeSpecialtyRoom(input: SolverInput, rng: () => number): { input: SolverInput; records: MessyRecord[] } {
    const specialtyRooms = input.rooms.filter(r => r.type !== RoomType.GeneralClassroom);
    if (specialtyRooms.length === 0) return { input, records: [] };

    const target = pick(rng, specialtyRooms);
    const records: MessyRecord[] = [{ kind: "oversubscribedSpecialtyRoom", detail: `room ${target.id} (${target.type}) capacity shrunk to 1` }];

    const rooms = input.rooms.map(r => r.id === target.id ? { ...r, capacity: 1 } : r);
    return { input: { ...input, rooms }, records };
}

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

export function applyMessy(input: SolverInput, config: Config, rng: () => number): { input: SolverInput; records: MessyRecord[] } {
    const { duplicateRankCount, blankSurveyCount, ineligibleRankingCount } = config.messiness;

    const ranked = new Map(input.preferences.map(p => [p.studentId, p.rankedElectiveIds]));
    const gradeOf = new Map(input.students.map(s => [s.id, s.grade]));
    const gradesWithIneligibleElectives = new Set(
        input.students
            .map(s => s.grade)
            .filter(grade => input.electives.some(e => !e.eligibleGradeLevels.includes(grade)))
    );

    const pool = shuffle(rng, input.preferences.map(p => p.studentId));
    const hasRankings = (id: number) => (ranked.get(id)?.length ?? 0) > 0;

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
