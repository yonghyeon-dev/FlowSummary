# Phase 3: AI 요약 & 액션아이템 검수

> 기간: Sprint 3 (1주) | WI: 10개 (P0: 9, P1: 1)

## WI 목록

### WI-#25: Claude API 요약 Job 구현 (P0) — FR-AI-003
- Trigger.dev `summarize-meeting` Job 실제 구현
- TranscriptSegment → Claude API → 구조화 출력
- JSON 스키마 검증 통과 시에만 저장
- MeetingSummary 생성 (summary, keyDecisions, modelId, promptVersion)
- Meeting status: REVIEW_NEEDED → 유지 (이미 REVIEW_NEEDED 상태)
- **완료 기준**: 전사 데이터 → Claude 요약 → MeetingSummary DB 저장

### WI-#26: 액션아이템 자동 추출 (P0) — FR-AI-004
- Claude API 응답에서 ActionItem 추출
- 자연어 마감일 → 회의일 기준 절대 날짜 변환 (실패 시 null + dueDateRaw 유지)
- confidence 점수 포함 (0.75 미만 → '확인 필요')
- ActionItem status: EXTRACTED (자동 생성)
- **완료 기준**: Claude 응답 → ActionItem 레코드 생성 + confidence 점수

### WI-#27: ActionItem 상태 머신 구현 (P0)
- EXTRACTED → CONFIRMED → IN_PROGRESS → DONE
- OVERDUE (시스템 자동, 마감일 초과)
- CANCELED (Admin 이상)
- done 전환: 담당자 본인 또는 Admin 이상
- **완료 기준**: 상태 전이 단위 테스트 통과

### WI-#28: ActionItem CRUD API (P0)
- `PATCH /api/v1/action-items/[id]` — 상태 변경, 담당자 할당, 마감일 수정
- ActionItemHistory 자동 기록 (field, oldValue, newValue)
- 권한 검사: 워크스페이스 멤버 확인 + 역할별 제한
- **완료 기준**: API Route + 서버 액션 + 변경 이력 저장

### WI-#29: 요약 검수 UI (P0) — FR-REV-001
- 회의 상세 페이지에 요약 검수 섹션 추가
- 요약 텍스트 인라인 편집
- 핵심 결정사항 목록 표시/편집
- confidence < 0.75 항목에 '확인 필요' 배지
- **완료 기준**: 요약 내용 확인/편집 가능

### WI-#30: 액션아이템 검수 UI (P0) — FR-REV-002
- 액션아이템 목록 카드 UI
- 담당자 할당 (워크스페이스 멤버 드롭다운)
- 마감일 설정 (DatePicker)
- 상태 변경 (EXTRACTED → CONFIRMED)
- confidence 배지 표시
- **완료 기준**: 액션아이템 편집/확정 가능

### WI-#31: 게시 플로우 (P0) — FR-REV-003
- REVIEW_NEEDED → PUBLISHED 전환 버튼
- 게시 전 미확정 액션아이템 경고
- 게시 후 상태 변경 + 참석자에게 알림 트리거 (Phase 4 연결점)
- **완료 기준**: 게시 버튼 → PUBLISHED 전환

### WI-#32: 재처리 (P0) — FR-AI-005
- FAILED → PROCESSING 재시도
- 재처리 시 기존 결과 보존 (version 증가)
- 재처리 버튼 UI
- **완료 기준**: 실패한 회의 재처리 가능

### WI-#33: 요약 트리거 API (P0)
- `POST /api/v1/meetings/[id]/summarize` — 수동 요약 트리거
- `POST /api/v1/meetings/[id]/publish` — 게시 전환
- 텍스트 붙여넣기 회의: 생성 즉시 자동 요약 트리거
- **완료 기준**: API 통해 요약/게시 호출 가능

### WI-#34: 내 할 일 페이지 (P1)
- `/workspaces/[id]/tasks` 페이지 구현 (서버 컴포넌트 + 클라이언트 TaskList)
- `getActionItemsByUser(userId, workspaceId)` — assigneeUserId 기준 조회 (CANCELED 제외)
- `TaskList` 클라이언트 컴포넌트:
  - 상태 필터 6종 (전체, EXTRACTED, CONFIRMED, IN_PROGRESS, OVERDUE, DONE)
  - "진행 중" / "완료" 두 섹션 분리
  - `handleStatusChange()` → 상태 전이 (EXTRACTED→CONFIRMED→IN_PROGRESS→DONE, OVERDUE→IN_PROGRESS)
  - 마감일 초과 항목 `text-destructive` 강조
- **파일**:
  - NEW: `src/app/(dashboard)/workspaces/[workspaceId]/tasks/task-list.tsx`
  - MOD: `src/app/(dashboard)/workspaces/[workspaceId]/tasks/page.tsx`
- **완료 기준**: 개인 할 일 목록 확인 + 상태 필터 + 상태 변경 가능

## Phase 완료 기준
- [x] Claude API 요약 Job 동작 (API 키 없어도 빌드 가능)
- [x] ActionItem 상태 머신 단위 테스트 통과
- [x] 요약 + 액션아이템 검수 UI 동작
- [x] 게시 플로우 (REVIEW_NEEDED → PUBLISHED)
- [x] 재처리 플로우 (FAILED → PROCESSING)
- [x] CI 5-Gate 통과

**완료**: PR #35 머지 (2026-03-03), 테스트 60개 통과
