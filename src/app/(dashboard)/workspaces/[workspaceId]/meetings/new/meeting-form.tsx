"use client";

import { useState } from "react";
import { createMeeting, createTextMeeting } from "@/modules/meeting";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface MeetingFormProps {
  workspaceId: string;
  error?: string;
}

type Mode = "upload" | "text";

const ALLOWED_TYPES = [
  "audio/mpeg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/wav",
  "audio/wave",
  "video/mp4",
  "video/quicktime",
];
const MAX_SIZE = 500 * 1024 * 1024;

export function MeetingForm({ workspaceId, error }: MeetingFormProps) {
  const [mode, setMode] = useState<Mode>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileError, setFileError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    setFileError(null);

    if (!selected) {
      setFile(null);
      return;
    }

    if (!ALLOWED_TYPES.includes(selected.type)) {
      setFileError("지원하지 않는 파일 형식입니다 (mp3, m4a, wav, mp4, mov)");
      setFile(null);
      return;
    }

    if (selected.size > MAX_SIZE) {
      setFileError("파일 크기가 500MB를 초과합니다");
      setFile(null);
      return;
    }

    setFile(selected);
  }

  async function handleUploadSubmit(formData: FormData) {
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // 사전 서명 URL 요청
      const res = await fetch("/api/v1/meetings/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setFileError(data.error || "업로드 URL 생성 실패");
        setUploading(false);
        return;
      }

      const { signedUrl, storagePath } = await res.json();

      // 파일 업로드 (XHR로 진행률 추적)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        });
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`업로드 실패: ${xhr.status}`));
        });
        xhr.addEventListener("error", () => reject(new Error("업로드 실패")));
        xhr.open("PUT", signedUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      // Meeting 레코드 생성
      formData.set("workspaceId", workspaceId);
      formData.set("storagePath", storagePath);
      formData.set("fileName", file.name);
      formData.set("mimeType", file.type);
      formData.set("fileSize", String(file.size));

      await createMeeting(formData);
    } catch (err) {
      setFileError(err instanceof Error ? err.message : "업로드 실패");
      setUploading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>새 회의</CardTitle>
          <CardDescription>
            회의 파일을 업로드하거나 텍스트를 붙여넣으세요
          </CardDescription>
          <div className="flex gap-2 pt-2">
            <Button
              variant={mode === "upload" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("upload")}
            >
              파일 업로드
            </Button>
            <Button
              variant={mode === "text" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("text")}
            >
              텍스트 붙여넣기
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {(error || fileError) && (
            <p className="text-sm text-destructive mb-4">
              {error || fileError}
            </p>
          )}

          {mode === "upload" ? (
            <form action={handleUploadSubmit} className="flex flex-col gap-4">
              <div className="space-y-1">
                <Label htmlFor="title">제목</Label>
                <Input id="title" name="title" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="meetingDate">회의 날짜</Label>
                <Input
                  id="meetingDate"
                  name="meetingDate"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="participants">참석자 (쉼표 구분)</Label>
                <Input
                  id="participants"
                  name="participants"
                  placeholder="홍길동, 김철수"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="file">회의 파일</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".mp3,.m4a,.wav,.mp4,.mov"
                  onChange={handleFileChange}
                  required
                />
                {file && (
                  <p className="text-xs text-muted-foreground">
                    {file.name} ({(file.size / 1024 / 1024).toFixed(1)}MB)
                  </p>
                )}
              </div>

              {uploading && (
                <div className="space-y-1">
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    {uploadProgress}% 업로드 중...
                  </p>
                </div>
              )}

              <Button type="submit" disabled={!file || uploading}>
                {uploading ? "업로드 중..." : "업로드"}
              </Button>
            </form>
          ) : (
            <form action={createTextMeeting} className="flex flex-col gap-4">
              <input type="hidden" name="workspaceId" value={workspaceId} />
              <div className="space-y-1">
                <Label htmlFor="title">제목</Label>
                <Input id="title" name="title" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="meetingDate">회의 날짜</Label>
                <Input
                  id="meetingDate"
                  name="meetingDate"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="participants">참석자 (쉼표 구분)</Label>
                <Input
                  id="participants"
                  name="participants"
                  placeholder="홍길동, 김철수"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="transcript">회의록 텍스트</Label>
                <Textarea
                  id="transcript"
                  name="transcript"
                  rows={10}
                  placeholder="회의 내용을 붙여넣으세요..."
                  required
                />
              </div>
              <Button type="submit">저장</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
