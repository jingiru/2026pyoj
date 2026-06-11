import { NextResponse } from "next/server";
import { clearTeacherSessionCookie } from "@/lib/teacher-auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearTeacherSessionCookie(response);
  return response;
}
