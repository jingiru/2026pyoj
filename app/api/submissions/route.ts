import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import type { Submission } from "@/lib/types";

export async function POST(request: Request) {
  const submission = (await request.json().catch(() => null)) as Submission | null;
  if (
    !submission?.student_id ||
    !submission.problem_id ||
    typeof submission.code !== "string" ||
    !["accepted", "wrong_answer", "runtime_error"].includes(submission.status)
  ) {
    return NextResponse.json(
      { ok: false, message: "제출 데이터가 올바르지 않습니다." },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, message: "제출 저장 서버 설정이 없습니다." },
      { status: 500 }
    );
  }

  const { data, error } = await supabase
    .from("submissions")
    .insert({
      student_id: submission.student_id,
      problem_id: submission.problem_id,
      code: submission.code,
      status: submission.status,
      passed_count: submission.passed_count,
      total_count: submission.total_count,
      feedback: submission.feedback
    })
    .select()
    .single();

  if (error) {
    console.error("[Submission]", error);
    return NextResponse.json(
      { ok: false, message: "제출 기록을 저장하지 못했습니다.", code: error.code },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, submission: data as Submission });
}
