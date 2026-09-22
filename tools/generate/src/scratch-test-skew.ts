// Throwaway script to eyeball weightedSampleWithoutReplacement's skew.
// Run with: npx tsx src/scratch-test-skew.ts
// (or: node --experimental-strip-types src/scratch-test-skew.ts)

import { makeRng, weightedSampleWithoutReplacement } from "./rng.js";

const electives = ["PE", "Art", "Band", "Chess", "Yearbook"];
const weights = [5, 4, 3, 2, 1];
const counts: Record<string, number> = { PE: 0, Art: 0, Band: 0, Chess: 0, Yearbook: 0 };

const rng = makeRng(42);
for (let i = 0; i < 1000; i++) {
  const sample = weightedSampleWithoutReplacement(rng, electives, weights, 2);
  for (const s of sample) counts[s]++;
}

console.log("times each elective was picked (out of 1000 draws, k=2 each):");
console.log(counts);
