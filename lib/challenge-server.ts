import { createHash, randomBytes, randomInt } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "./supabase-admin";

export const CHALLENGE_COOKIE = "pyoj_challenge_identity";
export function challengeDb() {
  const db = createSupabaseAdmin();
  if (!db) throw new Error("챌린지 서버 설정이 없습니다. Supabase 환경변수를 확인해주세요.");
  return db;
}
export function identity(request: NextRequest) {
  const token = request.cookies.get(CHALLENGE_COOKIE)?.value;
  return token && /^[a-f0-9]{64}$/.test(token) ? token : null;
}
export function tokenHash(token: string) { return createHash("sha256").update(token).digest("hex"); }
export function newIdentity() { return randomBytes(32).toString("hex"); }
export const CHALLENGE_CODE_ALPHABET = "ACDEFGHJKLMNPQRSTUVWXYZ2345679";
export function generateChallengeEntryCode(length = 8) {
  return Array.from(
    { length },
    () => CHALLENGE_CODE_ALPHABET[randomInt(CHALLENGE_CODE_ALPHABET.length)]
  ).join("");
}
export function setIdentity(response: NextResponse, token: string) {
  response.cookies.set(CHALLENGE_COOKIE, token, { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
}
export async function participantFor(request: NextRequest, challengeId: string) {
  const token = identity(request);
  if (!token) return null;
  const { data, error } = await challengeDb().from("challenge_participants")
    .select("id, challenge_id, student_no, name, joined_at")
    .eq("challenge_id", challengeId).eq("token_hash", tokenHash(token)).maybeSingle();
  if (error) throw error;
  return data;
}
export function fail(error: unknown, status = 400) {
  const raw = error instanceof Error ? error.message : (error as { message?: string })?.message ?? "요청을 처리하지 못했습니다.";
  const message = /schema cache|does not exist/.test(raw) ? "챌린지 DB 설치가 필요합니다. README의 챌린지 설정을 확인해주세요." : raw;
  return NextResponse.json({ ok: false, message }, { status });
}
export async function allRows<T>(query: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: unknown }>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await query(from, from + 999);
    if (error) throw error;
    rows.push(...(data ?? []) as T[]);
    if (!data || data.length < 1000) return rows;
  }
}
