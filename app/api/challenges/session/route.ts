import { NextRequest, NextResponse } from "next/server";
import { allRows, challengeDb, fail, identity, newIdentity, participantFor, setIdentity, tokenHash } from "@/lib/challenge-server";
import { publicChallenge, type Challenge, type ChallengeSubmission } from "@/lib/challenge-types";

export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (typeof body.entryCode !== "string" || !/^[a-f0-9]{8}$/i.test(body.entryCode.trim()) ||
      typeof body.studentNo !== "string" || !/^\d{4}$/.test(body.studentNo) ||
      typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 30) return fail(new Error("입장코드, 학번 4자리, 이름을 확인해주세요."));
    const token = identity(request) ?? newIdentity();
    const db = challengeDb();
    const { data: challenge, error } = await db.from("challenges").select("id").eq("entry_code", body.entryCode.trim().toUpperCase()).maybeSingle();
    if (error) throw error;
    if (!challenge) return fail(new Error("입장코드가 올바르지 않습니다."), 404);
    const { data: existing, error: existingError } = await db.from("challenge_participants").select("id,student_no,token_hash")
      .eq("challenge_id", challenge.id).or(`student_no.eq.${body.studentNo},token_hash.eq.${tokenHash(token)}`);
    if (existingError) throw existingError;
    if (existing?.some((row) => row.token_hash !== tokenHash(token) || row.student_no !== body.studentNo)) return fail(new Error("이미 참여 중인 학번 또는 브라우저입니다. 처음 입장한 브라우저와 학번을 사용해주세요."), 409);
    if (!existing?.length) {
      const { error: joinError } = await db.from("challenge_participants").insert({ challenge_id: challenge.id, student_no: body.studentNo, name: body.name.trim(), token_hash: tokenHash(token) });
      if (joinError) return fail(new Error(joinError.code === "23505" ? "이미 입장한 학번입니다. 처음 입장한 브라우저를 사용해주세요." : joinError.message), 409);
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
      .select("id,participant_id,challenge_id,problem_id,status,received_at,feedback,passed_count,total_count")
      .eq("challenge_id", id).eq("participant_id", participant.id).order("received_at").order("id").range(from, to));
    let leaderboard = null;
    if (challenge.show_leaderboard && challenge.started_at) {
      const [participants, accepted] = await Promise.all([
        allRows((from, to) => db.from("challenge_participants").select("id,student_no,name").eq("challenge_id", id).order("id").range(from, to)),
        allRows((from, to) => db.from("challenge_submissions").select("id,participant_id,problem_id,status,received_at").eq("challenge_id", id).eq("status", "accepted").order("received_at").order("id").range(from, to))
      ]);
      leaderboard = { participants, submissions: accepted };
    }
    return NextResponse.json({ ok: true, participant, challenge: publicChallenge(challenge), submissions, leaderboard, serverNow: new Date().toISOString() });
  } catch (error) { return fail(error, 500); }
}
