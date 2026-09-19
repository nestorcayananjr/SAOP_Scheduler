import * as z from "zod"
import { Grade } from "../primitives.js"

export const Student = z.object({
    id: z.number().int().positive(),
    firstName: z.string(),
    lastName: z.string(),
    grade: z.enum(Grade),
    takenElectiveIds: z.array(z.number().int().positive()), // H9
    requiredElectiveIds: z.array(z.number().int().positive()), // H2, H13, H16, H19
})