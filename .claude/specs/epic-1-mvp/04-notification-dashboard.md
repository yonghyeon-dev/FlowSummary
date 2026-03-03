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
- 할 일 배정 알림 템플릿
- 마감 리마인드 템플릿
- overdue 알림 템플릿
- **완료 기준**: 3종 이메일 템플릿 (HTML)

### WI-#41: 주간 미완료 요약 (P1) — FR-NTF-005
- 매주 월요일 Admin에게 주간 미완료 액션아이템 요약 이메일
- **완료 기준**: 주간 요약 이메일 스케줄 + 발송

### WI-#42: 개인 알림 설정 (P1) — FR-NTF-006
- 사용자별 알림 수신 설정 (on/off)
- **완료 기준**: 알림 설정 UI + 반영

### WI-#43: 대시보드 차트 (P1) — FR-DASH-002
- 주간 회의 수 추이
- 액션아이템 완료율 추이
- **완료 기준**: 차트 컴포넌트 표시

## Phase 완료 기준
- [ ] Resend 이메일 발송 Job 동작 (API 키 없어도 빌드 가능)
- [ ] 게시 시 알림 트리거 동작
- [ ] 대시보드 실제 통계 표시
- [ ] 단위 테스트 통과
- [ ] CI 5-Gate 통과
