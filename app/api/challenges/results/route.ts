import { NextRequest, NextResponse } from "next/server";
import { allRows, challengeDb, fail } from "@/lib/challenge-server";
import type { Challenge, ChallengeBonusScore, ChallengeParticipant, ChallengeSubmission } from "@/lib/challenge-types";
import { ASSESSMENT_CODES, assessmentResult } from "@/lib/temporary-challenge-results";

export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  try {
    const { studentNo, name } = await request.json();
    if (typeof studentNo !== "string" || !/^\d{4}$/.test(studentNo) || typeof name !== "string" || !name.trim() || name.length > 30) return fail(new Error("학번 4자리와 이름을 입력해주세요."));
    const db = challengeDb();
    const { data, error } = await db.from("challenges").select("*").in("entry_code", [...ASSESSMENT_CODES[1], ...ASSESSMENT_CODES[2]]);
    if (error) throw error;
    const challenges = (data ?? []) as Challenge[];
    if (!challenges.length) return NextResponse.json({ ok: true, results: [] }, { headers: { "Cache-Control": "no-store" } });
    const participants = await allRows<ChallengeParticipant>((from, to) => db.from("challenge_participants").select("id,challenge_id").eq("student_no", studentNo).eq("name", name.trim()).in("challenge_id", challenges.map(row => row.id)).order("id").range(from, to));
    const results = await Promise.all(participants.map(async participant => {
      const challenge = challenges.find(row => row.id === participant.challenge_id)!;
      if (!challenge.started_at || !challenge.ends_at || Date.parse(challenge.ends_at) > Date.now()) return null;
      const [submissions, bonus] = await Promise.all([
        allRows<ChallengeSubmission>((from, to) => db.from("challenge_submissions").select("id,problem_id,status,received_at,code").eq("challenge_id", challenge.id).eq("participant_id", participant.id).order("received_at").order("id").range(from, to)),
        allRows<ChallengeBonusScore>((from, to) => db.from("challenge_bonus_scores").select("criterion_id,score").eq("challenge_id", challenge.id).eq("participant_id", participant.id).order("criterion_id").range(from, to))
      ]);
      const round = (ASSESSMENT_CODES[2] as readonly string[]).includes(challenge.entry_code!) ? 2 : 1;
      return assessmentResult(challenge, submissions, bonus, round);
    }));
    return NextResponse.json({ ok: true, results: results.filter(row => row !== null).sort((a, b) => a.round - b.round) }, { headers: { "Cache-Control": "no-store" } });
  } catch { return fail(new Error("점수를 조회하지 못했습니다. 잠시 후 다시 시도해주세요."), 500); }
}
