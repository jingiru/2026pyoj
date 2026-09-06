import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { isTeacherRequestAuthenticated } from "@/lib/teacher-auth";
import { loadCurriculum } from "@/lib/curriculum-server";
import { allRows, challengeDb, fail } from "@/lib/challenge-server";
import type { Challenge, ChallengeParticipant, ChallengeSubmission } from "@/lib/challenge-types";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  if (!isTeacherRequestAuthenticated(request)) return fail(new Error("교사 인증이 필요합니다."), 401);
  try {
    const db = challengeDb();
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      const challenges = await allRows<Challenge>((from, to) => db.from("challenges")
        .select("id,title,entry_code,duration_minutes,show_leaderboard,started_at,ends_at,created_at")
        .order("created_at", { ascending: false }).order("id").range(from, to));
      return NextResponse.json({ ok: true, challenges });
    }
    const { data: challenge, error } = await db.from("challenges").select("*").eq("id", id).single();
    if (error) throw error;
    const participantId = request.nextUrl.searchParams.get("participantId");
    const problemId = request.nextUrl.searchParams.get("problemId");
    if (participantId && problemId) {
      const submissions = await allRows<ChallengeSubmission>((from, to) => db.from("challenge_submissions").select("*")
        .eq("challenge_id", id).eq("participant_id", participantId).eq("problem_id", problemId)
        .order("received_at", { ascending: false }).order("id").range(from, to));
      return NextResponse.json({ ok: true, submissions });
    }
    const [participants, submissions, events] = await Promise.all([
      allRows<ChallengeParticipant>((from, to) => db.from("challenge_participants").select("id,challenge_id,student_no,name,joined_at").eq("challenge_id", id).order("student_no").order("id").range(from, to)),
      allRows<ChallengeSubmission>((from, to) => db.from("challenge_submissions").select("id,participant_id,challenge_id,problem_id,status,received_at,passed_count,total_count").eq("challenge_id", id).order("received_at").order("id").range(from, to)),
      allRows((from, to) => db.from("challenge_events").select("id,action,minutes,created_at").eq("challenge_id", id).order("created_at").order("id").range(from, to))
    ]);
    return NextResponse.json({ ok: true, challenge, participants, submissions, events, serverNow: new Date().toISOString() });
  } catch (error) { return fail(error, 500); }
}

export async function POST(request: NextRequest) {
  if (!isTeacherRequestAuthenticated(request)) return fail(new Error("교사 인증이 필요합니다."), 401);
  try {
    const body = await request.json();
    const db = challengeDb();
    if (body.action === "create") {
      if (typeof body.title !== "string" || !body.title.trim() || body.title.length > 100 ||
        !Number.isInteger(body.minutes) || body.minutes < 1 || body.minutes > 480 ||
        !Array.isArray(body.problemIds) || !body.problemIds.length || body.problemIds.length > 50 ||
        body.problemIds.some((id: unknown) => typeof id !== "string") || new Set(body.problemIds).size !== body.problemIds.length) {
        return fail(new Error("제목, 제한시간(1~480분), 문제(1~50개)를 확인해주세요."));
      }
      const { problems } = await loadCurriculum(db, false);
      const snapshots = body.problemIds.map((id: string) => problems.find((problem) => problem.id === id));
      if (snapshots.some((problem: typeof problems[number] | undefined) => !problem || !problem.testCases.length)) return fail(new Error("선택한 문제에 채점 테스트가 없습니다."));
      for (let attempt = 0; attempt < 3; attempt++) {
        const { data, error } = await db.from("challenges").insert({ title: body.title.trim(), duration_minutes: body.minutes,
          show_leaderboard: body.showLeaderboard === true, entry_code: randomBytes(4).toString("hex").toUpperCase(), problem_snapshots: snapshots }).select("*").single();
        if (!error) return NextResponse.json({ ok: true, challenge: data });
        if (error.code !== "23505") throw error;
      }
      throw new Error("입장코드를 생성하지 못했습니다. 다시 시도해주세요.");
    }
    if (!["start", "extend"].includes(body.action) || typeof body.id !== "string" ||
      !Number.isInteger(body.minutes) || body.minutes < 1 || body.minutes > 480) return fail(new Error("진행 설정을 확인해주세요."));
    const { data, error } = await db.rpc("challenge_control", { p_id: body.id, p_action: body.action, p_minutes: body.minutes });
    if (error) throw error;
    return NextResponse.json({ ok: true, challenge: data, serverNow: new Date().toISOString() });
  } catch (error) { return fail(error); }
}
