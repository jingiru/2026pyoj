export type ChallengeResultSortKey = "rank" | "studentNo" | "name" | "score";
export type ChallengeResultSortDirection = "asc" | "desc";

export type ChallengeResultSortableRow = {
  participant: { id: string; student_no: string; name: string };
  solved: number;
  score: number;
};

export function rankChallengeResults(rows: ChallengeResultSortableRow[]) {
  return new Map(rows.map((row) => [
    row.participant.id,
    rows.filter((candidate) => candidate.solved > row.solved).length + 1
  ]));
}

export function sortChallengeResults<T extends ChallengeResultSortableRow>(
  rows: T[],
  sortBy: ChallengeResultSortKey,
  direction: ChallengeResultSortDirection
) {
  const ranks = rankChallengeResults(rows);
  return [...rows].sort((left, right) => {
    let comparison = 0;
    if (sortBy === "rank") {
      comparison = ranks.get(left.participant.id)! - ranks.get(right.participant.id)!;
    } else if (sortBy === "studentNo") {
      comparison = left.participant.student_no.localeCompare(right.participant.student_no, "ko", { numeric: true });
    } else if (sortBy === "name") {
      comparison = left.participant.name.localeCompare(right.participant.name, "ko");
    } else {
      comparison = left.score - right.score;
    }

    if (comparison !== 0) return direction === "asc" ? comparison : -comparison;
    return left.participant.student_no.localeCompare(right.participant.student_no, "ko", { numeric: true })
      || left.participant.name.localeCompare(right.participant.name, "ko");
  });
}
