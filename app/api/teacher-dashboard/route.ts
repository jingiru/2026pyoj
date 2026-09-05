import { type NextRequest, NextResponse } from "next/server";
import { isTeacherRequestAuthenticated } from "@/lib/teacher-auth";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { getStudentGradeClassId, isStudentGradeClassId } from "@/lib/student-class";
import type { Student, SubmissionWithStudent } from "@/lib/types";

const DASHBOARD_SUBMISSION_COLUMNS =
  "id, student_id, problem_id, status, passed_count, total_count, created_at, students(student_no, name, is_guest)";
const SUBMISSION_HISTORY_COLUMNS =
  "id, student_id, problem_id, code, status, passed_count, total_count, feedback, created_at, students(student_no, name, is_guest)";
const DEFAULT_DASHBOARD_CLASS_ID = "2-1";

export async function GET(request: NextRequest) {
  if (!isTeacherRequestAuthenticated(request)) {
    return NextResponse.json(
      { ok: false, message: "교사 로그인이 필요합니다." },
      { status: 401 }
    );
  }

  const supabase = createSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, message: "교사 대시보드의 Supabase 설정이 없습니다." },
      { status: 500 }
    );
  }

  const studentId = request.nextUrl.searchParams.get("studentId")?.trim();
  const problemId = request.nextUrl.searchParams.get("problemId")?.trim();
  if (studentId || problemId) {
    if (!studentId || !problemId) {
      return NextResponse.json(
        { ok: false, message: "학생과 문제 정보가 모두 필요합니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("submissions")
      .select(SUBMISSION_HISTORY_COLUMNS)
      .eq("student_id", studentId)
      .eq("problem_id", problemId)
      .order("created_at", { ascending: false });

    if (error) return dashboardError(error);
    return NextResponse.json({
      ok: true,
      submissions: (data ?? []) as unknown as SubmissionWithStudent[]
    });
  }

  const rawAfter = request.nextUrl.searchParams.get("after");
  const after =
    rawAfter && Number.isFinite(new Date(rawAfter).getTime())
      ? new Date(rawAfter).toISOString()
      : null;
  const requestedBookId = request.nextUrl.searchParams.get("bookId")?.trim() || null;
  const requestedClassId =
    request.nextUrl.searchParams.get("classId")?.trim() || DEFAULT_DASHBOARD_CLASS_ID;

  if (
    requestedClassId !== "all" &&
    requestedClassId !== "guest" &&
    !isStudentGradeClassId(requestedClassId)
  ) {
    return NextResponse.json(
      { ok: false, message: "올바른 학급을 선택해주세요." },
      { status: 400 }
    );
  }

  const requestedBookResult = requestedBookId
    ? await supabase
        .from("problem_books")
        .select("id")
        .eq("id", requestedBookId)
        .maybeSingle()
    : { data: null, error: null };
  if (requestedBookResult.error) return dashboardError(requestedBookResult.error);

  const fallbackBookResult = requestedBookResult.data
    ? { data: null, error: null }
    : await supabase
        .from("problem_books")
        .select("id")
        .order("sort_order")
        .order("id")
        .limit(1)
        .maybeSingle();
  if (fallbackBookResult.error) return dashboardError(fallbackBookResult.error);

  const selectedBookId = requestedBookResult.data?.id ?? fallbackBookResult.data?.id;
  if (!selectedBookId) {
    return NextResponse.json(
      { ok: false, message: "조회할 문제집이 없습니다." },
      { status: 404 }
    );
  }

  const [problemResult, studentResult] = await Promise.all([
    supabase.from("problems").select("id").eq("book_id", selectedBookId),
    supabase
      .from("students")
      .select("id, student_no, name, is_guest, created_at")
      .order("student_no")
  ]);
  const scopeError = problemResult.error ?? studentResult.error;
  if (scopeError) return dashboardError(scopeError);

  const problemIds = (problemResult.data ?? []).map((problem) => problem.id);
  const students = (studentResult.data ?? []) as Student[];
  const scopedStudentIds = students
    .filter((student) => matchesDashboardClass(student, requestedClassId))
    .map((student) => student.id);
  const submissionPageSize = 1000;
  const submissionData: SubmissionWithStudent[] = [];
  let submissionError = null;

  if (problemIds.length > 0 && (requestedClassId === "all" || scopedStudentIds.length > 0)) {
    if (after) {
      for (let from = 0; ; from += submissionPageSize) {
        let query = supabase
          .from("submissions")
          .select(DASHBOARD_SUBMISSION_COLUMNS)
          .in("problem_id", problemIds)
          .gte("created_at", after)
          .order("created_at", { ascending: true })
          .order("id", { ascending: true })
          .range(from, from + submissionPageSize - 1);
        if (requestedClassId !== "all") query = query.in("student_id", scopedStudentIds);

        const { data, error } = await query;
        if (error) {
          submissionError = error;
          break;
        }

        const page = (data ?? []) as unknown as SubmissionWithStudent[];
        submissionData.push(...page);
        if (page.length < submissionPageSize) break;
      }
    } else {
      for (let from = 0; ; from += submissionPageSize) {
        let query = supabase
          .from("submissions")
          .select(DASHBOARD_SUBMISSION_COLUMNS)
          .in("problem_id", problemIds)
          .order("created_at", { ascending: false })
          .range(from, from + submissionPageSize - 1);
        if (requestedClassId !== "all") query = query.in("student_id", scopedStudentIds);

        const { data, error } = await query;
        if (error) {
          submissionError = error;
          break;
        }

        const page = (data ?? []) as unknown as SubmissionWithStudent[];
        submissionData.push(...page);
        if (page.length < submissionPageSize) break;
      }
    }
  }

  if (submissionError) return dashboardError(submissionError);

  return NextResponse.json({
    ok: true,
    submissions: submissionData,
    students: after ? [] : students,
    scope: {
      bookId: selectedBookId,
      classId: requestedClassId
    }
  });
}

function matchesDashboardClass(student: Student, classId: string) {
  if (classId === "all") return true;
  if (classId === "guest") return Boolean(student.is_guest);
  return !student.is_guest && getStudentGradeClassId(student.student_no) === classId;
}

function dashboardError(error: {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}) {
  console.error("[Teacher dashboard]", {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint
  });
  return NextResponse.json(
    {
      ok: false,
      message: "대시보드 데이터를 불러오지 못했습니다.",
      code: error.code
    },
    { status: 500 }
  );
}
