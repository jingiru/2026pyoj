import { NextRequest, NextResponse } from "next/server";
import { isTeacherRequestAuthenticated } from "@/lib/teacher-auth";
import { loadCurriculum } from "@/lib/curriculum-server";
import { allRows, challengeDb, fail, generateChallengeEntryCode } from "@/lib/challenge-server";
import type { BonusCriterion, Challenge, ChallengeBonusScore, ChallengeParticipant, ChallengeScoringGroup, ChallengeSubmission } from "@/lib/challenge-types";

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
    const [participants, submissions, bonusScores] = await Promise.all([
      allRows<ChallengeParticipant>((from, to) => db.from("challenge_participants").select("id,challenge_id,student_no,name,joined_at").eq("challenge_id", id).order("student_no").order("id").range(from, to)),
      allRows<ChallengeSubmission>((from, to) => db.from("challenge_submissions").select("id,participant_id,challenge_id,problem_id,status,received_at,passed_count,total_count").eq("challenge_id", id).order("received_at").order("id").range(from, to)),
      allRows<ChallengeBonusScore>((from, to) => db.from("challenge_bonus_scores").select("challenge_id,participant_id,criterion_id,score").eq("challenge_id", id).range(from, to))
    ]);
    return NextResponse.json({ ok: true, challenge, participants, submissions, bonusScores, serverNow: new Date().toISOString() });
  } catch (error) { return fail(error, 500); }
}

export async function POST(request: NextRequest) {
  if (!isTeacherRequestAuthenticated(request)) return fail(new Error("교사 인증이 필요합니다."), 401);
  try {
    const body = await request.json();
    const db = challengeDb();
    if (body.action === "set_bonus_score") {
      if (typeof body.id !== "string" || typeof body.participantId !== "string" || typeof body.criterionId !== "string" ||
        typeof body.score !== "number" || !Number.isFinite(body.score)) return fail(new Error("부가점수 요청을 확인해주세요."));
      const { data: challenge, error: challengeError } = await db.from("challenges").select("bonus_criteria").eq("id", body.id).single();
      if (challengeError) throw challengeError;
      const criterion = (challenge.bonus_criteria as BonusCriterion[]).find(item => item.id === body.criterionId);
      if (!criterion || !criterion.score_options.includes(body.score) || body.score < 0 || body.score > criterion.max_score) return fail(new Error("미리 설정한 점수표에서 점수를 선택해주세요."));
      const { data, error } = await db.from("challenge_bonus_scores").upsert({ challenge_id: body.id, participant_id: body.participantId, criterion_id: body.criterionId, score: body.score, updated_at: new Date().toISOString() }, { onConflict: "challenge_id,participant_id,criterion_id" }).select("challenge_id,participant_id,criterion_id,score").single();
      if (error) throw error;
      return NextResponse.json({ ok: true, bonusScore: data });
    }
    if (body.action === "create") {
      if (typeof body.title !== "string" || !body.title.trim() || body.title.length > 100 ||
        !Number.isInteger(body.minutes) || body.minutes < 1 || body.minutes > 480 ||
        !Array.isArray(body.problemIds) || !body.problemIds.length || body.problemIds.length > 50 ||
        body.problemIds.some((id: unknown) => typeof id !== "string") || new Set(body.problemIds).size !== body.problemIds.length) {
        return fail(new Error("제목, 제한시간(1~480분), 문제(1~50개)를 확인해주세요."));
      }
      const pointEntries = Array.isArray(body.problemPoints) ? body.problemPoints : [];
      const points = new Map(pointEntries.map((entry: unknown) => {
        const item = entry as { id?: unknown; points?: unknown }; return [item.id, item.points];
      }));
      if (body.problemIds.some((id: string) => typeof points.get(id) !== "number" || !Number.isFinite(points.get(id)) || Number(points.get(id)) <= 0)) return fail(new Error("모든 문제의 배점은 0보다 커야 합니다."));
      const scoring = body.scoring?.mode === "grouped_correct_count"
        ? { mode: "grouped_correct_count", groups: body.scoring.groups as ChallengeScoringGroup[] }
        : body.scoring?.mode === "correct_count"
          ? { mode: "correct_count", base_score: Number(body.scoring.base_score), free_correct_count: 1, points_per_additional: Number(body.scoring.points_per_additional) }
          : { mode: "problem_points" };
      if (scoring.mode === "correct_count") {
        const countScoring = scoring as { mode: "correct_count"; base_score: number; points_per_additional: number };
        if (!Number.isFinite(countScoring.base_score) || countScoring.base_score < 0 || !Number.isFinite(countScoring.points_per_additional) || countScoring.points_per_additional <= 0) return fail(new Error("정답 개수별 점수 설정을 확인해주세요."));
      }
      if (scoring.mode === "grouped_correct_count") {
        const groups = Array.isArray(scoring.groups) ? scoring.groups : [];
        const assigned = groups.flatMap(group => Array.isArray(group.problem_ids) ? group.problem_ids : []);
        const validGroups = groups.length > 0 && groups.length <= body.problemIds.length && new Set(groups.map(group => group.id)).size === groups.length &&
          assigned.length === body.problemIds.length && new Set(assigned).size === assigned.length && body.problemIds.every((id: string) => assigned.includes(id)) &&
          groups.every(group => typeof group.id === "string" && /^[a-zA-Z0-9-]{1,80}$/.test(group.id) && typeof group.label === "string" && group.label.trim().length > 0 && group.label.length <= 40 &&
            Number.isFinite(group.base_score) && group.base_score >= 0 && group.free_correct_count === 1 && Number.isFinite(group.points_per_additional) && group.points_per_additional > 0);
        if (!validGroups) return fail(new Error("그룹별 점수 설정을 확인해주세요."));
      }
      const bonusCriteria = (Array.isArray(body.bonusCriteria) ? body.bonusCriteria : []) as BonusCriterion[];
      const validBonus = bonusCriteria.length <= 10 && new Set(bonusCriteria.map(item => item.id)).size === bonusCriteria.length && bonusCriteria.every(item =>
        typeof item.id === "string" && /^[a-zA-Z0-9-]{1,80}$/.test(item.id) && typeof item.label === "string" && item.label.trim().length > 0 && item.label.length <= 40 &&
        typeof item.max_score === "number" && Number.isFinite(item.max_score) && item.max_score > 0 && Array.isArray(item.score_options) && item.score_options.length > 0 &&
        item.score_options.every(score => typeof score === "number" && Number.isFinite(score) && score >= 0 && score <= item.max_score) && new Set(item.score_options).size === item.score_options.length);
      if (!validBonus) return fail(new Error("부가점수 항목과 점수표를 확인해주세요."));
      const { problems } = await loadCurriculum(db, false);
      const snapshots = body.problemIds.map((id: string) => { const problem = problems.find(item => item.id === id); return problem ? { ...problem, points: Number(points.get(id)) } : undefined; });
      if (snapshots.some((problem: typeof problems[number] | undefined) => !problem || !problem.testCases.length)) return fail(new Error("선택한 문제에 채점 테스트가 없습니다."));
      for (let attempt = 0; attempt < 3; attempt++) {
        const { data, error } = await db.from("challenges").insert({ title: body.title.trim(), duration_minutes: body.minutes,
          show_leaderboard: body.showLeaderboard === true, entry_code: generateChallengeEntryCode(), problem_snapshots: snapshots, scoring, bonus_criteria: bonusCriteria }).select("*").single();
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
