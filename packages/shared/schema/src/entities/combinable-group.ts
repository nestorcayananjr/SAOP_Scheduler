import * as z from "zod"

export const CombinableGroup = z.object({
    id: z.number().int().positive(),
    electiveIds: z.array(z.number().int().positive()).min(2)
})