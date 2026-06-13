import ExcelJS from "exceljs";
import type { ImportedProblem, ImportedTestCase } from "./problem-import-types";

export const PROBLEM_IMPORT_HEADERS = [
  "문제ID",
  "문제집",
  "문제 제목",
  "문제 내용",
  "입력",
  "출력",
  "예시 입력1",
  "예시 출력1",
  "예시 입력2",
  "예시 출력2",
  "힌트",
  "입력1",
  "출력1",
  "입력2",
  "출력2",
  "입력3",
  "출력3",
  "입력4",
  "출력4",
  "입력5",
  "출력5",
  "입력6",
  "출력6",
  "입력7",
  "출력7",
  "입력8",
  "출력8",
  "모범답안",
  "스켈레톤"
] as const;

export async function parseProblemWorkbook(file: File): Promise<ImportedProblem[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error("엑셀 파일에 시트가 없습니다.");

  const rows: string[][] = [];
  worksheet.eachRow({ includeEmpty: false }, (row) => {
    rows.push(PROBLEM_IMPORT_HEADERS.map((_, index) => row.getCell(index + 1).text.replace(/\r\n/g, "\n")));
  });
  const headers = rows[0] ?? [];
  const missingHeaders = PROBLEM_IMPORT_HEADERS.filter((header, index) => headers[index] !== header);
  if (missingHeaders.length > 0) {
    throw new Error(`서식의 열 이름이나 순서가 다릅니다: ${missingHeaders.join(", ")}`);
  }

  const problems: ImportedProblem[] = [];
  const ids = new Set<string>();
  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index];
    if (!row || row.every((value) => toText(value) === "")) continue;
    const rowNumber = index + 1;
    const id = toText(row[0]).trim();
    const bookId = toText(row[1]).trim();
    const title = toText(row[2]).trim();
    const statement = toText(row[3]).trim();
    const inputDescription = toText(row[4]).trim();
    const outputDescription = toText(row[5]).trim();

    if (!id || !bookId || !title || !statement || !inputDescription || !outputDescription) {
      throw new Error(`${rowNumber}행의 문제ID, 문제집, 제목, 문제 내용, 입력, 출력을 확인해주세요.`);
    }
    if (ids.has(id)) throw new Error(`${rowNumber}행의 문제ID "${id}"가 중복되었습니다.`);
    ids.add(id);

    const explicitExamples = readPairs(row, [[6, 7], [8, 9]], true);
    const judgingCases = readPairs(
      row,
      [[11, 12], [13, 14], [15, 16], [17, 18], [19, 20], [21, 22], [23, 24], [25, 26]],
      false
    );
    const testCases = deduplicateCases([...explicitExamples, ...judgingCases]);
    if (testCases.length === 0) throw new Error(`${rowNumber}행에 채점용 출력값이 없습니다.`);
    if (explicitExamples.length === 0) testCases[0].isSample = true;

    problems.push({
      id,
      bookId,
      bookTitle: bookId.replace(/^\d+\s*/, "").trim() || bookId,
      bookOrder: parseBookOrder(bookId, rowNumber),
      order: parseProblemOrder(id, rowNumber),
      title,
      statement,
      inputDescription,
      outputDescription,
      hint: toText(row[10]),
      starterCode: toText(row[28]),
      solutionCode: toText(row[27]),
      testCases
    });
  }

  if (problems.length === 0) throw new Error("업로드할 문제 데이터가 없습니다.");
  return problems;
}

export async function downloadProblemImportTemplate() {
  const sample: string[] = [
    "1-1-01 예제 문제",
    "01 출력 함수 기초",
    "예제 문제 01",
    "1을 출력하세요.",
    "입력은 없습니다.",
    "1을 출력합니다.",
    "",
    "",
    "",
    "",
    "print()를 사용해보세요.",
    "",
    "1",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "print(1)",
    "print()"
  ];
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("문제 일괄 업로드");
  worksheet.addRow(Array.from(PROBLEM_IMPORT_HEADERS));
  worksheet.addRow(sample);
  worksheet.columns = PROBLEM_IMPORT_HEADERS.map((header) => ({
    width: ["문제 내용", "모범답안", "스켈레톤"].includes(header) ? 34 : 18
  }));
  worksheet.getRow(1).font = { bold: true };
  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "문제_일괄업로드_서식.xlsx";
  link.click();
  URL.revokeObjectURL(url);
}

function readPairs(
  row: string[],
  pairs: Array<[number, number]>,
  isSample: boolean
) {
  return pairs.flatMap(([inputIndex, outputIndex]) => {
    const input = toText(row[inputIndex]);
    const output = toText(row[outputIndex]);
    if (input === "" && output === "") return [];
    return [{ input, output, isSample }];
  });
}

function deduplicateCases(cases: ImportedTestCase[]) {
  const seen = new Set<string>();
  return cases.filter((testCase) => {
    const key = `${testCase.input}\u0000${testCase.output}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseBookOrder(bookId: string, rowNumber: number) {
  const match = bookId.match(/^(\d+)/);
  if (!match) throw new Error(`${rowNumber}행 문제집 "${bookId}" 앞에 정렬 번호가 없습니다.`);
  return Number(match[1]);
}

function parseProblemOrder(problemId: string, rowNumber: number) {
  const code = problemId.match(/^(\d+(?:-\d+)+)/)?.[1];
  if (!code) throw new Error(`${rowNumber}행 문제ID "${problemId}"의 번호 형식을 확인해주세요.`);
  const segments = code.split("-").map(Number);
  const orderSegments = segments.length >= 3 ? segments.slice(1) : segments;
  return orderSegments.reduce((order, segment) => order * 100 + segment, 0);
}

function toText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\r\n/g, "\n");
}
