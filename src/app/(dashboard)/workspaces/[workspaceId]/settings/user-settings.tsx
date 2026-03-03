"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const TIMEZONE_OPTIONS = [
  { value: "Asia/Seoul", label: "한국 (KST, UTC+9)" },
  { value: "Asia/Tokyo", label: "일본 (JST, UTC+9)" },
  { value: "Asia/Shanghai", label: "중국 (CST, UTC+8)" },
  { value: "America/New_York", label: "미국 동부 (ET, UTC-5)" },
  { value: "America/Los_Angeles", label: "미국 서부 (PT, UTC-8)" },
  { value: "Europe/London", label: "영국 (GMT, UTC+0)" },
  { value: "Europe/Berlin", label: "독일 (CET, UTC+1)" },
  { value: "UTC", label: "UTC" },
];

interface UserSettingsProps {
  timezone: string;
  notificationEnabled: boolean;
}

export function UserSettings({
  timezone: initialTimezone,
  notificationEnabled: initialNotification,
}: UserSettingsProps) {
  const router = useRouter();
  const [timezone, setTimezone] = useState(initialTimezone);
  const [notificationEnabled, setNotificationEnabled] =
    useState(initialNotification);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/v1/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timezone, notificationEnabled }),
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage(data.error || "저장 실패");
        return;
      }

      setMessage("저장되었습니다");
      router.refresh();
    } catch {
      setMessage("저장 중 오류가 발생했습니다");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="timezone">시간대</Label>
        <Select value={timezone} onValueChange={setTimezone}>
          <SelectTrigger id="timezone">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONE_OPTIONS.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          리마인드 이메일이 이 시간대의 오전 9시에 발송됩니다
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="notification">이메일 알림</Label>
          <p className="text-xs text-muted-foreground">
            할 일 배정, 마감 리마인드, 지연 알림
          </p>
        </div>
        <Switch
          id="notification"
          checked={notificationEnabled}
          onCheckedChange={setNotificationEnabled}
        />
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? "저장 중..." : "저장"}
        </Button>
        {message && (
          <span
            className={`text-sm ${message === "저장되었습니다" ? "text-green-600" : "text-destructive"}`}
          >
            {message}
          </span>
        )}
      </div>
    </div>
  );
}
