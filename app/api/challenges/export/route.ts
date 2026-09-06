import { NextRequest, NextResponse } from "next/server";
import { allRows, challengeDb, fail } from "@/lib/challenge-server";
import { buildChallengeResultsWorkbook, type ChallengeExportOptions } from "@/lib/challenge-export";
import type { Challenge, ChallengeParticipant, ChallengeSubmission } from "@/lib/challenge-types";
import { isTeacherRequestAuthenticated } from "@/lib/teacher-auth";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  if (!isTeacherRequestAuthenticated(request)) return fail(new Error("교사 인증이 필요합니다."), 401);
  try {
    const body = await request.json();
    if (typeof body.challengeId !== "string") return fail(new Error("챌린지를 선택해주세요."));
    const options: ChallengeExportOptions = {
      includeFirstSolver: body.includeFirstSolver === true,
      includeSubmissionTimes: body.includeSubmissionTimes === true,
      includeAttemptCounts: body.includeAttemptCounts === true
    };
    const db = challengeDb();
    const [{ data: challenge, error }, participants, submissions] = await Promise.all([
      db.from("challenges").select("*").eq("id", body.challengeId).single(),
      allRows<ChallengeParticipant>((from, to) => db.from("challenge_participants")
        .select("id,challenge_id,student_no,name,joined_at")
        .eq("challenge_id", body.challengeId).order("student_no").order("id").range(from, to)),
      allRows<ChallengeSubmission>((from, to) => db.from("challenge_submissions")
        .select("id,participant_id,challenge_id,problem_id,status,received_at,passed_count,total_count")
        .eq("challenge_id", body.challengeId).order("received_at").order("id").range(from, to))
    ]);
    if (error || !challenge) throw error ?? new Error("챌린지를 찾을 수 없습니다.");
    const workbook = await buildChallengeResultsWorkbook(
      challenge as Challenge,
      participants,
      submissions,
      options
    );
    const bytes = await workbook.xlsx.writeBuffer();
    const safeTitle = (challenge as Challenge).title.replace(/[\\/:*?"<>|]/g, "_").slice(0, 80) || "챌린지";
    const encodedName = encodeURIComponent(`${safeTitle}_결과.xlsx`);
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="challenge-results.xlsx"; filename*=UTF-8''${encodedName}`,
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    return fail(error, 500);
  }
}
