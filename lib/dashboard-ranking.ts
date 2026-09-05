export function getAccuracy(accepted: number, submitted: number): number {
  return submitted === 0 ? 0 : (accepted / submitted) * 100;
}

type RankedStudent = {
  student: { id: string };
  accepted: number;
  accuracy: number;
};

export function rankStudents(rows: readonly RankedStudent[]): Map<string, number> {
  const ranked = [...rows].sort(
    (left, right) => right.accepted - left.accepted || right.accuracy - left.accuracy
  );
  let rank = 0;
  return new Map(ranked.map((row, index) => {
    const previous = ranked[index - 1];
    if (!previous || previous.accepted !== row.accepted || previous.accuracy !== row.accuracy) {
      rank = index + 1;
    }
    return [row.student.id, rank];
  }));
}
