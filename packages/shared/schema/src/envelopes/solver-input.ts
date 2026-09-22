import * as z from "zod"
import { Student } from "../entities/student.js"
import { Elective } from "../entities/elective.js"
import { Teacher } from "../entities/teacher.js"
import { Block } from "../entities/block.js"
import { Room } from "../entities/room.js"
import { CombinableGroup } from "../entities/combinable-group.js"
import { Preference } from "../entities/preference.js"

const Weights = z.object({
    S1: z.number().nonnegative(),
    S2: z.number().nonnegative(),
    S3: z.number().nonnegative(),
    S4: z.number().nonnegative(),
    S5: z.number().nonnegative(),
    S6: z.number().nonnegative(),
})

const Config = z.object({
    weights: Weights,
    timeLimitSeconds: z.number().int().positive().optional(),
    randomSeed: z.number().int().optional()
})

const LockedAssignment = z.object({
    studentId: z.number().int().positive(),
    electiveId: z.number().int().positive(),
    blockId: z.number().int().positive().optional()
})

export const SolverInput = z.object({
    students: z.array(Student),
    electives: z.array(Elective),
    teachers: z.array(Teacher),
    blocks: z.array(Block),
    rooms: z.array(Room),
    combinableGroups: z.array(CombinableGroup).default([]),
    preferences: z.array(Preference),
    config: Config,
    lockedAssignments: z.array(LockedAssignment).default([])
})