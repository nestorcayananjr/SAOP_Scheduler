import * as z from "zod"

export const Preference = z.object({
    studentId: z.number().int().positive(),
    rankedElectiveIds: z.array(z.number().int().positive()).refine((ids) => new Set(ids).size === ids.length, {error: "rankedElectiveIds must not contain dupes"})
})