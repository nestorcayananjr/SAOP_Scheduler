import { ElectiveType, Grade, Room, RoomType, Weights } from "@saop/schema"

export interface Config {
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
    rates: {
        spanishAlreadyTaken: number,
        skillBuilders: number,
        serviceLearningEligible: number
    }
    weights: Weights,
    timeLimitSeconds: number,
    randomSeed: number,

}

export const defaultConfig: Config = {
    gradeSizes: {
        [Grade["6th"]]: 49,
        [Grade["7th"]]: 52,
        [Grade["8th"]]: 49
    },
    electiveCount: {
        [ElectiveType.FineArts]: 3,
        [ElectiveType.General]: 15,
        [ElectiveType.PhysicalEducation]: 3
    },
    skewExponent: 2,
    rankedListLength: {
        [Grade["6th"]]: 4,
        [Grade["7th"]]: 6,
        [Grade["8th"]]: 12
    },
    roomCount: {
        [RoomType.Art]: 1,
        [RoomType.Band]: 1,
        [RoomType.ComputerLab]: 1,
        [RoomType.GeneralClassroom]: 10,
        [RoomType.PE]: 2,
        [RoomType.Spanish]: 1
    },
    teacherCount: 15,
    messiness: {
        duplicateRankCount: 0,
        blankSurveyCount: 0,
        ineligibleRankingCount: 0
    },
    rates: {
        spanishAlreadyTaken: 0.2,
        skillBuilders: 0.05,
        serviceLearningEligible: 0.15
    },
    weights: {
        S1: 10,
        S2: 3,
        S3: 3,
        S4: 8,
        S5: 4,
        S6: 3
    },
    timeLimitSeconds: 60,
    randomSeed: 0
}