import { SolverInput } from "@saop/schema";

export function assertConsistent(input: SolverInput): void {
    const studentIds = new Set(input.students.map(s => s.id));
    const electiveIds = new Set(input.electives.map(e => e.id));
    const teacherIds = new Set(input.teachers.map(t => t.id));
    const blockIds = new Set(input.blocks.map(b => b.id));
    const roomTypesInUse = new Set(input.rooms.map(r => r.type));

    // Worked example — every eligibleTeacherIds entry must reference a real teacher.
    for (const elective of input.electives) {
        for (const teacherId of elective.eligibleTeacherIds) {
            if (!teacherIds.has(teacherId)) {
                throw new Error(
                    `Elective ${elective.id} (${elective.name}) references eligibleTeacherIds ${teacherId}, but no such teacher exists.`
                );
            }
        }
    }

    // TODO: every preference.studentId ∈ students
    for (const preference of input.preferences) { 
        if (!studentIds.has(preference.studentId)) {
            throw new Error(
                `Preference for student with id #${preference.studentId} references nonexisting student`
            )
        }

        for (const electiveId of preference.rankedElectiveIds){
            if (!electiveIds.has(electiveId)) {
                throw new Error (
                    `Preference for student with id #${preference.studentId} references an elective with an id of ${electiveId} that does not exist.`
                )
            }
        }
    }


    for (const student of input.students){
        for (const id of student.requiredElectiveIds){
            if (!electiveIds.has(id)) {
                throw new Error (
                    `Required Elective for student with id #${student.id} references an elective with an id of ${id} that does not exist.`
                )
            }
        }

        for (const id of student.takenElectiveIds){
            if (!electiveIds.has(id)) {
                throw new Error (
                    `Taken Elective for student with id #${student.id} references an elective with an id of ${id} that does not exist.`
                )
            }
        }
    }

    for (const elective of input.electives){
        if (elective.requiredClassroomType && !roomTypesInUse.has(elective.requiredClassroomType)){
            throw new Error (
                `Room type for elective with id ${elective.id} but no room of that type exists.`
            )
        }
    }

    for (const group of input.combinableGroups){
        for (const electiveId of group.electiveIds){
            if (!electiveIds.has(electiveId)) {
                throw new Error (
                    `Elective Group with an id #${group.id} references an elective with an id of ${electiveId} that does not exist`
                )
            }
        }
    }



    for (const locked of input.lockedAssignments) {
        if (!studentIds.has(locked.studentId)) {
            throw new Error(
                `LockedAssignment references student ${locked.studentId}, but no such student exists.`
            );
        }

        if (!electiveIds.has(locked.electiveId)) {
            throw new Error(
                `LockedAssignment references elective ${locked.electiveId}, but no such elective exists.`
            );
        }

        if (locked.blockId !== undefined && !blockIds.has(locked.blockId)) {
            throw new Error(
                `LockedAssignment references block ${locked.blockId}, but no such block exists.`
            );
        }
    }
}
