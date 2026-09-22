import * as z from "zod"

// solver OUTPUT - never appears in SolverInput
export const Section = z.object({
    id: z.number().int().positive(),
    electiveId: z.number().int().positive(),
    teacherIds: z.array(z.number().int().positive()).min(1), // H18
    roomId: z.number().int().positive(),
    blockIds: z.array(z.number().int().positive()).min(1).max(2),
    studentIds: z.array(z.number().int().positive()),
})