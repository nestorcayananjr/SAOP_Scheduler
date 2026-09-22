import { ElectiveType, Grade, RoomType } from "@saop/schema"

interface Config {
    gradeSizes: Record<Grade, number>
    electiveCount: Record<ElectiveType, number>,
    skewExponent: number,
    rankedListLength: Record<Grade, number>,
    roomCount: Record<RoomType, number>,
    teacherCount: number,
    messiness: {
        duplicateRankCount: number,
        blankSurveyCount: number,
        ineligibleRankingCount: number
    },
    randomSeed: number,

}