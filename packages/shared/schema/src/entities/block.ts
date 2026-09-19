// represents an elective period in the schedule

import * as z from "zod"
import { Semester, Ordering, ElectiveDay } from "../primitives.js"

export const Block = z.object({
    id: z.number().int().positive(),
    semester: z.enum(Semester),
    // each school day has two blocks for electives
    blockPosition: z.enum(Ordering),
    days: z.enum(ElectiveDay)
})