import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { isTeacherRequestAuthenticated } from "@/lib/teacher-auth";

// Database leases are shared across serverless instances; idle students use HTTP only.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const teacher = body?.role === "teacher";
  const reply = (value: object, status = 200) => NextResponse.json(value, { status, headers: { "Cache-Control": "no-store" } });
  if (teacher && !isTeacherRequestAuthenticated(request)) return reply({ active: false }, 401);
  if (typeof body?.studentId !== "string") return reply({ active: false }, 400);
  const admin = createSupabaseAdmin();
  if (!admin) return reply({ active: false }, 503);
  const { data: student, error } = await admin.from("students").select("id, student_no, name, is_guest").eq("id", body.studentId).maybeSingle();
  if (error) return reply({ active: false }, 500);
  if (!student || student.is_guest || (!teacher && (student.student_no !== body.studentNo || student.name !== body.name))) return reply({ active: false }, 403);
  if (teacher) {
    if (typeof body.sessionId !== "string" || !/^[0-9a-f-]{36}$/i.test(body.sessionId)) return reply({ active: false }, 400);
    const leases = admin.from("live_code_monitors");
    const result = body.stop
      ? await leases.delete().eq("session_id", body.sessionId).eq("student_id", student.id)
      : await leases.upsert({ session_id: body.sessionId, student_id: student.id, expires_at: new Date(Date.now() + 30000).toISOString() }, { onConflict: "session_id" });
    return reply({ active: !body.stop && !result.error }, result.error ? 503 : 200);
  }
  const { data, error: leaseError } = await admin.from("live_code_monitors").select("session_id").eq("student_id", student.id).gt("expires_at", new Date().toISOString()).limit(1);
  return reply({ active: !leaseError && Boolean(data?.length) }, leaseError ? 503 : 200);
}
