import { NextRequest, NextResponse } from "next/server";
import { challengeDb, fail, participantFor } from "@/lib/challenge-server";
import { judgeChallenge } from "@/lib/challenge-judge";
import type { Problem } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (typeof body.challengeId !== "string" || typeof body.problemId !== "string" || typeof body.code !== "string" ||
      !body.code.trim() || body.code.length > 20000 || typeof body.requestId !== "string" || !/^[0-9a-f-]{36}$/i.test(body.requestId)) return fail(new Error("제출할 코드를 확인해주세요. 최대 20,000자까지 제출할 수 있습니다."));
    const participant = await participantFor(request, body.challengeId);
    if (!participant) return fail(new Error("챌린지 입장이 필요합니다."), 401);
    const db = challengeDb();
    // The database locks the challenge and validates its deadline before accepting a submission.
    const { data: receipt, error } = await db.rpc("challenge_receive_submission", {
      p_challenge: body.challengeId, p_participant: participant.id, p_problem: body.problemId,
      p_code: body.code, p_request: body.requestId
    });
    if (error) return fail(error, 409);
    if (!receipt.fresh) return NextResponse.json({ ok: true, submission: receipt.submission });
    let result;
    try { result = await judgeChallenge(receipt.problem as Problem, body.code); }
    catch (error) {
      console.error("[Challenge judge]", error);
      result = { status: "runtime_error", passed_count: 0, total_count: receipt.problem.testCases.length, feedback: "채점 실행이 중단되었습니다. 코드를 확인한 후 다시 제출해주세요." };
    }
    const { data: submission, error: saveError } = await db.from("challenge_submissions").update({ ...result, judged_at: new Date().toISOString() })
      .eq("id", receipt.submission.id).eq("status", "pending").select("id,participant_id,challenge_id,problem_id,status,received_at,feedback,passed_count,total_count").single();
    if (saveError) throw saveError;
    return NextResponse.json({ ok: true, submission });
  } catch (error) { return fail(error, 500); }
}
