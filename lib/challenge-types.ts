import type { Problem, SubmissionStatus } from "./types";

export type Challenge = {
  id: string;
  title: string;
  entry_code?: string;
  duration_minutes: number;
  show_leaderboard: boolean;
  started_at: string | null;
  ends_at: string | null;
  created_at: string;
  problem_snapshots: Problem[];
};
export type ChallengeParticipant = {
  id: string;
  challenge_id: string;
  student_no: string;
  name: string;
  joined_at: string;
};
export type ChallengeSubmission = {
  id: string;
  participant_id: string;
  challenge_id: string;
  problem_id: string;
  status: SubmissionStatus | "pending";
  received_at: string;
  code?: string;
  feedback?: string;
  passed_count?: number;
  total_count?: number;
};
export type ChallengeBoard = {
  challenge: Challenge;
  participants: ChallengeParticipant[];
  submissions: ChallengeSubmission[];
  serverNow: string;
  events?: { id: string; action: string; minutes: number; created_at: string }[];
};

export function challengePhase(challenge: Pick<Challenge, "started_at" | "ends_at">, now = Date.now()) {
  if (!challenge.started_at) return "waiting";
  return challenge.ends_at && now < Date.parse(challenge.ends_at) ? "running" : "ended";
}

export function elapsedLabel(start: string | null, end: string | number) {
  if (!start) return "—";
  const seconds = Math.max(0, Math.floor(((typeof end === "number" ? end : Date.parse(end)) - Date.parse(start)) / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

// Preserve server reception order, including ties, regardless of grading completion order.
export function firstSolvers(submissions: ChallengeSubmission[]) {
  const first = new Map<string, ChallengeSubmission>();
  for (const row of [...submissions].sort((a, b) => a.received_at.localeCompare(b.received_at) || a.id.localeCompare(b.id))) {
    if (row.status === "accepted" && !first.has(row.problem_id)) first.set(row.problem_id, row);
  }
  return first;
}

export function publicChallenge(challenge: Challenge, now = Date.now()): Challenge {
  const { entry_code: _code, ...rest } = challenge;
  return {
    ...rest,
    problem_snapshots: challengePhase(challenge, now) === "waiting" ? [] : challenge.problem_snapshots.map((problem) => ({
      ...problem, testCases: [], examples: problem.testCases.filter(test => test.isSample === true)
    }))
  };
}
