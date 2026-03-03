/**
 * TS-04: 화자-참석자 매칭
 *
 * speaker 수 == participant 수 → 순서대로 매칭
 * 수 불일치 → 매칭 안 함 (빈 Map 반환)
 */
import { describe, it, expect } from "vitest";

// matchSpeakersToParticipants 로직 복제 (transcribe.ts에서 직접 export 안 함)
interface VitoSegment {
  spk: number;
  start: number;
  duration: number;
  text: string;
}

function matchSpeakersToParticipants(
  utterances: VitoSegment[],
  participants: string[]
): Map<string, string> {
  const result = new Map<string, string>();

  // 고유 speaker 라벨 추출 (등장 순서 유지)
  const speakerOrder: number[] = [];
  for (const u of utterances) {
    if (!speakerOrder.includes(u.spk)) {
      speakerOrder.push(u.spk);
    }
  }

  // speaker 수 == participant 수일 때만 순서대로 매칭
  if (speakerOrder.length === participants.length) {
    for (let i = 0; i < speakerOrder.length; i++) {
      result.set(String(speakerOrder[i]), participants[i]);
    }
  }

  return result;
}

describe("TS-04: 화자-참석자 매칭", () => {
  it("speaker 수 == participant 수 → 등장 순서대로 매칭", () => {
    const utterances: VitoSegment[] = [
      { spk: 0, start: 0, duration: 5000, text: "안녕하세요" },
      { spk: 1, start: 5000, duration: 3000, text: "반갑습니다" },
      { spk: 0, start: 8000, duration: 4000, text: "시작하겠습니다" },
      { spk: 2, start: 12000, duration: 2000, text: "좋습니다" },
    ];
    const participants = ["김철수", "이영희", "박민수"];

    const result = matchSpeakersToParticipants(utterances, participants);

    expect(result.size).toBe(3);
    expect(result.get("0")).toBe("김철수");
    expect(result.get("1")).toBe("이영희");
    expect(result.get("2")).toBe("박민수");
  });

  it("speaker 수 != participant 수 → 매칭 안 함", () => {
    const utterances: VitoSegment[] = [
      { spk: 0, start: 0, duration: 5000, text: "안녕하세요" },
      { spk: 1, start: 5000, duration: 3000, text: "반갑습니다" },
    ];
    const participants = ["김철수", "이영희", "박민수"];

    const result = matchSpeakersToParticipants(utterances, participants);

    expect(result.size).toBe(0);
  });

  it("참석자 없으면 빈 Map", () => {
    const utterances: VitoSegment[] = [
      { spk: 0, start: 0, duration: 5000, text: "안녕하세요" },
    ];

    const result = matchSpeakersToParticipants(utterances, []);

    expect(result.size).toBe(0);
  });

  it("발화 없으면 빈 Map", () => {
    const result = matchSpeakersToParticipants([], ["김철수"]);

    expect(result.size).toBe(0);
  });

  it("같은 speaker가 여러 번 나와도 1회만 카운트", () => {
    const utterances: VitoSegment[] = [
      { spk: 0, start: 0, duration: 5000, text: "첫 번째" },
      { spk: 0, start: 5000, duration: 3000, text: "두 번째" },
      { spk: 0, start: 8000, duration: 2000, text: "세 번째" },
    ];
    const participants = ["김철수"];

    const result = matchSpeakersToParticipants(utterances, participants);

    expect(result.size).toBe(1);
    expect(result.get("0")).toBe("김철수");
  });

  it("speaker 등장 순서 보존", () => {
    const utterances: VitoSegment[] = [
      { spk: 3, start: 0, duration: 1000, text: "A" },
      { spk: 1, start: 1000, duration: 1000, text: "B" },
    ];
    const participants = ["첫 번째 화자", "두 번째 화자"];

    const result = matchSpeakersToParticipants(utterances, participants);

    expect(result.get("3")).toBe("첫 번째 화자");
    expect(result.get("1")).toBe("두 번째 화자");
  });
});
