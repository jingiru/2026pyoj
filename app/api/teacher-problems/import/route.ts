import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { isTeacherRequestAuthenticated } from "@/lib/teacher-auth";
import type { ImportedProblem, ProblemImportResult } from "@/lib/problem-import-types";

const CHUNK_SIZE = 40;

export async function POST(request: NextRequest) {
  if (!isTeacherRequestAuthenticated(request)) {
    return NextResponse.json({ ok: false, message: "교사 로그인이 필요합니다." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as { problems?: ImportedProblem[] } | null;
  const validationError = validateProblems(payload?.problems);
  if (validationError) {
    return NextResponse.json({ ok: false, message: validationError }, { status: 400 });
  }

  const problems = payload!.problems!;
  const supabase = createSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ ok: false, message: "Supabase 관리자 설정이 없습니다." }, { status: 500 });
  }

  try {
    const ids = problems.map((problem) => problem.id);
    const existingIds = new Set<string>();
    for (const chunk of chunks(ids, CHUNK_SIZE)) {
      const { data, error } = await supabase.from("problems").select("id").in("id", chunk);
      if (error) throw error;
      for (const row of data ?? []) existingIds.add(row.id);
    }

    const bookRows = uniqueBooks(problems).map((book) => ({
      id: book.id,
      title: book.title,
      description: "",
      sort_order: book.order,
      is_published: true,
      updated_at: new Date().toISOString()
    }));
    const { error: bookError } = await supabase.from("problem_books").upsert(bookRows, { onConflict: "id" });
    if (bookError) throw bookError;

    const problemRows = problems.map((problem) => ({
      id: problem.id,
      book_id: problem.bookId,
      title: problem.title,
      statement: problem.statement,
      input_description: problem.inputDescription,
      output_description: problem.outputDescription,
      starter_code: problem.starterCode,
      hint: problem.hint,
      sort_order: problem.order,
      is_published: false,
      updated_at: new Date().toISOString()
    }));
    for (const chunk of chunks(problemRows, CHUNK_SIZE)) {
      const { error } = await supabase.from("problems").upsert(chunk, { onConflict: "id" });
      if (error) throw error;
    }

    for (const chunk of chunks(ids, CHUNK_SIZE)) {
      const { error } = await supabase.from("test_cases").delete().in("problem_id", chunk);
      if (error) throw error;
    }
    const testCaseRows = problems.flatMap((problem) =>
      problem.testCases.map((testCase, index) => ({
        problem_id: problem.id,
        input: testCase.input,
        expected_output: testCase.output,
        is_sample: testCase.isSample,
        score: 1,
        sort_order: index + 1
      }))
    );
    for (const chunk of chunks(testCaseRows, 300)) {
      const { error } = await supabase.from("test_cases").insert(chunk);
      if (error) throw error;
    }

    const solutionRows = problems
      .filter((problem) => problem.solutionCode !== "")
      .map((problem) => ({
        problem_id: problem.id,
        solution_code: problem.solutionCode,
        updated_at: new Date().toISOString()
      }));
    for (const chunk of chunks(solutionRows, 100)) {
      const { error } = await supabase.from("reference_solutions").upsert(chunk, { onConflict: "problem_id" });
      if (error) throw error;
    }

    for (const chunk of chunks(ids, CHUNK_SIZE)) {
      const { error } = await supabase
        .from("problems")
        .update({ is_published: true, updated_at: new Date().toISOString() })
        .in("id", chunk);
      if (error) throw error;
    }

    let verifiedProblems = 0;
    let verifiedTestCases = 0;
    let verifiedSolutions = 0;
    for (const chunk of chunks(ids, CHUNK_SIZE)) {
      const [{ count: problemCount, error: problemError }, { count: caseCount, error: caseError }] =
        await Promise.all([
          supabase.from("problems").select("*", { count: "exact", head: true }).in("id", chunk),
          supabase.from("test_cases").select("*", { count: "exact", head: true }).in("problem_id", chunk)
        ]);
      if (problemError) throw problemError;
      if (caseError) throw caseError;
      verifiedProblems += problemCount ?? 0;
      verifiedTestCases += caseCount ?? 0;
    }
    const solutionIds = solutionRows.map((row) => row.problem_id);
    for (const chunk of chunks(solutionIds, CHUNK_SIZE)) {
      const { count, error } = await supabase
        .from("reference_solutions")
        .select("*", { count: "exact", head: true })
        .in("problem_id", chunk);
      if (error) throw error;
      verifiedSolutions += count ?? 0;
    }

    const result: ProblemImportResult = {
      total: problems.length,
      inserted: problems.length - existingIds.size,
      updated: existingIds.size,
      books: bookRows.length,
      testCases: testCaseRows.length,
      solutions: solutionRows.length,
      verifiedProblems,
      verifiedTestCases,
      verifiedSolutions,
      warnings: []
    };
    if (verifiedProblems !== problems.length) result.warnings.push("DB에서 확인된 문제 수가 업로드 수와 다릅니다.");
    if (verifiedTestCases !== testCaseRows.length) result.warnings.push("DB에서 확인된 테스트케이스 수가 다릅니다.");
    if (verifiedSolutions !== solutionRows.length) result.warnings.push("DB에서 확인된 모범답안 수가 다릅니다.");

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error("[Problem import]", error);
    const message =
      error && typeof error === "object" && "message" in error
        ? String(error.message)
        : "문제 일괄 업로드 중 오류가 발생했습니다.";
    return NextResponse.json(
      { ok: false, message: `DB 저장 또는 확인에 실패했습니다: ${message}` },
      { status: 500 }
    );
  }
}

function validateProblems(problems: ImportedProblem[] | undefined) {
  if (!Array.isArray(problems) || problems.length === 0) return "업로드할 문제 데이터가 없습니다.";
  if (problems.length > 1000) return "한 번에 최대 1,000문제까지 업로드할 수 있습니다.";
  const ids = new Set<string>();
  for (const problem of problems) {
    if (
      !problem.id?.trim() ||
      !problem.bookId?.trim() ||
      !problem.title?.trim() ||
      !problem.statement?.trim() ||
      !problem.inputDescription?.trim() ||
      !problem.outputDescription?.trim() ||
      !Number.isInteger(problem.order) ||
      problem.order < 0 ||
      !Array.isArray(problem.testCases) ||
      problem.testCases.length === 0 ||
      problem.testCases.length > 10
    ) {
      return `"${problem.id || "ID 없음"}" 문제의 필수 항목과 테스트케이스 1~10개를 확인해주세요.`;
    }
    if (ids.has(problem.id)) return `문제ID "${problem.id}"가 중복되었습니다.`;
    ids.add(problem.id);
  }
  return null;
}

function uniqueBooks(problems: ImportedProblem[]) {
  const books = new Map<string, { id: string; title: string; order: number }>();
  for (const problem of problems) {
    books.set(problem.bookId, {
      id: problem.bookId,
      title: problem.bookTitle,
      order: problem.bookOrder
    });
  }
  return [...books.values()];
}

function chunks<T>(items: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
  return result;
}
