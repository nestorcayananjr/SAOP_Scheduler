import * as z from "zod"

export const Teacher = z.object({
    id: z.number().int().positive(),
    name: z.string(),
})

export type Teacher = z.infer<typeof Teacher>