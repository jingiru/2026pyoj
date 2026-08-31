export const CLASS_VISIBILITY_OPTIONS = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "M1",
  "M2",
  "M3",
  "M4"
];

export function getStudentClassId(studentNo: string) {
  if (!/^\d{4}$/.test(studentNo)) return null;
  const grade = studentNo.charAt(0);
  const classNo = studentNo.charAt(1);
  return grade === "3" && ["1", "2", "3", "4"].includes(classNo) ? `M${classNo}` : classNo;
}

export function formatClassLabel(classId: string) {
  return classId.startsWith("M") ? classId : `${classId}반`;
}

export function getStudentGradeClassId(studentNo: string) {
  if (!/^\d{4}$/.test(studentNo)) return null;
  return `${studentNo.charAt(0)}-${studentNo.charAt(1)}`;
}

export function isStudentGradeClassId(classId: string) {
  return /^[1-9]-[1-9]$/.test(classId);
}
