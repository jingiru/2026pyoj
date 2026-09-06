import { getStudentClassId } from "./student-class";

type PracticeStudent = {
  student_no: string;
  is_guest: boolean;
};

type PracticeProblem = {
  is_published: boolean;
  visibility_scope: string | null;
  visible_class_ids: string[] | null;
};

export function canAccessPracticeProblem(
  student: PracticeStudent,
  problem: PracticeProblem
) {
  if (student.is_guest) return true;
  if (!problem.is_published) return false;
  if (problem.visibility_scope !== "classes") return true;
  const classId = getStudentClassId(student.student_no);
  return Boolean(
    classId &&
      Array.isArray(problem.visible_class_ids) &&
      problem.visible_class_ids.includes(classId)
  );
}
