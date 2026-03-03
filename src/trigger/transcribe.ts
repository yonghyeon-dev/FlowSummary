import { task } from "@trigger.dev/sdk/v3";

export const transcribeMeeting = task({
  id: "transcribe-meeting",
  maxDuration: 1800, // 30분
  run: async (payload: { meetingId: string }) => {
    const { meetingId } = payload;

    // TODO: Phase 2에서 구현
    // 1. Meeting 레코드 조회 (status: uploaded → processing)
    // 2. MeetingAsset에서 파일 URL 획득
    // 3. VITO API로 전사 요청
    // 4. 전사 완료 대기 (polling)
    // 5. TranscriptSegment 저장
    // 6. Meeting status → review_needed (또는 failed)

    return {
      meetingId,
      status: "placeholder",
    };
  },
});
