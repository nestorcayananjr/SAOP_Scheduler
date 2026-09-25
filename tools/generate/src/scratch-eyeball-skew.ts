// Scratch script — §5 Step 7 "eyeball skew" check, post-§3b-correction.
// Every student ranks their ENTIRE eligible pool, so raw appearance count is flat by
// construction. Skew shows up as rank POSITION instead — popular electives should cluster
// near rank 1 across students who had them in their pool; unpopular ones drift toward the tail.
// Run with: npx tsx src/scratch-eyeball-skew.ts

import { makeRng } from "./rng.js";
import { defaultConfig } from "./config.js";
import {
    buildTeachers,
    buildElectives,
    buildStudents,
    assignRequiredElectives,
    assignServiceLearningEligibility,
    buildPreferences,
} from "./builders.js";

const seed = 42;
const rng = makeRng(seed);
const config = { ...defaultConfig, randomSeed: seed };

const teachers = buildTeachers(config, rng);
const { electives: electivesRaw, weights } = buildElectives(config, rng, teachers);
let students = buildStudents(config, rng);
students = assignRequiredElectives(config, electivesRaw, students, rng);
const electives = assignServiceLearningEligibility(config, electivesRaw, students, rng);
const preferences = buildPreferences(students, electives, weights, rng);

const stats = new Map<number, { appearances: number; rankSum: number }>();
for (const e of electives) stats.set(e.id, { appearances: 0, rankSum: 0 });

for (const pref of preferences) {
    pref.rankedElectiveIds.forEach((electiveId, index) => {
        const s = stats.get(electiveId)!;
        s.appearances++;
        s.rankSum += index + 1; // 1-indexed rank — 1 is the top choice
    });
}

const rows = electives
    .map(e => {
        const s = stats.get(e.id)!;
        return {
            name: e.name,
            weight: weights.get(e.id)!,
            appearances: s.appearances,
            avgRank: s.appearances > 0 ? s.rankSum / s.appearances : NaN,
        };
    })
    .sort((a, b) => a.avgRank - b.avgRank);

console.log(
    "elective".padEnd(26),
    "weight".padEnd(10),
    "appearances".padEnd(13),
    "avg rank (lower = more popular)"
);
for (const r of rows) {
    console.log(
        r.name.padEnd(26),
        r.weight.toFixed(3).padEnd(10),
        String(r.appearances).padEnd(13),
        Number.isNaN(r.avgRank) ? "never ranked" : r.avgRank.toFixed(2)
    );
}
