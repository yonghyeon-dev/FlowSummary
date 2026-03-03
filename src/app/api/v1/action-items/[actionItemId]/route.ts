import { NextRequest, NextResponse } from "next/server";
import { updateActionItem } from "@/modules/action-item";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ actionItemId: string }> }
) {
  try {
    const { actionItemId } = await params;
    const body = await req.json();

    const result = await updateActionItem(actionItemId, body);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "액션아이템 업데이트 실패";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
