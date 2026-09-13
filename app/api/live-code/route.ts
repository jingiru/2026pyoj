import { createHmac } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { isTeacherRequestAuthenticated } from "@/lib/teacher-auth";

// Short-lived JWTs grant access to exactly one student's private channel.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const admin = createSupabaseAdmin();
  const secret = process.env.SUPABASE_JWT_SECRET?.trim();
  if (!admin || !secret) return NextResponse.json({ message: "실시간 지도 서버 설정이 필요합니다." }, { status: 503 });
  const teacher = body?.role === "teacher";
  if (teacher && !isTeacherRequestAuthenticated(request)) return NextResponse.json({ message: "교사 로그인이 필요합니다." }, { status: 401 });
  if (typeof body?.studentId !== "string") return NextResponse.json({ message: "학생 정보가 필요합니다." }, { status: 400 });
  const { data: student, error } = await admin.from("students").select("id, student_no, name, is_guest").eq("id", body.studentId).maybeSingle();
  if (error) return NextResponse.json({ message: "학생 정보를 확인하지 못했습니다." }, { status: 500 });
  if (!student || student.is_guest || (!teacher && (student.student_no !== body.studentNo || student.name !== body.name))) {
    return NextResponse.json({ message: "학생 로그인 정보를 확인해주세요." }, { status: 403 });
  }
  const now = Math.floor(Date.now() / 1000);
  const topic = `live-code:${student.id}`;
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const payload = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({
    role: "pyoj_live_code", sub: student.id, iss: "supabase", aud: "authenticated", iat: now, exp: now + 300,
    app_metadata: { live_code_topic: topic, live_code_role: teacher ? "teacher" : "student" }
  })}`;
  const token = `${payload}.${createHmac("sha256", secret).update(payload).digest("base64url")}`;
  return NextResponse.json({ token, topic }, { headers: { "Cache-Control": "no-store" } });
}
