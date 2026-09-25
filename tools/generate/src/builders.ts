import { Block, Semester, BlockPosition, ElectiveDay, Teacher, Room, RoomType, Elective, ElectiveType, Grade, Student, Preference, CombinableGroup, LockedAssignment, Config as SolverOutputConfig } from "@saop/schema";
import type { Config } from "./config.js";
import { pick, shuffle, weightedSampleWithoutReplacement } from "./rng.js";

export function buildBlocks(): Block[]{
    return [
        { id: 1, semester: Semester.Fall, blockPosition: BlockPosition.First, days: ElectiveDay.MondayThursday},
        { id: 2, semester: Semester.Fall, blockPosition: BlockPosition.Second, days: ElectiveDay.MondayThursday},
        { id: 3, semester: Semester.Fall, blockPosition: BlockPosition.First, days: ElectiveDay.TuesdayFriday},
        { id: 4, semester: Semester.Fall, blockPosition: BlockPosition.Second, days: ElectiveDay.TuesdayFriday},
        { id: 5, semester: Semester.Spring, blockPosition: BlockPosition.First, days: ElectiveDay.MondayThursday},
        { id: 6, semester: Semester.Spring, blockPosition: BlockPosition.Second, days: ElectiveDay.MondayThursday},
        { id: 7, semester: Semester.Spring, blockPosition: BlockPosition.First, days: ElectiveDay.TuesdayFriday},
        { id: 8, semester: Semester.Spring, blockPosition: BlockPosition.Second, days: ElectiveDay.TuesdayFriday}
    ]
}

export function buildTeachers(config: Config, rng: () => number): Teacher[]{
    const firstNames = ["Alex", "Miles", "Leon", "James", "Abby", "Gianna", "Jade", "Ezra", "Seraphine", "Kyle", "Jamie", "LJ"];
    const lastNames = ["White", "Brown", "Moma", "Cayanan", "Tucker", "Tressel", "Turner", "Sturgeon", "Kuchinski", "Hess", "Lionheart"]

    const teachers: Teacher[] = [];

    for (let i = 0; i < config.teacherCount; i++){
        teachers.push({
            id: i + 1,
            name: `${pick(rng, firstNames)} ${pick(rng, lastNames)}`
        })
    }
    return teachers;
}

export function buildRooms(config: Config): Room[]{
    const mockRoomCapacityMap = {
        [RoomType.Art]: 25,
        [RoomType.Band]: 20,
        [RoomType.ComputerLab]: 22,
        [RoomType.GeneralClassroom]: 25,
        [RoomType.PE]: 35,
        [RoomType.Spanish]: 20
    }

    const rooms: Room[] = [];
    let id = 1;

    for (const [type, count] of Object.entries(config.roomCount)){
        for (let i = 0; i < count; i++){
            rooms.push({
                id: id,
                roomNumber: 100 + id,
                type: type as RoomType,
                capacity: mockRoomCapacityMap[type as RoomType]
            })
            id++
        }
    }
    
    return rooms
}

const ALL_GRADES: Grade[] = [Grade["6th"], Grade["7th"], Grade["8th"]];
const GRADES_7_AND_8: Grade[] = [Grade["7th"], Grade["8th"]];
const GRADE_8_ONLY: Grade[] = [Grade["8th"]];

// One hardcoded row per real-world elective (§1: "archetypes are fine"). Fields here are
// policy-driven and fixed on purpose — id/eligibleTeacherIds/weight are generated below.
type ElectiveSpec = {
    name: string;
    electiveType: ElectiveType;
    eligibleGradeLevels: Grade[];
    isYearLong: boolean;
    allowsMultipleSections: boolean;
    requiredTeacherCount: number;
    teacherPoolSize: number;
    requiredClassroomType?: RoomType;
    minSectionSize?: number;
    maxSectionSize?: number;
    // H14: this elective needs eligibleStudentIds, but student ids don't exist yet at this
    // point in the build order (§4: electives before students) — patched in after buildStudents.
    needsEligibleStudentIdsLater?: boolean;
};

const electiveCatalog: ElectiveSpec[] = [
    // Physical Education (3) — H19: every student needs one of these in requiredElectiveIds
    { name: "PE - Team Sports", electiveType: ElectiveType.PhysicalEducation, eligibleGradeLevels: ALL_GRADES, isYearLong: false, allowsMultipleSections: true, requiredTeacherCount: 1, teacherPoolSize: 1, requiredClassroomType: RoomType.PE, minSectionSize: 15, maxSectionSize: 25 },
    { name: "PE - Fitness", electiveType: ElectiveType.PhysicalEducation, eligibleGradeLevels: ALL_GRADES, isYearLong: false, allowsMultipleSections: true, requiredTeacherCount: 1, teacherPoolSize: 1, requiredClassroomType: RoomType.PE, minSectionSize: 15, maxSectionSize: 25 },
    { name: "PE - Individual Sports", electiveType: ElectiveType.PhysicalEducation, eligibleGradeLevels: ALL_GRADES, isYearLong: false, allowsMultipleSections: true, requiredTeacherCount: 1, teacherPoolSize: 1, requiredClassroomType: RoomType.PE, minSectionSize: 15, maxSectionSize: 25 },

    // Fine Arts (3) — H21: must include at least one eligible to 6th grade (Chorus, "core" tier)
    { name: "Band", electiveType: ElectiveType.FineArts, eligibleGradeLevels: GRADE_8_ONLY, isYearLong: false, allowsMultipleSections: false, requiredTeacherCount: 1, teacherPoolSize: 1, requiredClassroomType: RoomType.Band },
    { name: "Art", electiveType: ElectiveType.FineArts, eligibleGradeLevels: GRADE_8_ONLY, isYearLong: false, allowsMultipleSections: false, requiredTeacherCount: 1, teacherPoolSize: 1, requiredClassroomType: RoomType.Art },
    { name: "Chorus", electiveType: ElectiveType.FineArts, eligibleGradeLevels: ALL_GRADES, isYearLong: false, allowsMultipleSections: false, requiredTeacherCount: 1, teacherPoolSize: 1 },

    // General (9). Tiered by grade so the real ranked-pool size lands on config.rankedListLength's
    // targets (6th:4, 7th:6, 8th:12) — see the pool-size design note in the PR write-up.
    // "Core" tier (ALL_GRADES) — every grade sees these 4, plus Chorus above = 4 total for 6th.
    { name: "Spanish 1", electiveType: ElectiveType.General, eligibleGradeLevels: ALL_GRADES, isYearLong: true, allowsMultipleSections: true, requiredTeacherCount: 1, teacherPoolSize: 1, requiredClassroomType: RoomType.Spanish, minSectionSize: 15, maxSectionSize: 25 }, // H16
    // Skill Builders stays ALL_GRADES deliberately — assignRequiredElectives assigns it with no
    // grade check, so grade-restricting it here would silently violate H20 for ineligible grades.
    { name: "Skill Builders", electiveType: ElectiveType.General, eligibleGradeLevels: ALL_GRADES, isYearLong: false, allowsMultipleSections: false, requiredTeacherCount: 1, teacherPoolSize: 1 }, // H13
    { name: "Chess Club", electiveType: ElectiveType.General, eligibleGradeLevels: ALL_GRADES, isYearLong: false, allowsMultipleSections: false, requiredTeacherCount: 1, teacherPoolSize: 1 }, // combinable w/ Board Games
    // "Upper" tier (7th+8th) — 2 more, bringing 7th to 6 total.
    { name: "Board Games", electiveType: ElectiveType.General, eligibleGradeLevels: GRADES_7_AND_8, isYearLong: false, allowsMultipleSections: false, requiredTeacherCount: 1, teacherPoolSize: 1 }, // combinable w/ Chess Club
    { name: "Journalism", electiveType: ElectiveType.General, eligibleGradeLevels: GRADES_7_AND_8, isYearLong: false, allowsMultipleSections: false, requiredTeacherCount: 1, teacherPoolSize: 1 },
    // "Senior" tier (8th only) — 4 more here, plus Band/Art above = 6 more, bringing 8th to 12.
    { name: "Service Learning", electiveType: ElectiveType.General, eligibleGradeLevels: GRADE_8_ONLY, isYearLong: false, allowsMultipleSections: false, requiredTeacherCount: 1, teacherPoolSize: 1, needsEligibleStudentIdsLater: true }, // H14
    { name: "Broadcast Media", electiveType: ElectiveType.General, eligibleGradeLevels: GRADE_8_ONLY, isYearLong: false, allowsMultipleSections: false, requiredTeacherCount: 2, teacherPoolSize: 2, minSectionSize: 6, maxSectionSize: 12 }, // H18
    { name: "Yearbook", electiveType: ElectiveType.General, eligibleGradeLevels: GRADE_8_ONLY, isYearLong: false, allowsMultipleSections: false, requiredTeacherCount: 1, teacherPoolSize: 2 }, // S6: multi-teacher pool, count still 1
    { name: "Robotics", electiveType: ElectiveType.General, eligibleGradeLevels: GRADE_8_ONLY, isYearLong: false, allowsMultipleSections: false, requiredTeacherCount: 1, teacherPoolSize: 1, requiredClassroomType: RoomType.ComputerLab },
];

export function buildElectives(config: Config, rng: () => number, teachers: Teacher[]): { electives: Elective[]; weights: Map<number, number> } {
    const teacherIds = teachers.map(t => t.id);
    // shuffle a rank order independent of catalog-writing order, so popularity isn't
    // correlated with where an elective happens to sit in the hardcoded list above
    const popularityOrder = shuffle(rng, electiveCatalog.map((_, i) => i));

    const electives: Elective[] = [];
    const weights = new Map<number, number>();

    electiveCatalog.forEach((spec, i) => {
        const id = i + 1;
        const eligibleTeacherIds = shuffle(rng, teacherIds).slice(0, spec.teacherPoolSize);

        const elective: Elective = {
            id,
            name: spec.name,
            eligibleTeacherIds,
            electiveType: spec.electiveType,
            isYearLong: spec.isYearLong,
            eligibleGradeLevels: spec.eligibleGradeLevels,
            allowsMultipleSections: spec.allowsMultipleSections,
            requiredTeacherCount: spec.requiredTeacherCount,
            ...(spec.requiredClassroomType !== undefined && { requiredClassroomType: spec.requiredClassroomType }),
            ...(spec.minSectionSize !== undefined && { minSectionSize: spec.minSectionSize }),
            ...(spec.maxSectionSize !== undefined && { maxSectionSize: spec.maxSectionSize }),
            // eligibleStudentIds intentionally omitted for needsEligibleStudentIdsLater rows —
            // see the type comment above; a later step patches this in once students exist.
        };
        electives.push(elective);

        const popularityRank = popularityOrder.indexOf(i) + 1;
        weights.set(id, 1 / Math.pow(popularityRank, config.skewExponent));
    });

    return { electives, weights };
}

export function buildStudents(config: Config, rng: () => number): Student[]{
    let currId: number = 0;
    const students: Student[] = [];
    const mockFirstNames = ["Liam", "Olivia", "Noah", "Emma", "Ethan", "Sophia", "Mason", "Ava", "Lucas", "Isabella", "Elijah", "Mia", "James", "Charlotte", "Benjamin"];
    const mockLastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson"];

    for (const [gradeLevel, count] of Object.entries(config.gradeSizes)){
        let counter = 0;

        while (counter < count){
            students.push({
                id: currId + 1,
                firstName: pick(rng, mockFirstNames),
                lastName: pick(rng, mockLastNames),
                grade: gradeLevel as Grade,
                takenElectiveIds: [],
                requiredElectiveIds: [],
            })
            counter++;
            currId++;
        }
    }

    return students
}

export function assignRequiredElectives(config: Config, electives: Elective[], students: Student[], rng: () => number ): Student[]{
    const spanishOneElectiveId = electives.filter((elective) => elective.name === "Spanish 1")[0].id
    const skillBuildersElectiveId = electives.filter((elective) => elective.name === "Skill Builders")[0].id
    const peElectives = electives.filter((elective) => elective.electiveType === ElectiveType.PhysicalEducation)
    const studentsWithRequiredElectivesAssigned: Student[] = []

    for (const student of students){
        const copyOfStudent = structuredClone(student)

        // H16 half 1: decide who already has Spanish 1 — into takenElectiveIds, NOT required.
        if (copyOfStudent.grade === Grade["8th"] && rng() < config.rates.spanishAlreadyTaken){
            copyOfStudent.takenElectiveIds.push(spanishOneElectiveId)
        }

        copyOfStudent.requiredElectiveIds.push(pick(rng, peElectives).id)

        // H16 half 2: require it for every 8th grader NOT already in takenElectiveIds.
        if (copyOfStudent.grade === Grade["8th"] && !copyOfStudent.takenElectiveIds.includes(spanishOneElectiveId)){
            copyOfStudent.requiredElectiveIds.push(spanishOneElectiveId)
        }

        if (rng() < config.rates.skillBuilders){
            copyOfStudent.requiredElectiveIds.push(skillBuildersElectiveId)
        }
        studentsWithRequiredElectivesAssigned.push(copyOfStudent)
    }

    return studentsWithRequiredElectivesAssigned;
}

export function assignServiceLearningEligibility(config: Config, electives: Elective[], students: Student[], rng: () => number): Elective[] {
    const eighthGraders = students.filter(s => s.grade === Grade["8th"]);
    const eligibleIds = eighthGraders.filter(() => rng() < config.rates.serviceLearningEligible).map(s => s.id);

    if (eligibleIds.length === 0) {
        eligibleIds.push(pick(rng, eighthGraders).id);
    }

    return electives.map(e =>
        e.name === "Service Learning" ? { ...e, eligibleStudentIds: eligibleIds } : e
    );
}

export function buildPreferences(students: Student[], electives: Elective[], weights: Map<number, number>, rng: () => number): Preference[]{
    const preferences: Preference[] = []
    for (const student of students){
        // rules.md: "PE options and assigned electives are excluded" from the ranked pool —
        // PE is a choose-one UI pick (H19), not something students rank against each other,
        // so ALL PE electives are excluded here, not just the one that became required.
        const pool = electives.filter((elective) =>
            elective.eligibleGradeLevels.includes(student.grade) &&
            elective.electiveType !== ElectiveType.PhysicalEducation &&
            !student.requiredElectiveIds.includes(elective.id)
        )
        const poolWeights = pool.map(e => weights.get(e.id)!)

        preferences.push({ studentId: student.id, rankedElectiveIds: weightedSampleWithoutReplacement(rng, pool, poolWeights, pool.length).map(e => e.id) })
    }

    return preferences
}

export function buildCombinableGroups(electives: Elective[]): CombinableGroup[] {
    const chessClubId = electives.find(e => e.name === "Chess Club")!.id;
    const boardGamesId = electives.find(e => e.name === "Board Games")!.id;

    return [
        { id: 1, electiveIds: [chessClubId, boardGamesId] }
    ];
}

export function buildLockedAssignments(students: Student[], blocks: Block[], rng: () => number): LockedAssignment[] {
    const student = pick(rng, students);
    const electiveId = pick(rng, student.requiredElectiveIds);
    const blockId = pick(rng, blocks).id;

    return [
        { studentId: student.id, electiveId, blockId }
    ];
}

export function buildSolverConfig(config: Config): SolverOutputConfig {
    return {
        weights: config.weights,
        timeLimitSeconds: config.timeLimitSeconds,
        randomSeed: config.randomSeed
    };
}