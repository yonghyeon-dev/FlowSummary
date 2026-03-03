"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface KeyDecision {
  decision: string;
  context: string;
}

interface SummaryData {
  id: string;
  summary: string;
  keyDecisions: KeyDecision[] | null;
  version: number;
  modelId: string;
  promptVersion: string | null;
}

export function SummaryReview({
  summary,
  isReviewMode,
}: {
  summary: SummaryData;
  isReviewMode: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(summary.summary);
  const [saving, setSaving] = useState(false);

  const decisions = Array.isArray(summary.keyDecisions)
    ? (summary.keyDecisions as KeyDecision[])
    : [];

  async function handleSave() {
    setSaving(true);
    // 요약 텍스트 수정은 직접 DB 업데이트 (server action)
    // 간단한 구현: PATCH API는 Phase 후반에 추가 가능
    // 현재는 UI만 준비
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            요약
            <Badge variant="outline" className="text-xs font-normal">
              v{summary.version}
            </Badge>
          </CardTitle>
          {isReviewMode && !editing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(true)}
            >
              편집
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {editing ? (
          <div className="space-y-2">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={saving}>
                저장
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setText(summary.summary);
                  setEditing(false);
                }}
              >
                취소
              </Button>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{summary.summary}</p>
        )}

        {decisions.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">핵심 결정사항</h4>
            <ul className="space-y-2">
              {decisions.map((d, i) => (
                <li key={i} className="text-sm">
                  <span className="font-medium">{d.decision}</span>
                  {d.context && (
                    <span className="text-muted-foreground ml-1">
                      — {d.context}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          모델: {summary.modelId} · 프롬프트: {summary.promptVersion ?? "-"}
        </div>
      </CardContent>
    </Card>
  );
}
