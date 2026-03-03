import { task, wait } from "@trigger.dev/sdk/v3";
import { prisma } from "@/lib/prisma";
import { MeetingStatus } from "@prisma/client";
import {
  isValidTransition,
  transitionMeetingStatus,
} from "@/modules/meeting/internal/state-machine";

const VITO_API_BASE = "https://openapi.vito.ai";

interface VitoToken {
  access_token: string;
}

interface VitoTranscribeResponse {
  id: string;
}

interface VitoSegment {
  start: number;
  end: number;
  text: string;
  spk: { label: string };
  confidence?: number;
}

interface VitoResult {
  status: string;
  results?: {
    utterances: VitoSegment[];
  };
}

async function getVitoToken(): Promise<string> {
  const res = await fetch(`${VITO_API_BASE}/v1/authenticate`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.VITO_CLIENT_ID!,
      client_secret: process.env.VITO_CLIENT_SECRET!,
    }),
  });

  if (!res.ok) throw new Error(`VITO 인증 실패: ${res.status}`);
  const data: VitoToken = await res.json();
  return data.access_token;
}

async function requestTranscription(
  token: string,
  fileUrl: string
): Promise<string> {
  const formData = new FormData();
  formData.append("config", JSON.stringify({
    use_diarization: true,
    diarization: { spk_count: -1 },
  }));

  // URL에서 파일 다운로드 후 업로드
  const fileRes = await fetch(fileUrl);
  const blob = await fileRes.blob();
  formData.append("file", blob);

  const res = await fetch(`${VITO_API_BASE}/v1/transcribe`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) throw new Error(`VITO 전사 요청 실패: ${res.status}`);
  const data: VitoTranscribeResponse = await res.json();
  return data.id;
}

async function pollTranscription(
  token: string,
  transcribeId: string
): Promise<VitoSegment[]> {
  const maxAttempts = 120; // 최대 10분 (5초 간격)

  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(
      `${VITO_API_BASE}/v1/transcribe/${transcribeId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!res.ok) throw new Error(`VITO 결과 조회 실패: ${res.status}`);
    const data: VitoResult = await res.json();

    if (data.status === "completed" && data.results) {
      return data.results.utterances;
    }

    if (data.status === "failed") {
      throw new Error("VITO 전사 처리 실패");
    }

    // 5초 대기
    await wait.for({ seconds: 5 });
  }

  throw new Error("VITO 전사 타임아웃 (10분 초과)");
}

export const transcribeMeeting = task({
  id: "transcribe-meeting",
  maxDuration: 1800,
  run: async (payload: { meetingId: string; fileUrl: string }) => {
    const { meetingId, fileUrl } = payload;

    // 1. Meeting 상태 → PROCESSING
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
    });

    if (!meeting) throw new Error(`Meeting not found: ${meetingId}`);

    if (isValidTransition(meeting.status, MeetingStatus.PROCESSING)) {
      await transitionMeetingStatus(
        prisma,
        meetingId,
        meeting.status,
        MeetingStatus.PROCESSING
      );
    }

    try {
      // 2. VITO 인증
      const token = await getVitoToken();

      // 3. 전사 요청
      const transcribeId = await requestTranscription(token, fileUrl);

      // 4. 결과 폴링
      const utterances = await pollTranscription(token, transcribeId);

      // 5. TranscriptSegment 저장
      await prisma.transcriptSegment.createMany({
        data: utterances.map((u) => ({
          meetingId,
          speakerLabel: u.spk.label,
          text: u.text,
          startTime: u.start / 1000, // ms → seconds
          endTime: u.end / 1000,
          confidence: u.confidence ?? 0,
        })),
      });

      // 6. 상태 → REVIEW_NEEDED
      await transitionMeetingStatus(
        prisma,
        meetingId,
        MeetingStatus.PROCESSING,
        MeetingStatus.REVIEW_NEEDED
      );

      return {
        meetingId,
        segmentCount: utterances.length,
        status: "completed",
      };
    } catch (error) {
      // 실패 시 상태 → FAILED
      const errorMessage =
        error instanceof Error ? error.message : "전사 처리 실패";

      await transitionMeetingStatus(
        prisma,
        meetingId,
        MeetingStatus.PROCESSING,
        MeetingStatus.FAILED,
        errorMessage
      );

      throw error;
    }
  },
});
