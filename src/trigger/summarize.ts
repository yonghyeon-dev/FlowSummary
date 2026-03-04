import { task } from "@trigger.dev/sdk/v3";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/prisma";
import { ActionItemPriority } from "@prisma/client";

const PROMPT_VERSION = "v1.0";
const MODEL_ID = "gemini-2.5-flash";

interface SummaryOutput {
  summary: string;
  keyDecisions: { decision: string; context: string }[];
  actionItems: {
    title: string;
    description?: string;
    assigneeHint?: string;
    priority: "HIGH" | "MEDIUM" | "LOW";
    dueDateRaw?: string;
    confidence: number;
    sourceText: string;
  }[];
}

function buildPrompt(
  transcript: string,
  meetingDate: string,
  participants: string[]
): string {
  return `당신은 회의록 분석 전문가입니다. 아래 회의 전사 내용을 분석하여 JSON 형식으로 결과를 반환하세요.

회의 날짜: ${meetingDate}
참석자: ${participants.length > 0 ? participants.join(", ") : "미지정"}

## 요구사항
1. **summary**: 회의 핵심 내용을 3~5문장으로 요약
2. **keyDecisions**: 회의에서 결정된 사항 목록 (decision + context)
3. **actionItems**: 할 일 목록
   - title: 구체적인 할 일 (동사로 시작)
   - description: 상세 설명 (선택)
   - assigneeHint: 담당자 이름 힌트 (회의록에서 추론, 없으면 생략)
   - priority: HIGH/MEDIUM/LOW
   - dueDateRaw: 자연어 마감일 (예: "다음 주 금요일", "3일 이내")
   - confidence: 0.0~1.0 (이 할 일이 실제 액션아이템일 확신도)
   - sourceText: 이 할 일이 도출된 원문 발화

## 규칙
- confidence 0.75 미만이면 '확인 필요' 항목
- 마감일이 불확실하면 dueDateRaw에 원문 그대로 유지
- 참석자 이름과 정확히 일치하는 경우만 assigneeHint 제공

## 전사 내용
${transcript}

## 출력 형식 (JSON만 반환, 다른 텍스트 없이)
{
  "summary": "...",
  "keyDecisions": [{"decision": "...", "context": "..."}],
  "actionItems": [{"title": "...", "description": "...", "assigneeHint": "...", "priority": "MEDIUM", "dueDateRaw": "...", "confidence": 0.9, "sourceText": "..."}]
}`;
}

function parseDueDate(
  dueDateRaw: string | undefined,
  meetingDate: Date
): Date | null {
  if (!dueDateRaw) return null;

  const raw = dueDateRaw.trim();
  const baseDate = new Date(meetingDate);

  // "N일 이내", "N일 후"
  const daysMatch = raw.match(/(\d+)\s*일\s*(이내|후|뒤|내)/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1]);
    baseDate.setDate(baseDate.getDate() + days);
    return baseDate;
  }

  // "다음 주 X요일"
  const nextWeekDay = raw.match(/다음\s*주\s*(월|화|수|목|금|토|일)/);
  if (nextWeekDay) {
    const dayMap: Record<string, number> = {
      일: 0, 월: 1, 화: 2, 수: 3, 목: 4, 금: 5, 토: 6,
    };
    const targetDay = dayMap[nextWeekDay[1]];
    const currentDay = baseDate.getDay();
    const daysUntilNextWeek = 7 - currentDay + targetDay;
    baseDate.setDate(baseDate.getDate() + daysUntilNextWeek);
    return baseDate;
  }

  // "이번 주 X요일"
  const thisWeekDay = raw.match(/이번\s*주\s*(월|화|수|목|금|토|일)/);
  if (thisWeekDay) {
    const dayMap: Record<string, number> = {
      일: 0, 월: 1, 화: 2, 수: 3, 목: 4, 금: 5, 토: 6,
    };
    const targetDay = dayMap[thisWeekDay[1]];
    const currentDay = baseDate.getDay();
    const diff = targetDay - currentDay;
    baseDate.setDate(baseDate.getDate() + (diff >= 0 ? diff : diff + 7));
    return baseDate;
  }

  // "N주 이내/후"
  const weeksMatch = raw.match(/(\d+)\s*주\s*(이내|후|뒤|내)/);
  if (weeksMatch) {
    const weeks = parseInt(weeksMatch[1]);
    baseDate.setDate(baseDate.getDate() + weeks * 7);
    return baseDate;
  }

  // "이번 달 말", "월말"
  if (raw.includes("월말") || raw.includes("달 말")) {
    baseDate.setMonth(baseDate.getMonth() + 1, 0);
    return baseDate;
  }

  // ISO 날짜 형식 (YYYY-MM-DD)
  const isoMatch = raw.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    return new Date(`${isoMatch[1]}-${isoMatch[2].padStart(2, "0")}-${isoMatch[3].padStart(2, "0")}`);
  }

  // M월 D일
  const koreanDate = raw.match(/(\d{1,2})월\s*(\d{1,2})일/);
  if (koreanDate) {
    const year = baseDate.getFullYear();
    return new Date(`${year}-${koreanDate[1].padStart(2, "0")}-${koreanDate[2].padStart(2, "0")}`);
  }

  return null;
}

function validateOutput(data: unknown): SummaryOutput {
  if (!data || typeof data !== "object") {
    throw new Error("AI 출력이 객체가 아닙니다");
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.summary !== "string" || !obj.summary.trim()) {
    throw new Error("summary 필드가 없거나 비어있습니다");
  }

  if (!Array.isArray(obj.keyDecisions)) {
    throw new Error("keyDecisions 필드가 배열이 아닙니다");
  }

  if (!Array.isArray(obj.actionItems)) {
    throw new Error("actionItems 필드가 배열이 아닙니다");
  }

  for (const item of obj.actionItems) {
    if (typeof item !== "object" || !item) {
      throw new Error("actionItem 항목이 객체가 아닙니다");
    }
    const ai = item as Record<string, unknown>;
    if (typeof ai.title !== "string" || !ai.title.trim()) {
      throw new Error("actionItem.title이 없거나 비어있습니다");
    }
    if (typeof ai.confidence !== "number" || ai.confidence < 0 || ai.confidence > 1) {
      throw new Error("actionItem.confidence가 유효하지 않습니다");
    }
    if (!["HIGH", "MEDIUM", "LOW"].includes(ai.priority as string)) {
      (ai as Record<string, unknown>).priority = "MEDIUM";
    }
  }

  return obj as unknown as SummaryOutput;
}

export const summarizeMeeting = task({
  id: "summarize-meeting",
  maxDuration: 600,
  run: async (payload: { meetingId: string }) => {
    const { meetingId } = payload;

    // 1. Meeting + TranscriptSegment 조회
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        segments: { orderBy: { startTime: "asc" } },
        summaries: { orderBy: { version: "desc" }, take: 1 },
      },
    });

    if (!meeting) throw new Error(`Meeting not found: ${meetingId}`);
    if (meeting.segments.length === 0) {
      throw new Error("전사 데이터가 없습니다");
    }

    // 전사 텍스트 조합
    const transcript = meeting.segments
      .map((seg) => {
        if (meeting.isTextPaste) return seg.text;
        const time = `${Math.floor(seg.startTime / 60)}:${String(Math.floor(seg.startTime % 60)).padStart(2, "0")}`;
        return `[${time}] ${seg.speakerName ?? seg.speakerLabel}: ${seg.text}`;
      })
      .join("\n");

    const meetingDateStr = new Date(meeting.meetingDate).toISOString().split("T")[0];

    // 2. Gemini API 호출
    const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await genai.models.generateContent({
      model: MODEL_ID,
      contents: buildPrompt(transcript, meetingDateStr, meeting.participants),
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            keyDecisions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  decision: { type: "string" },
                  context: { type: "string" },
                },
                required: ["decision", "context"],
              },
            },
            actionItems: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  assigneeHint: { type: "string" },
                  priority: { type: "string", enum: ["HIGH", "MEDIUM", "LOW"] },
                  dueDateRaw: { type: "string" },
                  confidence: { type: "number" },
                  sourceText: { type: "string" },
                },
                required: ["title", "priority", "confidence", "sourceText"],
              },
            },
          },
          required: ["summary", "keyDecisions", "actionItems"],
        },
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Gemini API 응답에 텍스트가 없습니다");
    }

    // 3. JSON 파싱 + 스키마 검증
    let parsed: unknown;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      throw new Error(`AI 출력 JSON 파싱 실패: ${responseText.substring(0, 200)}`);
    }

    const output = validateOutput(parsed);

    // 4. 기존 버전 확인 (재처리 시 version 증가)
    const currentVersion = meeting.summaries[0]?.version ?? 0;
    const newVersion = currentVersion + 1;

    // 5. MeetingSummary 저장
    await prisma.meetingSummary.create({
      data: {
        meetingId,
        summary: output.summary,
        keyDecisions: output.keyDecisions,
        modelId: MODEL_ID,
        modelVersion: MODEL_ID,
        promptVersion: PROMPT_VERSION,
        rawModelOutput: JSON.parse(JSON.stringify({ text: responseText, usageMetadata: response.usageMetadata })),
        version: newVersion,
      },
    });

    // 6. ActionItem 저장
    if (output.actionItems.length > 0) {
      const priorityMap: Record<string, ActionItemPriority> = {
        HIGH: ActionItemPriority.HIGH,
        MEDIUM: ActionItemPriority.MEDIUM,
        LOW: ActionItemPriority.LOW,
      };

      await prisma.actionItem.createMany({
        data: output.actionItems.map((item) => {
          const dueDate = parseDueDate(item.dueDateRaw, meeting.meetingDate);
          return {
            meetingId,
            workspaceId: meeting.workspaceId,
            title: item.title,
            description: item.description ?? null,
            priority: priorityMap[item.priority] ?? ActionItemPriority.MEDIUM,
            dueDate,
            dueDateRaw: item.dueDateRaw ?? null,
            confidence: item.confidence,
            sourceText: item.sourceText ?? null,
          };
        }),
      });
    }

    return {
      meetingId,
      version: newVersion,
      actionItemCount: output.actionItems.length,
      status: "completed",
    };
  },
});
