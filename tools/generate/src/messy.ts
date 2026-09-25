import { SolverInput, RoomType } from "@saop/schema";
import type { Config } from "./config.js";
import { pick, shuffle } from "./rng.js";

// §3g answer-key record — SCHED-009's linter can assert "did I find exactly these?"
export type MessyRecord = { kind: string; studentId?: number; detail: string };

// §3g: schema-INVALID — fails Preference's dupe refine ([7,7,3]). Duplicates an existing
// ranked-elective id within n students' preferences.
export function injectDuplicateRanks(input: SolverInput, rng: () => number, n: number): { input: SolverInput; records: MessyRecord[] } {
    const records: MessyRecord[] = [];
    const candidates = input.preferences.filter(p => p.rankedElectiveIds.length >= 1);
    const targets = new Set(pickN(rng, candidates, n).map(p => p.studentId));

    const preferences = input.preferences.map(p => {
        if (!targets.has(p.studentId)) return p;
        const dupeId = pick(rng, p.rankedElectiveIds);
        records.push({ kind: "duplicateRank", studentId: p.studentId, detail: `duplicated elective ${dupeId} in rankedElectiveIds` });
        return { ...p, rankedElectiveIds: [...p.rankedElectiveIds, dupeId] };
    });

    return { input: { ...input, preferences }, records };
}

// §3g: schema-valid — empty rankedElectiveIds. Blanks out n students' preferences entirely.
export function injectBlankSurveys(input: SolverInput, rng: () => number, n: number): { input: SolverInput; records: MessyRecord[] } {
    const records: MessyRecord[] = [];
    const targets = new Set(pickN(rng, input.preferences, n).map(p => p.studentId));

    const preferences = input.preferences.map(p => {
        if (!targets.has(p.studentId)) return p;
        records.push({ kind: "blankSurvey", studentId: p.studentId, detail: "rankedElectiveIds cleared" });
        return { ...p, rankedElectiveIds: [] };
    });

    return { input: { ...input, preferences }, records };
}

// §3g: schema-valid (no cross-entity refine catches it) — ranks an elective the student's
// grade isn't eligible for (H20 violation), for n students.
export function injectIneligibleRankings(input: SolverInput, rng: () => number, n: number): { input: SolverInput; records: MessyRecord[] } {
    const records: MessyRecord[] = [];
    const targets = pickN(rng, input.students, n);

    const preferences = input.preferences.map(p => {
        const student = targets.find(s => s.id === p.studentId);
        if (!student) return p;

        const ineligible = input.electives.filter(e => !e.eligibleGradeLevels.includes(student.grade));
        if (ineligible.length === 0) return p; // nothing ineligible to offer this student — skip

        const badElectiveId = pick(rng, ineligible).id;
        records.push({ kind: "ineligibleRanking", studentId: p.studentId, detail: `ranked ineligible elective ${badElectiveId}` });
        return { ...p, rankedElectiveIds: [...p.rankedElectiveIds, badElectiveId] };
    });

    return { input: { ...input, preferences }, records };
}

// §3g: schema-valid — demand > capacity isn't a schema concern. Shrinks one specialty room's
// capacity to force oversubscription. No `n` — a single targeted event, not a per-student count.
export function oversubscribeSpecialtyRoom(input: SolverInput, rng: () => number): { input: SolverInput; records: MessyRecord[] } {
    const specialtyRooms = input.rooms.filter(r => r.type !== RoomType.GeneralClassroom);
    if (specialtyRooms.length === 0) return { input, records: [] };

    const target = pick(rng, specialtyRooms);
    const records: MessyRecord[] = [{ kind: "oversubscribedSpecialtyRoom", detail: `room ${target.id} (${target.type}) capacity shrunk to 1` }];

    const rooms = input.rooms.map(r => r.id === target.id ? { ...r, capacity: 1 } : r);
    return { input: { ...input, rooms }, records };
}

// §5 Step 5: applies all four mutators on top of a clean, feasible base, per config.messiness.
export function applyMessy(input: SolverInput, config: Config, rng: () => number): { input: SolverInput; records: MessyRecord[] } {
    let current = input;
    const allRecords: MessyRecord[] = [];

    const dup = injectDuplicateRanks(current, rng, config.messiness.duplicateRankCount);
    current = dup.input;
    allRecords.push(...dup.records);

    const blank = injectBlankSurveys(current, rng, config.messiness.blankSurveyCount);
    current = blank.input;
    allRecords.push(...blank.records);

    const ineligible = injectIneligibleRankings(current, rng, config.messiness.ineligibleRankingCount);
    current = ineligible.input;
    allRecords.push(...ineligible.records);

    const room = oversubscribeSpecialtyRoom(current, rng);
    current = room.input;
    allRecords.push(...room.records);

    return { input: current, records: allRecords };
}

function pickN<T>(rng: () => number, items: T[], n: number): T[] {
    return shuffle(rng, items).slice(0, Math.min(n, items.length));
}
