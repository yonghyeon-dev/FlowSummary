"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface MeetingActionsProps {
  meetingId: string;
  status: string;
  hasSegments: boolean;
  hasSummary: boolean;
}

export function MeetingActions({
  meetingId,
  status,
  hasSegments,
  hasSummary,
}: MeetingActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAction(action: "summarize" | "publish" | "retry" | "archive") {
    setLoading(action);
    setError(null);

    try {
      const res = await fetch(`/api/v1/meetings/${meetingId}/${action}`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "작업 실패");
        return;
      }

      router.refresh();
    } catch {
      setError("요청 중 오류가 발생했습니다");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* 요약 실행 버튼: 전사 완료 + 요약 없음 */}
      {status === "REVIEW_NEEDED" && hasSegments && !hasSummary && (
        <Button
          onClick={() => handleAction("summarize")}
          disabled={loading !== null}
        >
          {loading === "summarize" ? "요약 중..." : "AI 요약 실행"}
        </Button>
      )}

      {/* 게시 버튼: 검수 필요 상태 */}
      {status === "REVIEW_NEEDED" && hasSummary && (
        <Button
          onClick={() => handleAction("publish")}
          disabled={loading !== null}
        >
          {loading === "publish" ? "게시 중..." : "게시"}
        </Button>
      )}

      {/* 보관 버튼: 게시됨 상태 */}
      {status === "PUBLISHED" && (
        <Button
          variant="outline"
          onClick={() => handleAction("archive")}
          disabled={loading !== null}
        >
          {loading === "archive" ? "보관 중..." : "보관"}
        </Button>
      )}

      {/* 재처리 버튼: 실패 상태 */}
      {status === "FAILED" && (
        <Button
          variant="outline"
          onClick={() => handleAction("retry")}
          disabled={loading !== null}
        >
          {loading === "retry" ? "재처리 중..." : "재처리"}
        </Button>
      )}

      {error && <span className="text-sm text-destructive">{error}</span>}
    </div>
  );
}
