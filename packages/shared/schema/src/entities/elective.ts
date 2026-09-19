import * as z from "zod"
import { Grade, Semester, ElectiveType, RoomType } from "../primitives.js"

export const Elective = z.object({
    id: z.number().int().positive(),
    name: z.string(),
    eligibleTeacherIds: z.array(z.number().int().positive()).min(1),
    electiveType: z.enum(ElectiveType),
    isYearLong: z.boolean(),
    eligibleGradeLevels: z.array(z.enum(Grade)),
    eligibleStudentIds: z.array(z.number().int().positive()).min(1).optional(),
    allowedSemesters: z.array(z.enum(Semester)).min(1).optional(),
    requiredClassroomType: z.enum(RoomType).optional()
}).refine((e) => 
    !(e.isYearLong && e.allowedSemesters), {
        error: "year-long electives cannot also restrict allowedSemesters"
    }
)