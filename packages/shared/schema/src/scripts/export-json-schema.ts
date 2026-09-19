import * as z from "zod"
import { SolverInput } from "../envelopes/solver-input.js"
import { mkdirSync, writeFileSync } from "node:fs"

const jsonSchema = z.toJSONSchema(SolverInput);
mkdirSync("schema", { recursive: true })
writeFileSync("schema/solver-input.schema.json", JSON.stringify(jsonSchema, null, 2))