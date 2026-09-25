import { parseArgs } from "node:util";
import { writeFileSync } from "node:fs";
import * as z from "zod";
import { SolverInput } from "@saop/schema";
import { defaultConfig } from "./config.js";
import { makeRng } from "./rng.js";
import {
    buildBlocks,
    buildTeachers,
    buildRooms,
    buildElectives,
    buildStudents,
    assignRequiredElectives,
    assignServiceLearningEligibility,
    buildPreferences,
    buildCombinableGroups,
    buildLockedAssignments,
    buildSolverConfig,
} from "./builders.js";
import { assertConsistent } from "./validate.js";
import { applyMessy } from "./messy.js";

const { values } = parseArgs({
    options: {
        seed: { type: "string" },
        messy: { type: "boolean", default: false },
        out: { type: "string" },
    },
});

if (values.seed === undefined) {
    throw new Error("--seed is required, e.g. `npm run generate -- --seed 42`");
}
const seed = Number(values.seed);
if (!Number.isInteger(seed)) {
    throw new Error(`--seed must be an integer, got "${values.seed}"`);
}
const messy = values.messy ?? false;
const outPath = values.out ?? "./solver_input.json";

const rng = makeRng(seed);
// echo the seed into the output (§3a) — config.randomSeed must equal --seed
const config = { ...defaultConfig, randomSeed: seed };

// §4: generation order — later steps only ever draw IDs from entities earlier steps created.
const blocks = buildBlocks();
const teachers = buildTeachers(config, rng);
const rooms = buildRooms(config);
const { electives: electivesWithoutServiceLearning, weights } = buildElectives(config, rng, teachers);

let students = buildStudents(config, rng);
students = assignRequiredElectives(config, electivesWithoutServiceLearning, students, rng);
// H14 patch — Service Learning's eligibleStudentIds couldn't be set until students existed
const electives = assignServiceLearningEligibility(config, electivesWithoutServiceLearning, students, rng);

const preferences = buildPreferences(students, electives, weights, rng);
const combinableGroups = buildCombinableGroups(electives);
const lockedAssignments = buildLockedAssignments(students, blocks, rng);
const solverConfig = buildSolverConfig(config);

let assembled: SolverInput = {
    students,
    electives,
    teachers,
    blocks,
    rooms,
    combinableGroups,
    preferences,
    config: solverConfig,
    lockedAssignments,
};

let messyRecords: ReturnType<typeof applyMessy>["records"] = [];
if (messy) {
    const result = applyMessy(assembled, config, rng);
    assembled = result.input;
    messyRecords = result.records;
}

// §4 step 12 / §3g — the gate. Referential integrity (4b) must always hold, messy or clean,
// since none of the messy mutators introduce dangling ids. Schema shape (4a) is a hard gate on
// the clean path, but duplicate-rank injection is *designed* to fail Preference's dupe refine —
// so in messy mode we report the failure instead of throwing (documented policy, §5 Step 5c).
assertConsistent(assembled);

const parseResult = SolverInput.safeParse(assembled);
if (parseResult.success) {
    console.log("solver_input schema validated");
} else if (messy) {
    console.log("messy mode — schema validation failures expected:\n" + z.prettifyError(parseResult.error));
} else {
    throw new Error(z.prettifyError(parseResult.error));
}

writeFileSync(outPath, JSON.stringify(assembled, null, 2));
console.log(`wrote ${outPath}`);

if (messy && messyRecords.length > 0) {
    const answersPath = outPath.replace(/\.json$/, ".messy.answers.json");
    writeFileSync(answersPath, JSON.stringify(messyRecords, null, 2));
    console.log(`wrote ${answersPath}`);
}
