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

// Hoisted out of buildRooms: the section-size estimates below need it too.
const ROOM_CAPACITY: Record<RoomType, number> = {
    [RoomType.Art]: 25,
    [RoomType.Band]: 20,
    [RoomType.ComputerLab]: 22,
    [RoomType.GeneralClassroom]: 25,
    [RoomType.PE]: 35,
    [RoomType.Spanish]: 20
}

export function buildRooms(config: Config): Room[]{
    const rooms: Room[] = [];
    let id = 1;

    for (const [type, count] of Object.entries(config.roomCount)){
        for (let i = 0; i < count; i++){
            rooms.push({
                id: id,
                roomNumber: 100 + id,
                type: type as RoomType,
                capacity: ROOM_CAPACITY[type as RoomType]
            })
            id++
        }
    }
    
    return rooms
}

const ALL_GRADES: Grade[] = [Grade["6th"], Grade["7th"], Grade["8th"]];
const GRADES_7_AND_8: Grade[] = [Grade["7th"], Grade["8th"]];
const GRADE_8_ONLY: Grade[] = [Grade["8th"]];
const GRADE_6_ONLY: Grade[] = [Grade["6th"]];
const GRADE_7_ONLY: Grade[] = [Grade["7th"]];

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
    // Sections this elective is expected to need. Normally derived from config.gradeSizes
    // (see expectedSections below); set explicitly only where the derivation can't see the
    // real demand. Not solver output — a generator-side estimate used to budget teachers/rooms.
    expectedSections?: number;
    requiredClassroomType?: RoomType;
    minSectionSize?: number;
    maxSectionSize?: number;
    // H14: this elective needs eligibleStudentIds, but student ids don't exist yet at this
    // point in the build order (§4: electives before students) — patched in after buildStudents.
    needsEligibleStudentIdsLater?: boolean;
};

const electiveCatalog: ElectiveSpec[] = [
    { name: "PE - Team Sports", electiveType: ElectiveType.PhysicalEducation, eligibleGradeLevels: ALL_GRADES, isYearLong: false, allowsMultipleSections: true, requiredTeacherCount: 1, teacherPoolSize: 1, requiredClassroomType: RoomType.PE, minSectionSize: 15, maxSectionSize: 25 },
    { name: "PE - Fitness", electiveType: ElectiveType.PhysicalEducation, eligibleGradeLevels: ALL_GRADES, isYearLong: false, allowsMultipleSections: true, requiredTeacherCount: 1, teacherPoolSize: 1, requiredClassroomType: RoomType.PE, minSectionSize: 15, maxSectionSize: 25 },
    { name: "PE - Individual Sports", electiveType: ElectiveType.PhysicalEducation, eligibleGradeLevels: ALL_GRADES, isYearLong: false, allowsMultipleSections: true, requiredTeacherCount: 1, teacherPoolSize: 1, requiredClassroomType: RoomType.PE, minSectionSize: 15, maxSectionSize: 25 },

    { name: "Band", electiveType: ElectiveType.FineArts, eligibleGradeLevels: ALL_GRADES, isYearLong: false, allowsMultipleSections: false, requiredTeacherCount: 1, teacherPoolSize: 1, requiredClassroomType: RoomType.Band },
    { name: "Art", electiveType: ElectiveType.FineArts, eligibleGradeLevels: ALL_GRADES, isYearLong: false, allowsMultipleSections: true, requiredTeacherCount: 1, teacherPoolSize: 1, requiredClassroomType: RoomType.Art },
    { name: "Chorus", electiveType: ElectiveType.FineArts, eligibleGradeLevels: ALL_GRADES, isYearLong: false, allowsMultipleSections: false, requiredTeacherCount: 1, teacherPoolSize: 1, requiredClassroomType: RoomType.GeneralClassroom },
    { name: "6th Grade Theater", electiveType: ElectiveType.FineArts, eligibleGradeLevels: GRADE_6_ONLY, isYearLong: true, allowsMultipleSections: true, requiredTeacherCount: 1, teacherPoolSize: 1 },
    { name: "Speech", electiveType: ElectiveType.General, eligibleGradeLevels: GRADE_6_ONLY, isYearLong: false, allowsMultipleSections: true, requiredTeacherCount: 1, teacherPoolSize: 1 },
    { name: "Student Leadership", electiveType: ElectiveType.General, eligibleGradeLevels: GRADE_7_ONLY, isYearLong: false, allowsMultipleSections: true, requiredTeacherCount: 1, teacherPoolSize: 1 },

    { name: "Spanish 1", electiveType: ElectiveType.General, eligibleGradeLevels: ALL_GRADES, isYearLong: true, allowsMultipleSections: true, requiredTeacherCount: 1, teacherPoolSize: 2, requiredClassroomType: RoomType.Spanish, minSectionSize: 15, maxSectionSize: 25 }, // H16
    // Skill Builders stays ALL_GRADES deliberately — assignRequiredElectives assigns it with no
    // grade check, so grade-restricting it here would silently violate H20 for ineligible grades.
    { name: "Skill Builders", electiveType: ElectiveType.General, eligibleGradeLevels: ALL_GRADES, isYearLong: false, allowsMultipleSections: true, requiredTeacherCount: 1, teacherPoolSize: 1 }, // H13
    { name: "Chess Club", electiveType: ElectiveType.General, eligibleGradeLevels: ALL_GRADES, isYearLong: false, allowsMultipleSections: false, requiredTeacherCount: 1, teacherPoolSize: 1 }, // combinable w/ Board Games
    { name: "Board Games", electiveType: ElectiveType.General, eligibleGradeLevels: GRADES_7_AND_8, isYearLong: false, allowsMultipleSections: true, requiredTeacherCount: 1, teacherPoolSize: 1 }, // combinable w/ Chess Club
    { name: "Journalism", electiveType: ElectiveType.General, eligibleGradeLevels: GRADES_7_AND_8, isYearLong: false, allowsMultipleSections: false, requiredTeacherCount: 1, teacherPoolSize: 1 },
    { name: "Service Learning", electiveType: ElectiveType.General, eligibleGradeLevels: GRADE_8_ONLY, isYearLong: false, allowsMultipleSections: true, requiredTeacherCount: 1, teacherPoolSize: 1, expectedSections: 1, needsEligibleStudentIdsLater: true }, // H14
    { name: "Broadcast Media", electiveType: ElectiveType.General, eligibleGradeLevels: GRADE_8_ONLY, isYearLong: false, allowsMultipleSections: false, requiredTeacherCount: 2, teacherPoolSize: 2, minSectionSize: 6, maxSectionSize: 12 }, // H18
    { name: "Yearbook", electiveType: ElectiveType.General, eligibleGradeLevels: GRADE_8_ONLY, isYearLong: false, allowsMultipleSections: false, requiredTeacherCount: 1, teacherPoolSize: 2 }, // S6: multi-teacher pool, count still 1
    { name: "Robotics", electiveType: ElectiveType.General, eligibleGradeLevels: GRADE_8_ONLY, isYearLong: false, allowsMultipleSections: true, requiredTeacherCount: 1, teacherPoolSize: 1, requiredClassroomType: RoomType.ComputerLab },
];

// H5 caps a teacher at one section per block, and a semester holds
// BlockPosition x ElectiveDay = 4 elective blocks. A year-long section keeps its block in both
// semesters, so both teacher and room budgets are counted in "block-semesters".
const BLOCKS_PER_SEMESTER = 2 * 2;
const SEMESTERS = 2;
const TEACHER_BLOCK_BUDGET = BLOCKS_PER_SEMESTER * SEMESTERS;

const PE_ROW_COUNT = electiveCatalog.filter(s => s.electiveType === ElectiveType.PhysicalEducation).length;

function sectionCapacity(spec: ElectiveSpec): number {
    // an elective with no requiredClassroomType is assumed to land in a general classroom
    const room = ROOM_CAPACITY[spec.requiredClassroomType ?? RoomType.GeneralClassroom];
    return Math.min(room, spec.maxSectionSize ?? room);
}

function blockSemestersPerSection(spec: ElectiveSpec): number {
    return spec.isYearLong ? SEMESTERS : 1;
}

// Slots a grade's reachable electives offer. H19 makes PE a choose-one pick, so the PE rows
// contribute one slot between them, not one each.
function gradePoolSlots(grade: Grade): number {
    return electiveCatalog
        .filter(spec => spec.eligibleGradeLevels.includes(grade))
        .filter(spec => spec.electiveType !== ElectiveType.PhysicalEducation)
        .reduce((sum, spec) => sum + blockSemestersPerSection(spec), 1);
}

// H1 gives every student 8 slots, drawn from whatever their grade can reach — so a grade's
// take rate for any one elective is roughly 8 / gradePoolSlots. Rough on purpose: this only
// has to be good enough to budget teachers and rooms, and it errs high.
function expectedSections(spec: ElectiveSpec, config: Config): number {
    if (spec.expectedSections !== undefined) return spec.expectedSections;
    if (!spec.allowsMultipleSections) return 1; // H15

    const peShare = spec.electiveType === ElectiveType.PhysicalEducation ? PE_ROW_COUNT : 1;
    const enrolled = spec.eligibleGradeLevels.reduce(
        (sum, grade) => sum + (config.gradeSizes[grade] * (8 / gradePoolSlots(grade))) / peShare, 0
    );

    return Math.max(1, Math.ceil(enrolled / sectionCapacity(spec)));
}

// Block-semesters one pool member is charged for carrying this elective. For a pool of one
// (H10's common case — band, PE) this is exact; for larger pools it splits the load, except
// where requiredTeacherCount forces every member on (H18's Broadcast Media).
function teacherLoad(spec: ElectiveSpec, config: Config): number {
    const sections = expectedSections(spec, config) * blockSemestersPerSection(spec);
    return Math.ceil(sections * spec.requiredTeacherCount / spec.teacherPoolSize);
}

// Checks 1 and 2: pure functions of the catalog + config, so they run before any RNG is drawn.
function assertCatalogFitsBudget(config: Config): void {
    for (const spec of electiveCatalog) {
        const load = teacherLoad(spec, config);
        if (load > TEACHER_BLOCK_BUDGET) {
            throw new Error(
                `"${spec.name}" needs ~${expectedSections(spec, config)} section(s), charging each of its ` +
                `${spec.teacherPoolSize} eligible teacher(s) ${load} block-semesters (budget ${TEACHER_BLOCK_BUDGET}). ` +
                `Raise its teacherPoolSize, or pin a smaller expectedSections on the spec.`
            );
        }
    }

    const demand = new Map<RoomType, number>();
    for (const spec of electiveCatalog) {
        const type = spec.requiredClassroomType ?? RoomType.GeneralClassroom;
        const need = expectedSections(spec, config) * blockSemestersPerSection(spec);
        demand.set(type, (demand.get(type) ?? 0) + need);
    }

    for (const [type, need] of demand) {
        const rooms = config.roomCount[type] ?? 0;
        // H23: a general classroom must stay open for at least one block position on both
        // ElectiveDay types, so only half its blocks per semester are bookable for electives.
        const bookableBlocks = type === RoomType.GeneralClassroom ? BLOCKS_PER_SEMESTER / 2 : BLOCKS_PER_SEMESTER;
        const supply = rooms * bookableBlocks * SEMESTERS;
        if (need > supply) {
            throw new Error(
                `${type} is oversubscribed: sections need ${need} block-semesters but ${rooms} room(s) ` +
                `supply ${supply}. Raise roomCount for ${type}.`
            );
        }
    }
}

// Draws each elective's eligibleTeacherIds least-loaded-first rather than independently at
// random, so no teacher ends up sole-eligible for more sections than H5 lets them teach.
function assignTeacherPools(config: Config, teacherIds: number[], rng: () => number): Map<string, number[]> {
    const load = new Map<number, number>(teacherIds.map(id => [id, 0]));
    const pools = new Map<string, number[]>();

    // heaviest electives first, so they commit the scarce budget before the cheap rows do
    const order = [...electiveCatalog].sort((a, b) => teacherLoad(b, config) - teacherLoad(a, config));

    for (const spec of order) {
        const cost = teacherLoad(spec, config);
        const pool = shuffle(rng, teacherIds)                      // shuffle first so ties break randomly
            .sort((a, b) => load.get(a)! - load.get(b)!)
            .slice(0, spec.teacherPoolSize);

        for (const id of pool) {
            const next = load.get(id)! + cost;
            // Check 3: the catalog fits in principle (checks 1-2), but not onto this many staff.
            if (next > TEACHER_BLOCK_BUDGET) {
                throw new Error(
                    `Teacher ${id} would carry ${next} block-semesters (budget ${TEACHER_BLOCK_BUDGET}) ` +
                    `after "${spec.name}". The catalog needs more staff — raise config.teacherCount.`
                );
            }
            load.set(id, next);
        }
        pools.set(spec.name, pool);
    }

    return pools;
}

export function buildElectives(config: Config, rng: () => number, teachers: Teacher[]): { electives: Elective[]; weights: Map<number, number> } {
    const teacherIds = teachers.map(t => t.id);
    // shuffle a rank order independent of catalog-writing order, so popularity isn't
    // correlated with where an elective happens to sit in the hardcoded list above
    const popularityOrder = shuffle(rng, electiveCatalog.map((_, i) => i));

    assertCatalogFitsBudget(config);
    const teacherPools = assignTeacherPools(config, teacherIds, rng);

    const electives: Elective[] = [];
    const weights = new Map<number, number>();

    electiveCatalog.forEach((spec, i) => {
        const id = i + 1;
        const eligibleTeacherIds = teacherPools.get(spec.name)!;

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
            !student.requiredElectiveIds.includes(elective.id) &&
            // H9: already-taken electives are not rankable either — assignRequiredElectives
            // puts Spanish 1 in takenElectiveIds for the 8th graders who've had it.
            !student.takenElectiveIds.includes(elective.id)
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