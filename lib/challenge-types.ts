import type { Problem, SubmissionStatus } from "./types";

export type ChallengeProblem = Problem & { points?: number };
export type ChallengeScoring =
  | { mode: "problem_points" }
  | { mode: "correct_count"; base_score: number; free_correct_count: number; points_per_additional: number };
export type BonusCriterion = { id: string; label: string; max_score: number; score_options: number[] };
export type ChallengeBonusScore = { challenge_id: string; participant_id: string; criterion_id: string; score: number };

export type Challenge = {
  id: string;
  title: string;
  entry_code?: string;
  duration_minutes: number;
  show_leaderboard: boolean;
  started_at: string | null;
  ends_at: string | null;
  created_at: string;
  problem_snapshots: ChallengeProblem[];
  scoring?: ChallengeScoring;
  bonus_criteria?: BonusCriterion[];
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
  bonusScores: ChallengeBonusScore[];
  serverNow: string;
};

export function problemPoints(problem: ChallengeProblem) {
  return Number.isFinite(problem.points) && (problem.points ?? 0) > 0 ? Number(problem.points) : 1;
}

export function challengeProblemMax(challenge: Pick<Challenge, "problem_snapshots" | "scoring">) {
  if (challenge.scoring?.mode === "correct_count") {
    const count = challenge.problem_snapshots.length;
    return challenge.scoring.base_score + Math.max(0, count - challenge.scoring.free_correct_count) * challenge.scoring.points_per_additional;
  }
  return challenge.problem_snapshots.reduce((sum, problem) => sum + problemPoints(problem), 0);
}

export function challengeBonusMax(challenge: Pick<Challenge, "bonus_criteria">) {
  return (challenge.bonus_criteria ?? []).reduce((sum, criterion) => sum + criterion.max_score, 0);
}

export function earnedProblemScore(challenge: Pick<Challenge, "problem_snapshots" | "scoring">, submissions: ChallengeSubmission[]) {
  const accepted = new Set(submissions.filter(row => row.status === "accepted").map(row => row.problem_id));
  if (challenge.scoring?.mode === "correct_count") {
    return challenge.scoring.base_score + Math.max(0, accepted.size - challenge.scoring.free_correct_count) * challenge.scoring.points_per_additional;
  }
  return challenge.problem_snapshots.reduce((sum, problem) => sum + (accepted.has(problem.id) ? problemPoints(problem) : 0), 0);
}

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
