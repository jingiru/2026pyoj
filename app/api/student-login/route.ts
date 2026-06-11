import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import type { Student } from "@/lib/types";

export async function POST(request: Request) {
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
    .select("id, student_no, name, created_at")
    .eq("student_no", studentNo)
    .eq("name", name)
    .maybeSingle();

  if (selectError) return dataErrorResponse(selectError, "학생 정보를 조회하지 못했습니다.");
  if (existing) return NextResponse.json({ ok: true, student: existing as Student });

  const { data, error } = await supabase
    .from("students")
    .insert({ student_no: studentNo, name })
    .select("id, student_no, name, created_at")
    .single();

  if (error?.code === "23505") {
    const { data: concurrentStudent, error: retryError } = await supabase
      .from("students")
      .select("id, student_no, name, created_at")
      .eq("student_no", studentNo)
      .eq("name", name)
      .single();
    if (!retryError) {
      return NextResponse.json({ ok: true, student: concurrentStudent as Student });
    }
  }

  if (error) return dataErrorResponse(error, "학생 정보를 저장하지 못했습니다.");
  return NextResponse.json({ ok: true, student: data as Student });
}

function dataErrorResponse(error: { code?: string; message: string }, message: string) {
  console.error("[Student login]", error);
  return NextResponse.json(
    { ok: false, message, code: error.code },
    { status: 500 }
  );
}
