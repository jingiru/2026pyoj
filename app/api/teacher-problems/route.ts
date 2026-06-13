import { type NextRequest, NextResponse } from "next/server";
import { loadCurriculum } from "@/lib/curriculum-server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { isTeacherRequestAuthenticated } from "@/lib/teacher-auth";
import type { Problem } from "@/lib/types";

type ProblemPayload = Omit<Problem, "examples" | "testCases"> & {
  testCases: Array<{ input: string; output: string; isSample?: boolean }>;
};

export async function GET(request: NextRequest) {
  const authError = authenticate(request);
  if (authError) return authError;
  const supabase = createSupabaseAdmin()!;

  try {
    const curriculum = await loadCurriculum(supabase, false);
    return NextResponse.json({ ok: true, ...curriculum });
  } catch (error) {
    console.error("[Teacher problems]", error);
    const databaseError = toDatabaseError(error);
    return NextResponse.json(
      {
        ok: false,
        message: databaseError
          ? `문제 관리 데이터를 불러오지 못했습니다. (${databaseError.code}: ${databaseError.message})`
          : "문제 관리 데이터를 불러오지 못했습니다."
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = authenticate(request);
  if (authError) return authError;
  const payload = await readPayload(request);
  if (!payload.ok) return payload.response;
  return saveProblem(payload.problem, false);
}

export async function PUT(request: NextRequest) {
  const authError = authenticate(request);
  if (authError) return authError;
  const payload = await readPayload(request);
  if (!payload.ok) return payload.response;
  return saveProblem(payload.problem, true);
}

export async function PATCH(request: NextRequest) {
  const authError = authenticate(request);
  if (authError) return authError;
  const payload = (await request.json().catch(() => null)) as {
    id?: string;
    bookId?: string;
    isPublished?: boolean;
  } | null;
  if ((!payload?.id && !payload?.bookId) || typeof payload.isPublished !== "boolean") {
    return NextResponse.json({ ok: false, message: "공개 상태 변경값을 확인해주세요." }, { status: 400 });
  }

  const supabase = createSupabaseAdmin()!;
  const updatedAt = new Date().toISOString();
  if (payload.bookId) {
    const { data: currentBook, error: currentBookError } = await supabase
      .from("problem_books")
      .select("is_published")
      .eq("id", payload.bookId)
      .single();
    if (currentBookError) {
      return databaseError(currentBookError, "문제집 공개 상태를 확인하지 못했습니다.");
    }

    const { error: bookError } = await supabase
      .from("problem_books")
      .update({ is_published: payload.isPublished, updated_at: updatedAt })
      .eq("id", payload.bookId);
    if (bookError) return databaseError(bookError, "문제집 공개 상태를 변경하지 못했습니다.");

    const { error: problemsError } = await supabase
      .from("problems")
      .update({ is_published: payload.isPublished, updated_at: updatedAt })
      .eq("book_id", payload.bookId);
    if (problemsError) {
      await supabase
        .from("problem_books")
        .update({ is_published: currentBook.is_published, updated_at: new Date().toISOString() })
        .eq("id", payload.bookId);
      return databaseError(problemsError, "문제집의 문제 공개 상태를 변경하지 못했습니다.");
    }

    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase
    .from("problems")
    .update({ is_published: payload.isPublished, updated_at: updatedAt })
    .eq("id", payload.id!);
  if (error) return databaseError(error, "공개 상태를 변경하지 못했습니다.");
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const authError = authenticate(request);
  if (authError) return authError;
  const problemId = new URL(request.url).searchParams.get("id");
  if (!problemId) {
    return NextResponse.json({ ok: false, message: "삭제할 문제 ID가 없습니다." }, { status: 400 });
  }

  const supabase = createSupabaseAdmin()!;
  const { error } = await supabase.from("problems").delete().eq("id", problemId);
  if (error) return databaseError(error, "문제를 삭제하지 못했습니다.");
  return NextResponse.json({ ok: true });
}

async function saveProblem(problem: ProblemPayload, updating: boolean) {
  const supabase = createSupabaseAdmin()!;
  const shouldPublish = problem.isPublished ?? true;
  const problemRow = {
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
  };
  const query = updating
    ? supabase.from("problems").update(problemRow).eq("id", problem.id)
    : supabase.from("problems").insert(problemRow);
  const { error: problemError } = await query;
  if (problemError) return databaseError(problemError, "문제를 저장하지 못했습니다.");

  const { error: deleteError } = await supabase.from("test_cases").delete().eq("problem_id", problem.id);
  if (deleteError) return databaseError(deleteError, "기존 테스트케이스를 정리하지 못했습니다.");

  const testCases = problem.testCases.map((testCase, index) => ({
    problem_id: problem.id,
    input: testCase.input,
    expected_output: testCase.output,
    is_sample: testCase.isSample ?? index === 0,
    score: 1,
    sort_order: index + 1
  }));
  if (testCases.length > 0) {
    const { error: testError } = await supabase.from("test_cases").insert(testCases);
    if (testError) return databaseError(testError, "테스트케이스를 저장하지 못했습니다.");
  }

  if (shouldPublish) {
    const { error: publishError } = await supabase
      .from("problems")
      .update({ is_published: true, updated_at: new Date().toISOString() })
      .eq("id", problem.id);
    if (publishError) return databaseError(publishError, "문제를 공개 상태로 변경하지 못했습니다.");
  }

  return NextResponse.json({ ok: true });
}

async function readPayload(request: NextRequest) {
  const problem = (await request.json().catch(() => null)) as ProblemPayload | null;
  if (
    !problem ||
    !problem.id.trim() ||
    !problem.bookId ||
    !problem.title.trim() ||
    !problem.statement.trim() ||
    !Array.isArray(problem.testCases) ||
    problem.testCases.length === 0 ||
    problem.testCases.length > 10
  ) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { ok: false, message: "문제 필수 항목과 테스트케이스를 확인해주세요." },
        { status: 400 }
      )
    };
  }
  return { ok: true as const, problem };
}

function toDatabaseError(error: unknown) {
  if (!error || typeof error !== "object") return null;
  const candidate = error as { code?: unknown; message?: unknown };
  if (typeof candidate.message !== "string") return null;
  return {
    code: typeof candidate.code === "string" ? candidate.code : "DB",
    message: candidate.message
  };
}

function authenticate(request: NextRequest) {
  if (isTeacherRequestAuthenticated(request)) return null;
  return NextResponse.json({ ok: false, message: "교사 로그인이 필요합니다." }, { status: 401 });
}

function databaseError(error: { code?: string; message: string }, message: string) {
  console.error("[Teacher problems]", error);
  return NextResponse.json({ ok: false, message, code: error.code }, { status: 500 });
}
