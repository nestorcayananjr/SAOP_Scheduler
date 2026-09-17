import * as z from "zod"
import { Grade } from "../primitives.js"

export const Student = z.object({
    id: z.number().int().positive(),
    firstName: z.string(),
    lastName: z.string(),
    grade: z.enum(Grade),
    takenElectiveIds: z.array(z.number().int().positive()),
    requiredElectiveIds: z.array(z.number().int().positive()),

})