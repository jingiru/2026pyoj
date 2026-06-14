import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import {
  getRequestIp,
  guestDisplayCode
} from "@/lib/guest-identity";
import type { Student } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { token?: unknown } | null;
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  if (token.length < 32 || token.length > 200) {
    return NextResponse.json(
      { ok: false, message: "비로그인 사용자 정보가 올바르지 않습니다." },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, message: "비로그인 세션 서버 설정이 없습니다." },
      { status: 500 }
    );
  }

  const ipAddress = getRequestIp(request);
  const code = guestDisplayCode(token);
  const studentNo = `비로그인-${code}`;
  const name = `익명 ${code}`;
  const now = new Date().toISOString();
  const { data: existing, error: selectError } = await supabase
    .from("students")
    .select("id, student_no, name, is_guest, created_at")
    .eq("guest_token", token)
    .maybeSingle();

  if (selectError) return databaseError(selectError, "비로그인 정보를 조회하지 못했습니다.");

  if (existing) {
    const { data, error } = await supabase
      .from("students")
      .update({ last_login_at: now, last_ip: ipAddress })
      .eq("id", existing.id)
      .select("id, student_no, name, is_guest, created_at")
      .single();
    if (error) return databaseError(error, "비로그인 정보를 갱신하지 못했습니다.");
    return NextResponse.json({ ok: true, student: data as Student });
  }

  const { data, error } = await supabase
    .from("students")
    .insert({
      student_no: studentNo,
      name,
      is_guest: true,
      guest_token: token,
      last_ip: ipAddress,
      first_login_at: now,
      last_login_at: now,
      login_count: 1
    })
    .select("id, student_no, name, is_guest, created_at")
    .single();

  if (error) return databaseError(error, "비로그인 정보를 저장하지 못했습니다.");
  return NextResponse.json({ ok: true, student: data as Student });
}

function databaseError(error: { code?: string; message: string }, message: string) {
  console.error("[Guest session]", error);
  return NextResponse.json({ ok: false, message, code: error.code }, { status: 500 });
}
