import * as z from "zod"
import { Grade, Semester, ElectiveType, RoomType } from "../primitives.js"

export const Elective = z.object({
    id: z.number().int().positive(),
    name: z.string(),
    eligibleTeacherIds: z.array(z.number().int().positive()).min(1), // H10
    electiveType: z.enum(ElectiveType), // H19, H21
    isYearLong: z.boolean(), // H17
    eligibleGradeLevels: z.array(z.enum(Grade)).min(1),
    eligibleStudentIds: z.array(z.number().int().positive()).min(1).optional(), // H14, H20
    allowedSemesters: z.array(z.enum(Semester)).min(1).optional(), // H22
    requiredClassroomType: z.enum(RoomType).optional(), // H4,
    requiredTeacherCount: z.number().int().positive().default(1), // H18
    allowsMultipleSections: z.boolean().default(false),
    minSectionSize: z.number().int().positive().optional(),
    maxSectionSize: z.number().int().positive().optional(),
}).refine((e) => 
    !(e.isYearLong && e.allowedSemesters), {
        error: "year-long electives cannot also restrict allowedSemesters"
    }
)

export type Elective = z.infer<typeof Elective>