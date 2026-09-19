import * as z from "zod"
import { Grade } from "../primitives.js"

export const Student = z.object({
    id: z.number().int().positive(),
    firstName: z.string(),
    lastName: z.string(),
    grade: z.enum(Grade),
    takenElectiveIds: z.array(z.number().int().positive()).refine((ids) => new Set(ids).size === ids.length, { error: "takenElectiveIds must not contain dupes"}), // H9
    requiredElectiveIds: z.array(z.number().int().positive()).refine((ids) => new Set(ids).size === ids.length, { error: "requiredElectives must not contain dupes"}), // H2, H13, H16, H19
})