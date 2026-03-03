import { task } from "@trigger.dev/sdk/v3";

export const summarizeMeeting = task({
  id: "summarize-meeting",
  maxDuration: 600, // 10분
  run: async (payload: { meetingId: string }) => {
    const { meetingId } = payload;

    // TODO: Phase 3에서 구현
    // 1. Meeting + TranscriptSegment 조회
    // 2. Claude API로 요약 + 액션아이템 추출
    // 3. JSON 스키마 검증
    // 4. MeetingSummary + ActionItem 저장
    // 5. Meeting status → review_needed

    return {
      meetingId,
      status: "placeholder",
    };
  },
});
