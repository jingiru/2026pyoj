import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import type { Student } from "@/lib/types";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    studentNo?: unknown;
    name?: unknown;
  } | null;
  const studentNo = typeof body?.studentNo === "string" ? body.studentNo.trim() : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!/^\d{4}$/.test(studentNo) || name.length < 2) {
    return NextResponse.json(
      { ok: false, message: "학번과 이름을 올바르게 입력해주세요." },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, message: "학생 로그인 서버 설정이 없습니다." },
      { status: 500 }
    );
  }

  const { data: existing, error: selectError } = await supabase
    .from("students")
    .select("id, student_no, name, is_guest, created_at")
    .eq("student_no", studentNo)
    .maybeSingle();

  if (selectError) {
    await logAccess(supabase, request, studentNo, name, "login_failure", null, selectError.message);
    return dataErrorResponse(selectError, "학생 정보를 조회하지 못했습니다.");
  }

  if (existing && existing.name !== name) {
    await logAccess(
      supabase,
      request,
      studentNo,
      name,
      "login_failure",
      existing.id,
      "등록된 이름과 일치하지 않습니다."
    );
    return NextResponse.json(
      { ok: false, message: "학번과 이름이 일치하지 않습니다." },
      { status: 401 }
    );
  }

  if (existing) {
    const { data: updated, error: updateError } = await supabase
      .from("students")
      .update({
        last_login_at: new Date().toISOString(),
        login_count: await nextLoginCount(supabase, existing.id)
      })
      .eq("id", existing.id)
      .select("id, student_no, name, is_guest, created_at")
      .single();
    await logAccess(
      supabase,
      request,
      studentNo,
      name,
      updateError ? "login_failure" : "login_success",
      existing.id,
      updateError?.message ?? null
    );
    if (updateError) return dataErrorResponse(updateError, "로그인 정보를 갱신하지 못했습니다.");
    return NextResponse.json({ ok: true, student: updated as Student });
  }

  const { data, error } = await supabase
    .from("students")
    .insert({
      student_no: studentNo,
      name,
      first_login_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
      login_count: 1
    })
    .select("id, student_no, name, is_guest, created_at")
    .single();

  if (error?.code === "23505") {
    const { data: concurrentStudent, error: retryError } = await supabase
      .from("students")
      .select("id, student_no, name, is_guest, created_at")
      .eq("student_no", studentNo)
      .single();
    if (!retryError) {
      await logAccess(supabase, request, studentNo, name, "login_success", concurrentStudent.id, null);
      return NextResponse.json({ ok: true, student: concurrentStudent as Student });
    }
  }

  if (error) {
    await logAccess(supabase, request, studentNo, name, "login_failure", null, error.message);
    return dataErrorResponse(error, "현재 신규 학생 등록은 불가능합니다");
  }
  await logAccess(supabase, request, studentNo, name, "login_success", data.id, null);
  return NextResponse.json({ ok: true, student: data as Student });
}

async function nextLoginCount(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdmin>>,
  studentId: string
) {
  const { data } = await supabase.from("students").select("login_count").eq("id", studentId).single();
  return Number(data?.login_count ?? 0) + 1;
}

async function logAccess(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdmin>>,
  request: NextRequest,
  studentNo: string,
  name: string,
  eventType: string,
  studentId: string | null,
  failureReason: string | null
) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const { error } = await supabase.from("student_access_logs").insert({
    student_id: studentId,
    entered_student_no: studentNo,
    entered_name: name,
    event_type: eventType,
    ip_address: forwardedFor || null,
    user_agent: request.headers.get("user-agent"),
    failure_reason: failureReason
  });
  if (error) console.error("[Student access log]", error);
}

function dataErrorResponse(error: { code?: string; message: string }, message: string) {
  console.error("[Student login]", error);
  return NextResponse.json(
    { ok: false, message, code: error.code },
    { status: 500 }
  );
}
