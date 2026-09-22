import * as z from "zod"
import { readFileSync } from "node:fs"
import { SolverInput } from "../index.js"

const load = (name: string) =>
    JSON.parse(readFileSync(`examples/${name}`, "utf8"))

let failed = false

// The valid example MUST parse.
const valid = SolverInput.safeParse(load("solver-input.valid.json"))
if (valid.success) {
    console.log("✅ solver-input.valid.json parsed")
} else {
    failed = true
    console.log("❌ solver-input.valid.json should have parsed but failed:\n" +
        z.prettifyError(valid.error))
}

// The invalid example MUST fail — and we print the error to confirm it is clear.
const invalid = SolverInput.safeParse(load("solver-input.invalid.json"))
if (invalid.success) {
    failed = true
    console.log("❌ solver-input.invalid.json should have failed but parsed")
} else {
    console.log("✅ solver-input.invalid.json rejected, as expected:\n" +
        z.prettifyError(invalid.error))
}

process.exit(failed ? 1 : 0)
