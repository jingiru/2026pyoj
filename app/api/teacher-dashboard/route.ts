import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { isTeacherRequestAuthenticated } from "@/lib/teacher-auth";
import type { SubmissionWithStudent } from "@/lib/types";

export async function GET(request: NextRequest) {
  if (!isTeacherRequestAuthenticated(request)) {
    return NextResponse.json(
      { ok: false, message: "교사 로그인이 필요합니다." },
      { status: 401 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { ok: false, message: "교사 대시보드의 Supabase 설정이 없습니다." },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
  const { data, error } = await supabase
    .from("submissions")
    .select("*, students(student_no, name)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[Teacher dashboard]", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    return NextResponse.json(
      {
        ok: false,
        message: "대시보드 데이터를 불러오지 못했습니다.",
        code: error.code
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    submissions: (data ?? []) as SubmissionWithStudent[]
  });
}
