import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/modules/auth";
import { updateUserSettings, getUserProfile } from "@/modules/auth";

export async function GET() {
  try {
    const user = await requireUser();
    const profile = await getUserProfile(user.id);

    if (!profile) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "사용자 설정 조회 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();

    const { timezone, notificationEnabled } = body;

    const updated = await updateUserSettings(user.id, {
      timezone,
      notificationEnabled,
    });

    return NextResponse.json({
      timezone: updated.timezone,
      notificationEnabled: updated.notificationEnabled,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "사용자 설정 업데이트 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
