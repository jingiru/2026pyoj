import { type NextRequest, NextResponse } from "next/server";
import { loadCurriculum } from "@/lib/curriculum-server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  const supabase = createSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, message: "문제 조회 서버 설정이 없습니다." },
      { status: 500 }
    );
  }

  try {
    const guestToken = request.headers.get("x-pyoj-guest-token")?.trim();
    const isGuest = guestToken
      ? await isValidGuestToken(supabase, guestToken)
      : false;
    const curriculum = await loadCurriculum(supabase, !isGuest);
    return NextResponse.json({ ok: true, ...curriculum });
  } catch (error) {
    console.error("[Curriculum]", error);
    return NextResponse.json(
      { ok: false, message: "문제 목록을 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}

async function isValidGuestToken(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdmin>>,
  guestToken: string
) {
  const { data, error } = await supabase
    .from("students")
    .select("id")
    .eq("is_guest", true)
    .eq("guest_token", guestToken)
    .maybeSingle();
  if (error) {
    console.error("[Curriculum guest verification]", error);
    return false;
  }
  return Boolean(data);
}
