import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const teacherPassword = process.env.TEACHER_PASSWORD;
  if (!teacherPassword) {
    return NextResponse.json(
      { ok: false, message: "교사 인증 설정이 없습니다." },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "비밀번호를 입력해주세요." },
      { status: 400 }
    );
  }

  const password =
    typeof body === "object" && body !== null && "password" in body
      ? (body as { password?: unknown }).password
      : undefined;

  if (typeof password !== "string" || password !== teacherPassword) {
    return NextResponse.json(
      { ok: false, message: "비밀번호가 올바르지 않습니다." },
      { status: 401 }
    );
  }

  return NextResponse.json({ ok: true });
}
