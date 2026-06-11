import { type NextRequest, NextResponse } from "next/server";
import { getTeacherPassword, isTeacherRequestAuthenticated } from "@/lib/teacher-auth";

export async function GET(request: NextRequest) {
  if (!getTeacherPassword()) {
    return NextResponse.json(
      { ok: false, message: "교사 인증 설정이 없습니다." },
      { status: 500 }
    );
  }

  if (!isTeacherRequestAuthenticated(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
