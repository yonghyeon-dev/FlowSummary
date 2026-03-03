# Phase 4: 알림 & 대시보드

> 기간: Sprint 4 (1주) | WI: 9개 (P0: 5, P1: 4)

## WI 목록

### WI-#35: Resend 이메일 설정 + 발송 Job (P0) — FR-NTF-001
- Resend SDK 설치 + API 키 설정
- Trigger.dev `send-reminder` Job 실제 구현
- NotificationLog 조회 → ActionItem + User 조회 → 이메일 발송 → sent 업데이트
- **완료 기준**: NotificationLog 기반 이메일 발송 + sent/sentAt 기록

### WI-#36: 게시 시 담당자 알림 (P0) — FR-NTF-002
- Meeting PUBLISHED 전환 시 확정된 ActionItem 담당자에게 이메일
- NotificationLog 생성 (type: ASSIGNMENT, scheduledAt: now)
- send-reminder Job 트리거
- **완료 기준**: 게시 → 담당자에게 할 일 알림 이메일

### WI-#37: 마감 리마인드 스케줄링 (P0) — FR-NTF-003
- 마감 전일/당일 오전 9시 리마인드 (사용자 시간대 기반)
- NotificationLog 생성 (type: REMINDER)
- overdue 시 하루 1회, 최대 3회 추가 리마인드
- **완료 기준**: 마감일 기준 리마인드 스케줄 생성

### WI-#38: 워크스페이스 대시보드 (P0) — FR-DASH-001
- 실제 통계: 전체 회의 수, 미완료 작업, 지연 작업
- 최근 회의 목록 (최근 5건)
- 최근 액션아이템 변경 (최근 10건)
- **완료 기준**: 대시보드에 실시간 통계 표시

### WI-#39: 알림 API (P0)
- `POST /api/v1/notifications/schedule` — 수동 리마인드 트리거
- NotificationLog 조회 API
- **완료 기준**: 알림 스케줄링/조회 API 동작

### WI-#40: 이메일 템플릿 (P1) — FR-NTF-004
- 3종 인라인 스타일 HTML 템플릿 (React Email 미사용):
  - `assignmentEmailHtml({ userName, meetingTitle, actionItemTitle, dueDate, meetingUrl })` — 할 일 배정
  - `reminderEmailHtml({ ..., isOverdue, badgeColor })` — 마감 리마인드/지연
  - `weeklySummaryEmailHtml({ ..., items[], overdueCount, inProgressCount })` — 주간 요약
- 공통 헤더/푸터 (`wrapEmail()`)
- **파일**: MOD `src/modules/notification/internal/email-templates.ts`
- **완료 기준**: 3종 이메일 템플릿 (HTML)

### WI-#41: 주간 미완료 요약 (P1) — FR-NTF-005
- Trigger.dev `weekly-summary` schedules.task (cron `0 0 * * 1`, 매주 월요일 00:00 UTC)
- 모든 워크스페이스 순회 → 미완료 ActionItem 조회 (OVERDUE/CONFIRMED/IN_PROGRESS)
- Admin/Owner(isActive=true)에게 `weeklySummaryEmailHtml()` 이메일 발송 (Resend)
- NotificationLog 기록 (type: WEEKLY_SUMMARY, sent/sentAt 또는 errorMessage)
- 반환: `{ sentCount }`
- **스키마**: `NotificationType` enum에 `WEEKLY_SUMMARY` 추가
- **파일**: NEW `src/trigger/weekly-summary.ts`
- **완료 기준**: 주간 요약 이메일 스케줄 + 발송

### WI-#42: 개인 알림 설정 (P1) — FR-NTF-006
- `UserSettings` 클라이언트 컴포넌트: 시간대 드롭다운 (8개 옵션) + 알림 토글 (Switch)
- API: `GET/PATCH /api/v1/user/settings` — `{ timezone, notificationEnabled }`
- **스키마**: `User.timezone String @default("Asia/Seoul")`, `User.notificationEnabled Boolean @default(true)`
- **파일**:
  - NEW: `src/app/(dashboard)/workspaces/[workspaceId]/settings/user-settings.tsx`
  - NEW: `src/app/api/v1/user/settings/route.ts`
  - NEW: `src/components/ui/switch.tsx` (shadcn)
- **완료 기준**: 알림 설정 UI + 반영

### WI-#43: 대시보드 차트 (P1) — FR-DASH-002
- `WeeklyChart` 컴포넌트: 바 차트 (최근 8주, `{ week, count }[]`)
- `getDashboardStats(workspaceId)` — 병렬 조회 (Promise.all):
  - 주간 회의 추이 (createdAt 기준, 8주)
  - 주간 완료 추이 (ActionItem.completedAt 기준, 8주)
- `getWeeklyCounts(dates)` — 월요일 기준 주간 집계
- **스키마**: `ActionItem.completedAt DateTime? @map("completed_at")`
- **파일**:
  - NEW: `src/app/(dashboard)/workspaces/[workspaceId]/dashboard/weekly-chart.tsx`
  - MOD: `src/app/(dashboard)/workspaces/[workspaceId]/dashboard/page.tsx`
  - MOD: `src/modules/dashboard/internal/queries.ts`
- **완료 기준**: 차트 컴포넌트 표시

## Phase 완료 기준
- [x] Resend 이메일 발송 Job 동작 (API 키 없어도 빌드 가능)
- [x] 게시 시 알림 트리거 동작
- [x] 대시보드 실제 통계 표시
- [x] 단위 테스트 통과 (67개)
- [x] CI 5-Gate 통과

**완료**: PR #45 CI 통과, 머지 대기 (2026-03-03)
