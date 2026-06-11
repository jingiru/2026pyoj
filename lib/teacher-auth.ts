import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

const TEACHER_AUTH_COOKIE = "pyoj_teacher_session";
const TEACHER_SESSION_VALUE = "teacher-authenticated";

export function getTeacherPassword() {
  return process.env.TEACHER_PASSWORD?.trim() || null;
}

export function isTeacherPasswordValid(password: string, expectedPassword: string) {
  return safeEqual(password, expectedPassword);
}

export function isTeacherRequestAuthenticated(request: NextRequest) {
  const teacherPassword = getTeacherPassword();
  const cookieValue = request.cookies.get(TEACHER_AUTH_COOKIE)?.value;
  if (!teacherPassword || !cookieValue) return false;
  return safeEqual(cookieValue, createSessionToken(teacherPassword));
}

export function setTeacherSessionCookie(response: NextResponse, teacherPassword: string) {
  response.cookies.set({
    name: TEACHER_AUTH_COOKIE,
    value: createSessionToken(teacherPassword),
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });
}

export function clearTeacherSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: TEACHER_AUTH_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

function createSessionToken(teacherPassword: string) {
  return createHmac("sha256", teacherPassword).update(TEACHER_SESSION_VALUE).digest("hex");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}
