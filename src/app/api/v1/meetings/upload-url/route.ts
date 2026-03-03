import { NextResponse } from "next/server";
import { getUploadUrl } from "@/modules/meeting";

export async function POST(request: Request) {
  try {
    const { workspaceId, fileName, mimeType, fileSize } = await request.json();

    const result = await getUploadUrl(workspaceId, fileName, mimeType, fileSize);

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "업로드 URL 생성 실패";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
