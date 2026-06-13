import type { SupabaseClient } from "@supabase/supabase-js";
import type { Problem, ProblemBook } from "./types";

type ProblemRow = {
  id: string;
  book_id: string | null;
  title: string;
  statement: string;
  input_description: string;
  output_description: string;
  starter_code: string;
  hint: string;
  sort_order: number;
  is_published: boolean;
  test_cases?: Array<{
    input: string;
    expected_output: string;
    is_sample: boolean;
    sort_order: number;
  }>;
};

export async function loadCurriculum(supabase: SupabaseClient, publishedOnly: boolean) {
  let bookQuery = supabase
    .from("problem_books")
    .select("id, title, description, sort_order, is_published")
    .order("sort_order");
  let problemQuery = supabase
    .from("problems")
    .select(
      "id, book_id, title, statement, input_description, output_description, starter_code, hint, sort_order, is_published, test_cases(input, expected_output, is_sample, sort_order)"
    )
    .order("sort_order")
    .order("id");

  if (publishedOnly) {
    bookQuery = bookQuery.eq("is_published", true);
    problemQuery = problemQuery.eq("is_published", true);
  }

  const [{ data: bookRows, error: bookError }, { data: problemRows, error: problemError }] =
    await Promise.all([bookQuery, problemQuery]);
  if (bookError) throw bookError;
  if (problemError) throw problemError;

  const books: ProblemBook[] = (bookRows ?? []).map((book) => ({
    id: book.id,
    order: book.sort_order,
    title: book.title,
    description: book.description,
    isPublished: book.is_published
  }));
  const problems: Problem[] = ((problemRows ?? []) as ProblemRow[]).map((problem) => {
    const cases = [...(problem.test_cases ?? [])].sort((left, right) => left.sort_order - right.sort_order);
    const samples = cases.filter((testCase) => testCase.is_sample);
    return {
      id: problem.id,
      bookId: problem.book_id ?? books[0]?.id ?? "",
      order: problem.sort_order,
      title: problem.title,
      statement: normalizeDisplayText(problem.statement),
      inputDescription: normalizeDisplayText(problem.input_description),
      outputDescription: normalizeDisplayText(problem.output_description),
      starterCode: problem.starter_code,
      hint: normalizeDisplayText(problem.hint),
      examples: (samples.length > 0 ? samples : cases.slice(0, 1)).map((testCase) => ({
        input: testCase.input,
        output: testCase.expected_output
      })),
      testCases: cases.map((testCase) => ({
        input: testCase.input,
        output: testCase.expected_output
      })),
      showExample: !(cases.length === 1 && cases[0].is_sample),
      isPublished: problem.is_published
    };
  });

  return { books, problems };
}

function normalizeDisplayText(value: string) {
  return value.replace(/\r\n/g, "\n").replace(/\\r\\n|\\n|\\r/g, "\n");
}
