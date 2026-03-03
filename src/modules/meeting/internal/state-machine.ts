import { MeetingStatus } from "@prisma/client";

/**
 * Meeting 상태 전이 규칙
 *
 * uploaded → processing → review_needed → published → archived
 *                      ↘ failed (재시도 → processing)
 */
export const VALID_TRANSITIONS: Record<MeetingStatus, MeetingStatus[]> = {
  [MeetingStatus.UPLOADED]: [MeetingStatus.PROCESSING],
  [MeetingStatus.PROCESSING]: [
    MeetingStatus.REVIEW_NEEDED,
    MeetingStatus.FAILED,
  ],
  [MeetingStatus.REVIEW_NEEDED]: [MeetingStatus.PUBLISHED],
  [MeetingStatus.PUBLISHED]: [MeetingStatus.ARCHIVED],
  [MeetingStatus.FAILED]: [MeetingStatus.PROCESSING],
  [MeetingStatus.ARCHIVED]: [],
};

export function isValidTransition(
  from: MeetingStatus,
  to: MeetingStatus
): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

export async function transitionMeetingStatus(
  prisma: { meeting: { update: Function } },
  meetingId: string,
  currentStatus: MeetingStatus,
  newStatus: MeetingStatus,
  errorMessage?: string
) {
  if (!isValidTransition(currentStatus, newStatus)) {
    throw new Error(
      `잘못된 상태 전이: ${currentStatus} → ${newStatus}`
    );
  }

  return prisma.meeting.update({
    where: { id: meetingId },
    data: {
      status: newStatus,
      ...(errorMessage && { errorMessage }),
    },
  });
}
