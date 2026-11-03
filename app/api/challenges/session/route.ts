import { NextRequest, NextResponse } from "next/server";
import { allRows, challengeDb, fail, newIdentity, participantFor, setIdentity, tokenHash } from "@/lib/challenge-server";
import { publicChallenge, type Challenge, type ChallengeBonusScore, type ChallengeSubmission } from "@/lib/challenge-types";

export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (typeof body.entryCode !== "string" || !/^[A-Z0-9]{8}$/i.test(body.entryCode.trim()) ||
      typeof body.studentNo !== "string" || !/^\d{4}$/.test(body.studentNo) ||
      typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 30) return fail(new Error("입장코드, 학번 4자리, 이름을 확인해주세요."));
    // Each explicit entry creates a fresh session, independent of old browser cookies.
    const token = newIdentity();
    const db = challengeDb();
    const { data: challenge, error } = await db.from("challenges").select("id").eq("entry_code", body.entryCode.trim().toUpperCase()).maybeSingle();
    if (error) throw error;
    if (!challenge) return fail(new Error("입장코드가 올바르지 않습니다."), 404);
    const name = body.name.trim();
    const findParticipant = () => db.from("challenge_participants").select("id,name")
      .eq("challenge_id", challenge.id).eq("student_no", body.studentNo).maybeSingle();
    let { data: existing, error: existingError } = await findParticipant();
    if (existingError) throw existingError;
    if (!existing) {
      const { error: joinError } = await db.from("challenge_participants").insert({ challenge_id: challenge.id, student_no: body.studentNo, name, token_hash: tokenHash(token) });
      if (joinError?.code === "23505") {
        // Another entry may have registered this student while this request was in flight.
        const result = await findParticipant();
        if (result.error) throw result.error;
        existing = result.data;
        if (!existing) throw joinError;
      } else if (joinError) throw joinError;
    }
    if (existing) {
      if (existing.name.trim() !== name) return fail(new Error("이미 등록된 학번입니다. 처음 입장할 때 입력한 이름을 확인해주세요."), 409);
      // Preserve the participant ID and all submissions/scores; replace only the session token.
      const { data: rebound, error: rejoinError } = await db.from("challenge_participants")
        .update({ token_hash: tokenHash(token) }).eq("challenge_id", challenge.id).eq("id", existing.id)
        .eq("name", existing.name).select("id").maybeSingle();
      if (rejoinError) throw rejoinError;
      if (!rebound) return fail(new Error("참여 정보가 변경되었습니다. 다시 입장해주세요."), 409);
    }
    const response = NextResponse.json({ ok: true, challengeId: challenge.id });
    setIdentity(response, token);
    return response;
  } catch (error) { return fail(error); }
}

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return fail(new Error("입장코드를 입력해주세요."), 401);
    const participant = await participantFor(request, id);
    if (!participant) return fail(new Error("입장코드를 입력해 다시 입장해주세요."), 401);
    const db = challengeDb();
    const { data, error } = await db.from("challenges").select("*").eq("id", id).single();
    if (error) throw error;
    const challenge = data as Challenge;
    const submissions = await allRows<ChallengeSubmission>((from, to) => db.from("challenge_submissions")
      .select("id,participant_id,challenge_id,problem_id,status,received_at,feedback,passed_count,total_count,requirement_passed,requirement_feedback")
      .eq("challenge_id", id).eq("participant_id", participant.id).order("received_at").order("id").range(from, to));
    const bonusScores = await allRows<ChallengeBonusScore>((from, to) => db.from("challenge_bonus_scores").select("challenge_id,participant_id,criterion_id,score")
      .eq("challenge_id", id).eq("participant_id", participant.id).range(from, to));
    let leaderboard = null;
    if (challenge.show_leaderboard && challenge.started_at) {
      const [participants, accepted] = await Promise.all([
        allRows((from, to) => db.from("challenge_participants").select("id,student_no,name").eq("challenge_id", id).order("id").range(from, to)),
        allRows((from, to) => db.from("challenge_submissions").select("id,participant_id,problem_id,status,received_at,requirement_passed").eq("challenge_id", id).eq("status", "accepted").order("received_at").order("id").range(from, to))
      ]);
      leaderboard = { participants, submissions: accepted };
    }
    return NextResponse.json({ ok: true, participant, challenge: publicChallenge(challenge), submissions, bonusScores, leaderboard, serverNow: new Date().toISOString() });
  } catch (error) { return fail(error, 500); }
}
