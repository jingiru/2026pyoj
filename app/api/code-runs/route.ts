import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { getStudentClassId } from "@/lib/student-class";

type CodeRunPayload = {
  studentId?: unknown;
  problemId?: unknown;
  code?: unknown;
  stdin?: unknown;
  stdout?: unknown;
  stderr?: unknown;
  status?: unknown;
  executionTimeMs?: unknown;
  guestToken?: unknown;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as CodeRunPayload | null;
  const allowedStatuses = ["success", "runtime_error", "time_limit", "system_error"];
  if (
    typeof body?.studentId !== "string" ||
    typeof body.problemId !== "string" ||
    typeof body.code !== "string" ||
    typeof body.stdin !== "string" ||
    typeof body.stdout !== "string" ||
    typeof body.stderr !== "string" ||
    typeof body.status !== "string" ||
    !allowedStatuses.includes(body.status)
  ) {
    return NextResponse.json(
      { ok: false, message: "실행 로그 데이터가 올바르지 않습니다." },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, message: "실행 로그 서버 설정이 없습니다." },
      { status: 500 }
    );
  }
  const { data: student } = await supabase
    .from("students")
    .select("student_no, is_guest, guest_token")
    .eq("id", body.studentId)
    .single();
  if (
    !student ||
    (student.is_guest &&
      (typeof body.guestToken !== "string" ||
        student.guest_token !== body.guestToken))
  ) {
    return NextResponse.json({ ok: false, message: "실행 로그 저장 권한이 없습니다." }, { status: 403 });
  }
  if (!(await canAccessProblem(supabase, student, body.problemId))) {
    return NextResponse.json({ ok: false, message: "이 학급에 공개된 문제가 아닙니다." }, { status: 403 });
  }

  const executionTimeMs =
    typeof body.executionTimeMs === "number" && Number.isFinite(body.executionTimeMs)
      ? Math.max(0, Math.round(body.executionTimeMs))
      : null;
  const { data, error } = await supabase
    .from("code_runs")
    .insert({
      student_id: body.studentId,
      problem_id: body.problemId,
      language: "python",
      code: body.code,
      stdin: body.stdin,
      stdout: body.stdout,
      stderr: body.stderr,
      status: body.status,
      execution_time_ms: executionTimeMs
    })
    .select("id")
    .single();

  if (error) {
    console.error("[Code run]", error);
    return NextResponse.json(
      { ok: false, message: "실행 로그를 저장하지 못했습니다.", code: error.code },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, id: data.id });
}

async function canAccessProblem(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdmin>>,
  student: { student_no: string; is_guest: boolean },
  problemId: string
) {
  if (student.is_guest) return true;
  const { data: problem, error } = await supabase
    .from("problems")
    .select("is_published, visibility_scope, visible_class_ids")
    .eq("id", problemId)
    .single();
  if (error || !problem || !problem.is_published) return false;
  if (problem.visibility_scope !== "classes") return true;
  const classId = getStudentClassId(student.student_no);
  return Boolean(classId && Array.isArray(problem.visible_class_ids) && problem.visible_class_ids.includes(classId));
}
