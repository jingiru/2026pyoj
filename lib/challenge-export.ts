import ExcelJS from "exceljs";
import type {
  Challenge,
  ChallengeParticipant,
  ChallengeSubmission
} from "./challenge-types";
import { firstSolvers } from "./challenge-types";

export type ChallengeExportOptions = {
  includeFirstSolver: boolean;
  includeSubmissionTimes: boolean;
  includeAttemptCounts: boolean;
};

export async function buildChallengeResultsWorkbook(
  challenge: Challenge,
  participants: ChallengeParticipant[],
  submissions: ChallengeSubmission[],
  options: ChallengeExportOptions
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Jingiru Python Beginner Lab";
  workbook.created = new Date();
  workbook.modified = new Date();

  const sheet = workbook.addWorksheet("결과", {
    views: [{ state: "frozen", ySplit: 4, xSplit: 2 }]
  });
  const problems = challenge.problem_snapshots;
  const firstByProblem = firstSolvers(submissions);
  const headers = ["학번", "이름", "총 정답"];

  for (const [index] of problems.entries()) {
    const number = index + 1;
    headers.push(`${number}번 정오답`);
    if (options.includeFirstSolver) headers.push(`${number}번 최초 해결`);
    if (options.includeSubmissionTimes) {
      headers.push(`${number}번 첫 제출 시각`, `${number}번 최초 정답 시각`, `${number}번 정답 소요시간`);
    }
    if (options.includeAttemptCounts) headers.push(`${number}번 제출 시도`);
  }

  sheet.mergeCells(1, 1, 1, headers.length);
  sheet.getCell(1, 1).value = challenge.title;
  sheet.getCell(2, 1).value = "입장코드";
  sheet.getCell(2, 2).value = challenge.entry_code ?? "";
  sheet.getCell(2, 4).value = "시작 시각";
  sheet.getCell(2, 5).value = challenge.started_at ? new Date(challenge.started_at) : null;
  sheet.getCell(2, 7).value = "마감 시각";
  sheet.getCell(2, 8).value = challenge.ends_at ? new Date(challenge.ends_at) : null;
  sheet.getRow(4).values = headers;

  const sortedParticipants = [...participants].sort(
    (left, right) => left.student_no.localeCompare(right.student_no, "ko") || left.name.localeCompare(right.name, "ko")
  );
  for (const participant of sortedParticipants) {
    const records = submissions.filter((submission) => submission.participant_id === participant.id);
    const row: Array<string | number | Date | null> = [
      participant.student_no,
      participant.name,
      new Set(records.filter((submission) => submission.status === "accepted").map((submission) => submission.problem_id)).size
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
          attempts[0] ? new Date(attempts[0].received_at) : null,
          accepted ? new Date(accepted.received_at) : null,
          accepted && challenge.started_at
            ? Math.max(0, Date.parse(accepted.received_at) - Date.parse(challenge.started_at)) / 86_400_000
            : null
        );
      }
      if (options.includeAttemptCounts) row.push(attempts.length);
    }
    sheet.addRow(row);
  }

  const lastColumn = sheet.columnCount;
  const lastRow = Math.max(sheet.rowCount, 4);
  sheet.autoFilter = { from: { row: 4, column: 1 }, to: { row: lastRow, column: lastColumn } };
  sheet.getRow(1).height = 34;
  sheet.getRow(1).font = { bold: true, size: 18, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).alignment = { vertical: "middle", horizontal: "left" };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F67E8" } };
  sheet.getRow(2).height = 24;
  sheet.getRow(2).font = { size: 10, color: { argb: "FF475467" } };
  sheet.getRow(4).height = 34;
  sheet.getRow(4).font = { bold: true, color: { argb: "FF1F2937" } };
  sheet.getRow(4).alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  sheet.getRow(4).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8EDFF" } };

  for (let rowIndex = 5; rowIndex <= lastRow; rowIndex += 1) {
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
  for (let columnIndex = 4; columnIndex <= lastColumn; columnIndex += 1) {
    const column = sheet.getColumn(columnIndex);
    const header = String(sheet.getCell(4, columnIndex).value ?? "");
    column.width = header.includes("시각") ? 21 : header.includes("소요시간") ? 15 : 14;
    if (header.includes("시각")) column.numFmt = "yyyy-mm-dd hh:mm:ss";
    if (header.includes("소요시간")) column.numFmt = "[m]:ss";
  }
  sheet.getCell(2, 5).numFmt = "yyyy-mm-dd hh:mm:ss";
  sheet.getCell(2, 8).numFmt = "yyyy-mm-dd hh:mm:ss";
  sheet.getColumn(2).alignment = { vertical: "middle", horizontal: "left" };

  const information = workbook.addWorksheet("문항 정보", { views: [{ state: "frozen", ySplit: 1 }] });
  information.addRow(["문항 번호", "문제 제목", "문제 ID"]);
  problems.forEach((problem, index) => information.addRow([index + 1, problem.title, problem.id]));
  information.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  information.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F67E8" } };
  information.getColumn(1).width = 12;
  information.getColumn(2).width = 38;
  information.getColumn(3).width = 28;
  information.autoFilter = `A1:C${Math.max(information.rowCount, 1)}`;

  return workbook;
}

function compareSubmissionTime(left: ChallengeSubmission, right: ChallengeSubmission) {
  return left.received_at.localeCompare(right.received_at) || left.id.localeCompare(right.id);
}
