# Phase 5: 운영 기능 & 베타

> 기간: Beta Sprint (1주) | WI: 6개 (P0: 6)

## WI 목록

### WI-#45: Auto-OVERDUE 일일 점검 Job (P0)
- Trigger.dev `check-overdue` schedules.task (cron `0 0 * * *`, 매일 00:00 UTC)
- CONFIRMED/IN_PROGRESS + dueDate < today인 ActionItem → OVERDUE 전환
- NotificationLog 생성 (type: OVERDUE) + `send-reminder` Job 트리거
- 기존 OVERDUE 알림 3회 이상이면 추가 알림 생략 (`MAX_OVERDUE_REMINDERS = 3`)
- 반환: `{ transitioned, notified }`
- 테스트 4건: 빈 결과 / 전환+알림 / 최대 횟수 도달 시 스킵 / 복수 아이템 혼합 상태
- **파일**: `src/trigger/check-overdue.ts`, `src/trigger/__tests__/check-overdue.test.ts`
- **완료 기준**: cron Job으로 마감 초과 아이템 자동 OVERDUE 전환 + 알림 발송

### WI-#46: Archive API + UI (P0)
- `POST /api/v1/meetings/[meetingId]/archive` — Admin 이상, PUBLISHED → ARCHIVED 전환
- `transitionMeetingStatus(prisma, meetingId, PUBLISHED, ARCHIVED)` 호출
- `createAuditLog({ action: "meeting.archived", entity: "meeting" })` 감사 로그 기록
- UI: `MeetingActions` 컴포넌트에 "보관" 버튼 추가 (status === "PUBLISHED" 조건)
- 회의 목록: `?archived=true` searchParams로 "보관함 보기" 토글
- 쿼리: `getMeetingsByWorkspace(workspaceId, { includeArchived })` — `deletedAt: null` 필터 + ARCHIVED 선택적 제외
- 상세 쿼리: `getMeetingDetail` → `findFirst`로 변경, `deletedAt: null` 조건 추가
- **파일**:
  - NEW: `src/app/api/v1/meetings/[meetingId]/archive/route.ts`
  - MOD: `src/app/(dashboard)/workspaces/[workspaceId]/meetings/[meetingId]/meeting-actions.tsx`
  - MOD: `src/app/(dashboard)/workspaces/[workspaceId]/meetings/page.tsx`
  - MOD: `src/modules/meeting/internal/queries.ts`
- **완료 기준**: PUBLISHED 회의 보관 + 목록에서 기본 숨김 + 보관함 토글

### WI-#47: 주간 미완료 요약 이메일 Job (P0)
- Trigger.dev `weekly-summary` schedules.task (cron `0 0 * * 1`, 매주 월요일 00:00 UTC)
- 워크스페이스별 미완료 ActionItem 조회 (OVERDUE/CONFIRMED/IN_PROGRESS)
- Admin/Owner 멤버에게 `weeklySummaryEmailHtml()` 템플릿으로 이메일 발송 (Resend)
- NotificationLog 생성 (type: WEEKLY_SUMMARY, sent/sentAt 기록)
- 발송 실패 시 errorMessage 기록, 다른 멤버 계속 진행
- 반환: `{ sentCount }`
- **파일**: `src/trigger/weekly-summary.ts`
- **완료 기준**: 매주 월요일 Admin/Owner에게 미완료 작업 요약 이메일 발송

### WI-#48: 사용자 시간대 기반 리마인드 (P0)
- `toUtcFromTimezone(baseDate: Date, hour: number, timezone: string): Date` — Intl.DateTimeFormat 기반 UTC 변환
- `scheduleReminderNotifications()` 수정: `user.timezone` 조회 → `toUtcFromTimezone()` 호출로 09:00 로컬 → UTC 변환
- 기본 시간대: `Asia/Seoul` (user.timezone이 null인 경우)
- notification 모듈 public export에 `toUtcFromTimezone` 추가
- 테스트 4건: KST 09:00→UTC 00:00 / EST 09:00→UTC 14:00 / UTC 직접 / JST(UTC+9)
- **파일**:
  - NEW: `src/modules/notification/internal/timezone.ts`
  - NEW: `src/modules/notification/internal/__tests__/timezone.test.ts`
  - MOD: `src/modules/notification/internal/actions.ts`
  - MOD: `src/modules/notification/index.ts`
- **완료 기준**: 리마인드 스케줄이 사용자 시간대 09:00 기준 UTC로 저장

### WI-#49: 데이터 삭제 파이프라인 (P0)
- Meeting 모델에 `deletedAt DateTime? @map("deleted_at")` 필드 추가 (Prisma schema)
- `DELETE /api/v1/meetings/[meetingId]` — Admin 이상, soft-delete (`deletedAt: new Date()`)
- `createAuditLog({ action: "meeting.deleted", entity: "meeting" })` 감사 로그 기록
- Trigger.dev `cleanup-deleted` schedules.task (cron `0 2 * * *`, 매일 02:00 UTC)
  - `deletedAt` > 30일 경과 회의 조회 (`RETENTION_DAYS = 30`)
  - Supabase Storage `meeting-files` 버킷에서 파일 삭제 (service_role 클라이언트)
  - `prisma.meeting.deleteMany()` hard-delete (cascade)
  - 반환: `{ deleted, storageCleanup }`
- **파일**:
  - MOD: `prisma/schema.prisma` (Meeting 모델 deletedAt 추가)
  - NEW: `src/app/api/v1/meetings/[meetingId]/route.ts` (DELETE)
  - NEW: `src/trigger/cleanup-deleted.ts`
- **완료 기준**: soft-delete API + 30일 후 자동 하드 삭제(Storage 파일 포함)

### WI-#50: 감사 로그 모듈 (P0)
- 모듈 구조: `src/modules/audit/index.ts` → `internal/actions.ts`, `internal/queries.ts`
- `createAuditLog({ workspaceId, userId, action, entity, entityId?, metadata? })` — AuditLog 레코드 생성
- `getAuditLogs({ workspaceId, entity?, entityId?, limit?, cursor? })` — cursor 기반 페이지네이션 (DEFAULT_LIMIT=50, MAX_LIMIT=200)
- `GET /api/v1/admin/audit-logs?workspaceId=...&entity=...&entityId=...&limit=...&cursor=...` — Admin 이상 조회
- AuditLog Prisma 모델: id, workspaceId, userId, action, entity, entityId?, metadata?, createdAt
- 감사 로그 통합 지점: publish route, archive route, delete route
- 테스트 2건: 전체 필드 생성 / 옵션 필드 없이 생성
- **파일**:
  - NEW: `src/modules/audit/index.ts`
  - NEW: `src/modules/audit/internal/actions.ts`
  - NEW: `src/modules/audit/internal/queries.ts`
  - NEW: `src/app/api/v1/admin/audit-logs/route.ts`
  - NEW: `src/modules/audit/internal/__tests__/actions.test.ts`
- **완료 기준**: 감사 로그 기록/조회 API + 주요 경로에 통합

## Phase 완료 기준
- [x] Auto-OVERDUE cron Job 동작 (마감 초과 자동 전환)
- [x] Archive API + 보관함 UI 동작
- [x] 주간 미완료 요약 이메일 Job 동작
- [x] 사용자 시간대 기반 리마인드 UTC 변환
- [x] Soft-delete + 30일 후 자동 정리 파이프라인
- [x] 감사 로그 모듈 + API 동작
- [x] 단위 테스트 통과 (10건 추가: check-overdue 4 + timezone 4 + audit 2)
- [x] CI 5-Gate 통과

**완료**: Phase 5 전체 P0 6개 WI 구현 완료 (2026-03-03)
