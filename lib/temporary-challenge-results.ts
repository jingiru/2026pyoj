import { earnedProblemScore, problemPoints, type Challenge, type ChallengeBonusScore, type ChallengeSubmission } from "./challenge-types";

// Temporary assessment lookup. Remove this module, its API and UI together.
export const ASSESSMENT_CODES = {
  1: ["DGRN56TE", "JHPVN97K", "X5W3MTUL", "MRDPM5W6", "HY4YVACQ", "95FS7R7E", "EK74N7HD", "ZDFUGAWZ"],
  2: ["LQSCC7C3", "724EP4EZ", "4EXMM29Y", "97XW7AZC", "VUZ3EL3W", "WMSLCHPR", "7DKXMHMD", "UGX46X3V"]
} as const;

export function assessmentResult(challenge: Challenge, submissions: ChallengeSubmission[], bonusScores: ChallengeBonusScore[], round: number) {
  const scoreFor = (points: number, max: number) => {
    const problems = challenge.problem_snapshots.filter(problem => problemPoints(problem) === points);
    const ids = new Set(problems.map(problem => problem.id));
    const scoring = challenge.scoring?.mode === "grouped_correct_count"
      ? { ...challenge.scoring, groups: challenge.scoring.groups.filter(group => group.problem_ids.every(id => ids.has(id))) }
      : undefined;
    const solved = new Set(submissions.filter(row => row.status === "accepted" && ids.has(row.problem_id)).map(row => row.problem_id)).size;
    const earned = scoring?.groups.length ? earnedProblemScore({ problem_snapshots: problems, scoring }, submissions) : 4 + Math.max(0, solved - 1) * points;
    return Math.min(max, Math.max(4, earned));
  };
  const criterion = challenge.bonus_criteria?.find(item => item.label.replace(/\s/g, "").includes("코드이해도"));
  const bonus = bonusScores.find(row => row.criterion_id === criterion?.id);
  const understanding = bonus ? Math.min(10, Math.max(4, Number(bonus.score))) : null;
  const onePoint = scoreFor(1, 8), twoPoint = scoreFor(2, 12);
  return {
    round, title: challenge.title, onePoint, twoPoint, understanding,
    total: understanding === null ? null : onePoint + twoPoint + understanding,
    problems: challenge.problem_snapshots.map((problem, index) => {
      const rows = submissions.filter(row => row.problem_id === problem.id).sort((a, b) => a.received_at.localeCompare(b.received_at) || a.id.localeCompare(b.id));
      const latest = rows.at(-1);
      return { number: index + 1, title: problem.title, statement: problem.statement, inputDescription: problem.inputDescription, outputDescription: problem.outputDescription,
        examples: problem.examples?.length ? problem.examples : problem.testCases.filter(test => test.isSample),
        solved: rows.some(row => row.status === "accepted"), status: latest?.status ?? null, code: latest?.code ?? null };
    })
  };
}
export type AssessmentResult = ReturnType<typeof assessmentResult>;
