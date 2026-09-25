import * as z from "zod"
import { RoomType } from "../primitives.js"

export const Room = z.object({
    id: z.number().int().positive(),
    // need to confirm whether all rooms have numbers or if some are alphanumeric
    roomNumber: z.number().int().positive(),
    type: z.enum(RoomType), // H7
    capacity: z.number().int().positive() // H3
})

export type Room = z.infer<typeof Room>