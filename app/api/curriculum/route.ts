import { NextResponse } from "next/server";
import { loadCurriculum } from "@/lib/curriculum-server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const supabase = createSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, message: "문제 조회 서버 설정이 없습니다." },
      { status: 500 }
    );
  }

  try {
    const curriculum = await loadCurriculum(supabase, true);
    return NextResponse.json({ ok: true, ...curriculum });
  } catch (error) {
    console.error("[Curriculum]", error);
    return NextResponse.json(
      { ok: false, message: "문제 목록을 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}
