import { type NextRequest, NextResponse } from "next/server";
import { isTeacherRequestAuthenticated } from "@/lib/teacher-auth";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import type { Student, SubmissionWithStudent } from "@/lib/types";

const DASHBOARD_SUBMISSION_COLUMNS =
  "id, student_id, problem_id, status, passed_count, total_count, created_at, students(student_no, name, is_guest)";
const SUBMISSION_HISTORY_COLUMNS =
  "id, student_id, problem_id, code, status, passed_count, total_count, feedback, created_at, students(student_no, name, is_guest)";

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
  const submissionPageSize = 1000;
  const submissionData: SubmissionWithStudent[] = [];
  let submissionError = null;

  if (after) {
    const { data, error } = await supabase
      .from("submissions")
      .select(DASHBOARD_SUBMISSION_COLUMNS)
      .order("created_at", { ascending: false })
      .gt("created_at", after)
      .limit(1000);

    if (error) submissionError = error;
    else submissionData.push(...((data ?? []) as unknown as SubmissionWithStudent[]));
  } else {
    for (let from = 0; ; from += submissionPageSize) {
      const { data, error } = await supabase
        .from("submissions")
        .select(DASHBOARD_SUBMISSION_COLUMNS)
        .order("created_at", { ascending: false })
        .range(from, from + submissionPageSize - 1);

      if (error) {
        submissionError = error;
        break;
      }

      const page = (data ?? []) as unknown as SubmissionWithStudent[];
      submissionData.push(...page);
      if (page.length < submissionPageSize) break;
    }
  }

  const { data: studentData, error: studentError } = after
    ? { data: [], error: null }
    : await supabase
        .from("students")
        .select("id, student_no, name, is_guest, created_at")
        .order("student_no");

  const error = submissionError ?? studentError;
  if (error) return dashboardError(error);

  return NextResponse.json({
    ok: true,
    submissions: submissionData,
    students: (studentData ?? []) as Student[]
  });
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
