"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/modules/auth";
import { requireWorkspaceMembership } from "@/modules/workspace";
import { MeetingStatus } from "@prisma/client";
import { isAllowedFile, isWithinSizeLimit } from "./constants";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getUploadUrl(
  workspaceId: string,
  fileName: string,
  mimeType: string,
  fileSize: number
) {
  const user = await requireUser();
  await requireWorkspaceMembership(user.id, workspaceId);

  if (!isAllowedFile(fileName, mimeType)) {
    throw new Error("지원하지 않는 파일 형식입니다 (mp3, m4a, wav, mp4, mov)");
  }

  if (!isWithinSizeLimit(fileSize)) {
    throw new Error("파일 크기가 500MB를 초과합니다");
  }

  const supabase = createAdminClient();
  const storagePath = `${workspaceId}/${Date.now()}-${fileName}`;

  const { data, error } = await supabase.storage
    .from("meeting-assets")
    .createSignedUploadUrl(storagePath);

  if (error) {
    throw new Error(`업로드 URL 생성 실패: ${error.message}`);
  }

  return {
    signedUrl: data.signedUrl,
    token: data.token,
    storagePath,
  };
}

export async function createMeeting(formData: FormData) {
  const user = await requireUser();
  const workspaceId = formData.get("workspaceId") as string;
  const title = formData.get("title") as string;
  const meetingDate = formData.get("meetingDate") as string;
  const participants = formData.get("participants") as string;
  const storagePath = formData.get("storagePath") as string;
  const fileName = formData.get("fileName") as string;
  const mimeType = formData.get("mimeType") as string;
  const fileSize = formData.get("fileSize") as string;
  const fileHash = formData.get("fileHash") as string | null;

  await requireWorkspaceMembership(user.id, workspaceId);

  if (!title?.trim()) {
    return redirect(
      `/workspaces/${workspaceId}/meetings/new?error=제목을 입력해주세요`
    );
  }

  // 중복 업로드 감지: 파일 해시 + 동일 회의일 조합
  if (fileHash) {
    const duplicate = await prisma.meeting.findFirst({
      where: {
        workspaceId,
        meetingDate: new Date(meetingDate),
        deletedAt: null,
        assets: {
          some: { fileHash },
        },
      },
      select: { id: true, title: true },
    });

    if (duplicate) {
      return redirect(
        `/workspaces/${workspaceId}/meetings/new?error=동일한 파일이 같은 회의일(${meetingDate})에 이미 업로드되어 있습니다: "${duplicate.title}"`
      );
    }
  }

  const meeting = await prisma.meeting.create({
    data: {
      workspaceId,
      creatorUserId: user.id,
      title: title.trim(),
      meetingDate: new Date(meetingDate),
      participants: participants
        ? participants.split(",").map((p) => p.trim()).filter(Boolean)
        : [],
      status: MeetingStatus.UPLOADED,
      assets: storagePath
        ? {
            create: {
              storagePath,
              fileName,
              mimeType,
              fileSize: BigInt(fileSize || "0"),
              fileHash,
            },
          }
        : undefined,
    },
  });

  revalidatePath(`/workspaces/${workspaceId}/meetings`);
  redirect(`/workspaces/${workspaceId}/meetings/${meeting.id}`);
}

export async function createTextMeeting(formData: FormData) {
  const user = await requireUser();
  const workspaceId = formData.get("workspaceId") as string;
  const title = formData.get("title") as string;
  const meetingDate = formData.get("meetingDate") as string;
  const participants = formData.get("participants") as string;
  const transcript = formData.get("transcript") as string;

  await requireWorkspaceMembership(user.id, workspaceId);

  if (!title?.trim() || !transcript?.trim()) {
    return redirect(
      `/workspaces/${workspaceId}/meetings/new?error=제목과 회의록을 입력해주세요`
    );
  }

  const meeting = await prisma.meeting.create({
    data: {
      workspaceId,
      creatorUserId: user.id,
      title: title.trim(),
      meetingDate: new Date(meetingDate),
      participants: participants
        ? participants.split(",").map((p) => p.trim()).filter(Boolean)
        : [],
      status: MeetingStatus.REVIEW_NEEDED, // 전사 스킵
      isTextPaste: true,
      segments: {
        create: {
          speakerLabel: "전체",
          text: transcript.trim(),
          startTime: 0,
          endTime: 0,
          confidence: 1.0,
        },
      },
    },
  });

  revalidatePath(`/workspaces/${workspaceId}/meetings`);
  redirect(`/workspaces/${workspaceId}/meetings/${meeting.id}`);
}

export async function updateSummaryText(
  summaryId: string,
  summaryText: string
) {
  const user = await requireUser();

  const summary = await prisma.meetingSummary.findUniqueOrThrow({
    where: { id: summaryId },
    select: { meeting: { select: { workspaceId: true, id: true } } },
  });

  await requireWorkspaceMembership(user.id, summary.meeting.workspaceId);

  await prisma.meetingSummary.update({
    where: { id: summaryId },
    data: { summary: summaryText },
  });

  revalidatePath(
    `/workspaces/${summary.meeting.workspaceId}/meetings/${summary.meeting.id}`
  );
}
