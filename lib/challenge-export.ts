import ExcelJS from "exceljs";
import type {
  Challenge,
  ChallengeBonusScore,
  ChallengeParticipant,
  ChallengeSubmission
} from "./challenge-types";
import { challengeBonusMax, challengeProblemMax, earnedProblemScore, firstSolvers, problemPoints } from "./challenge-types";

export type ChallengeExportOptions = {
  includeFirstSolver: boolean;
  includeSubmissionTimes: boolean;
  includeAttemptCounts: boolean;
  includeGroupScores?: boolean;
};

const KOREA_OFFSET_MS = 9 * 60 * 60 * 1000;

function toKoreaExcelDate(value: string | null) {
  return value ? new Date(Date.parse(value) + KOREA_OFFSET_MS) : null;
}

export async function buildChallengeResultsWorkbook(
  challenge: Challenge,
  participants: ChallengeParticipant[],
  submissions: ChallengeSubmission[],
  options: ChallengeExportOptions,
  bonusScores: ChallengeBonusScore[] = []
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Jingiru Python Beginner Lab";
  workbook.created = new Date();
  workbook.modified = new Date();

  const sheet = workbook.addWorksheet("결과", {
    views: [{ state: "frozen", ySplit: 5, xSplit: 2 }]
  });
  const problems = challenge.problem_snapshots;
  const firstByProblem = firstSolvers(submissions);
  const criteria = challenge.bonus_criteria ?? [];
  const maxScore = challengeProblemMax(challenge) + challengeBonusMax(challenge);
  const scoringGroups = options.includeGroupScores && challenge.scoring?.mode === "grouped_correct_count"
    ? challenge.scoring.groups : [];
  const groupedLayout = options.includeGroupScores === true && challenge.scoring?.mode === "grouped_correct_count";
  const headers = groupedLayout
    ? ["학번", "이름", "총점", ...scoringGroups.map(group => group.label), ...criteria.map(criterion => criterion.label), "총 정답"]
    : ["학번", "이름", "총 정답", "총점", "만점", "문제 점수", "부가점수"];
  const resultEnd = headers.length;
  const problemGroups: Array<{ number: number; from: number; to: number }> = [];

  for (const [index] of problems.entries()) {
    const number = index + 1;
    const from = headers.length + 1;
    headers.push("정오답");
    if (options.includeFirstSolver) headers.push("최초 해결");
    if (options.includeSubmissionTimes) {
      headers.push("첫 제출 시각", "최초 정답 시각", "소요시간");
    }
    if (options.includeAttemptCounts) headers.push("시도 횟수");
    problemGroups.push({ number, from, to: headers.length });
  }
  const bonusFrom = groupedLayout ? 4 + scoringGroups.length : headers.length + 1;
  if (!groupedLayout) headers.push(...criteria.map(criterion => criterion.label));

  const metadataLastColumn = Math.max(headers.length, 9);
  sheet.mergeCells(1, 1, 1, metadataLastColumn);
  sheet.getCell(1, 1).value = challenge.title;
  sheet.getCell(2, 1).value = "입장코드";
  sheet.getCell(2, 2).value = challenge.entry_code ?? "";
  sheet.getCell(2, 4).value = "시작 시각";
  sheet.mergeCells(2, 5, 2, 6);
  sheet.getCell(2, 5).value = toKoreaExcelDate(challenge.started_at);
  sheet.getCell(2, 7).value = "마감 시각";
  sheet.mergeCells(2, 8, 2, 9);
  sheet.getCell(2, 8).value = toKoreaExcelDate(challenge.ends_at);

  sheet.mergeCells(4, 1, 4, 2);
  sheet.getCell(4, 1).value = "학생 정보";
  sheet.mergeCells(4, 3, 4, resultEnd);
  sheet.getCell(4, 3).value = "결과";
  for (const group of problemGroups) {
    if (group.from < group.to) sheet.mergeCells(4, group.from, 4, group.to);
    sheet.getCell(4, group.from).value = `${group.number}번`;
  }
  if (!groupedLayout && criteria.length > 0) {
    if (criteria.length > 1) sheet.mergeCells(4, bonusFrom, 4, headers.length);
    sheet.getCell(4, bonusFrom).value = "부가점수";
  }
  sheet.getRow(5).values = headers;

  const sortedParticipants = [...participants].sort(
    (left, right) => left.student_no.localeCompare(right.student_no, "ko") || left.name.localeCompare(right.name, "ko")
  );
  for (const participant of sortedParticipants) {
    const records = submissions.filter((submission) => submission.participant_id === participant.id);
    const participantBonus = bonusScores.filter(score => score.participant_id === participant.id);
    const bonus = participantBonus.reduce((sum, row) => sum + Number(row.score), 0);
    const problemScore = earnedProblemScore(challenge, records);
    const solved = new Set(records.filter(submission => submission.status === "accepted").map(submission => submission.problem_id)).size;
    const criterionScores = criteria.map(criterion => {
      const score = participantBonus.find(item => item.criterion_id === criterion.id)?.score;
      return score == null ? null : Number(score);
    });
    const row: Array<string | number | Date | null> = groupedLayout ? [
      participant.student_no,
      participant.name,
      problemScore + bonus,
      ...scoringGroups.map(group => earnedProblemScore({
        problem_snapshots: problems,
        scoring: { mode: "grouped_correct_count", groups: [group] }
      }, records)),
      ...criterionScores,
      solved
    ] : [
      participant.student_no,
      participant.name,
      solved,
      problemScore + bonus,
      maxScore,
      problemScore,
      bonus
    ];
    for (const problem of problems) {
      const attempts = records
        .filter((submission) => submission.problem_id === problem.id)
        .sort(compareSubmissionTime);
      const accepted = attempts.find((submission) => submission.status === "accepted");
      row.push(accepted ? "정답" : attempts.length > 0 ? "오답" : "미제출");
      if (options.includeFirstSolver) {
        row.push(firstByProblem.get(problem.id)?.participant_id === participant.id ? "최초 해결" : "");
      }
      if (options.includeSubmissionTimes) {
        row.push(
          attempts[0] ? toKoreaExcelDate(attempts[0].received_at) : null,
          accepted ? toKoreaExcelDate(accepted.received_at) : null,
          accepted && challenge.started_at
            ? Math.max(0, Date.parse(accepted.received_at) - Date.parse(challenge.started_at)) / 86_400_000
            : null
        );
      }
      if (options.includeAttemptCounts) row.push(attempts.length);
    }
    if (!groupedLayout) row.push(...criterionScores);
    sheet.addRow(row);
  }

  const lastColumn = headers.length;
  const lastRow = Math.max(sheet.rowCount, 5);
  sheet.autoFilter = { from: { row: 5, column: 1 }, to: { row: lastRow, column: lastColumn } };
  sheet.getRow(1).height = 34;
  sheet.getRow(1).font = { bold: true, size: 18, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).alignment = { vertical: "middle", horizontal: "left" };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F67E8" } };
  sheet.getRow(2).height = 24;
  sheet.getRow(2).font = { size: 10, color: { argb: "FF475467" } };
  sheet.getRow(4).height = 32;
  sheet.getRow(4).font = { bold: true, color: { argb: "FF1F2937" } };
  sheet.getRow(4).alignment = { vertical: "middle", horizontal: "center" };
  sheet.getRow(4).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDDE5FF" } };
  sheet.getRow(5).height = 34;
  sheet.getRow(5).font = { bold: true, color: { argb: "FF1F2937" } };
  sheet.getRow(5).alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  sheet.getRow(5).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8EDFF" } };

  for (let columnIndex = 1; columnIndex <= lastColumn; columnIndex += 1) {
    for (const rowIndex of [4, 5]) {
      sheet.getCell(rowIndex, columnIndex).border = {
        top: { style: "thin", color: { argb: "FF334155" } },
        left: { style: "thin", color: { argb: "FF334155" } },
        bottom: { style: "thin", color: { argb: "FF334155" } },
        right: { style: "thin", color: { argb: "FF334155" } }
      };
    }
  }

  for (let rowIndex = 6; rowIndex <= lastRow; rowIndex += 1) {
    const worksheetRow = sheet.getRow(rowIndex);
    worksheetRow.height = 24;
    worksheetRow.alignment = { vertical: "middle", horizontal: "center" };
    if (rowIndex % 2 === 0) {
      worksheetRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
    }
  }
  sheet.getColumn(1).numFmt = "@";
  sheet.getColumn(1).width = 12;
  sheet.getColumn(2).width = 14;
  sheet.getColumn(3).width = 10;
  for (let columnIndex = groupedLayout ? 3 : 4; columnIndex <= resultEnd; columnIndex += 1) {
    sheet.getColumn(columnIndex).numFmt = "0.##########";
  }
  for (let columnIndex = 4; columnIndex <= lastColumn; columnIndex += 1) {
    const column = sheet.getColumn(columnIndex);
    const header = String(sheet.getCell(5, columnIndex).value ?? "");
    column.width = header.includes("시각") ? 23 : header === "소요시간" ? 14 : header === "시도 횟수" ? 12 : 14;
    if (header.includes("시각")) column.numFmt = "yyyy-mm-dd hh:mm:ss";
    if (header === "소요시간") column.numFmt = "[m]:ss";
  }
  for (const [index, criterion] of criteria.entries()) {
    const column = sheet.getColumn(bonusFrom + index);
    column.width = Math.max(14, criterion.label.length * 2 + 2);
    column.numFmt = "0.##########";
  }
  if (groupedLayout) {
    scoringGroups.forEach((group, index) => {
      sheet.getColumn(4 + index).width = Math.max(14, group.label.length * 2 + 2);
    });
  }
  sheet.getColumn(5).width = Math.max(sheet.getColumn(5).width ?? 0, 13);
  sheet.getColumn(6).width = Math.max(sheet.getColumn(6).width ?? 0, 13);
  sheet.getColumn(8).width = Math.max(sheet.getColumn(8).width ?? 0, 13);
  sheet.getColumn(9).width = Math.max(sheet.getColumn(9).width ?? 0, 13);
  sheet.getCell(2, 5).numFmt = "yyyy-mm-dd hh:mm:ss";
  sheet.getCell(2, 8).numFmt = "yyyy-mm-dd hh:mm:ss";
  sheet.getColumn(2).alignment = { vertical: "middle", horizontal: "left" };

  const information = workbook.addWorksheet("문항 정보", { views: [{ state: "frozen", ySplit: 1 }] });
  information.addRow(["문항 번호", "문제 제목", "문제 ID", "배점"]);
  problems.forEach((problem, index) => information.addRow([index + 1, problem.title, problem.id, problemPoints(problem)]));
  information.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  information.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F67E8" } };
  information.getColumn(1).width = 12;
  information.getColumn(2).width = 38;
  information.getColumn(3).width = 28;
  information.getColumn(4).width = 12;
  information.autoFilter = `A1:D${Math.max(information.rowCount, 1)}`;

  return workbook;
}

function compareSubmissionTime(left: ChallengeSubmission, right: ChallengeSubmission) {
  return left.received_at.localeCompare(right.received_at) || left.id.localeCompare(right.id);
}
