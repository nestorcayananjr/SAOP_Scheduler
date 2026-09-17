// represents an elective period in the schedule

import * as z from "zod"
import { Semester, Ordering, ElectiveDay } from "../primitives.js"

export const Block = z.object({
    id: z.number().int().positive(),
    semester: z.enum(Semester),
    ordering: z.enum(Ordering),
    days: z.enum(ElectiveDay)
})