# Phase 2: 회의 업로드 & 전사 파이프라인

> 기간: Sprint 2 (1주) | WI: 8개 (P0: 6, P1: 2)

## WI 목록

### WI-#14: 파일 업로드 (P0) — FR-MTG-001
- Supabase Storage 사전 서명 URL 업로드
- 지원 확장자: mp3, m4a, wav, mp4, mov
- 파일 크기 제한: 500MB
- API: `POST /api/v1/meetings/upload-url` → 사전 서명 URL 반환
- **완료 기준**: 파일 선택 → 사전 서명 URL 업로드 → MeetingAsset 저장

### WI-#15: 회의 메타데이터 입력 & 레코드 생성 (P0) — FR-MTG-002
- 회의 생성 폼: 제목, 날짜, 참석자
- Meeting 레코드 생성 (status: UPLOADED)
- API: `POST /api/v1/workspaces/[id]/meetings`
- **완료 기준**: 폼 제출 → Meeting + MeetingAsset 생성

### WI-#16: 업로드 진행률 & 처리 상태 표시 (P0) — FR-MTG-003
- 업로드 진행률 표시 (클라이언트)
- 처리 상태 배지 (uploaded/processing/review_needed/failed)
- 회의 목록 페이지에 상태 표시
- **완료 기준**: 회의 목록에서 상태 확인 가능

### WI-#17: 텍스트 회의록 붙여넣기 모드 (P0) — FR-MTG-004
- 파일 업로드 대신 텍스트 직접 입력
- is_text_paste=true로 Meeting 생성
- TranscriptSegment에 전체 텍스트 단일 세그먼트 저장
- status → REVIEW_NEEDED (전사 스킵)
- **완료 기준**: 텍스트 붙여넣기 → 바로 요약 대기 상태

### WI-#18: Trigger.dev Job — VITO API 전사 + 화자 분리 (P0) — FR-AI-001, FR-AI-002
- VITO API로 전사 요청
- 폴링으로 완료 대기
- 화자 분리 결과 포함
- TranscriptSegment 저장 (speaker_label, text, start/end time, confidence)
- Meeting status: PROCESSING → REVIEW_NEEDED (또는 FAILED)
- **완료 기준**: 음성 파일 → VITO 전사 → 세그먼트 DB 저장

### WI-#19: 회의 상태 전이 구현 (P0)
- 유효한 전이만 허용하는 상태 머신 로직
- 잘못된 전이 시 에러
- **완료 기준**: 상태 전이 단위 테스트 통과

### WI-#20: 중복 업로드 감지 (P1) — FR-MTG-005
- 클라이언트에서 파일 SHA-256 해시 계산 (`crypto.subtle.digest`)
- FormData에 `fileHash` 포함 → 서버에서 동일 `fileHash + meetingDate` 조합 검사
- 중복 시 에러 반환
- **스키마**: `MeetingAsset.fileHash String? @map("file_hash")`
- **파일**:
  - MOD: `src/app/(dashboard)/workspaces/[workspaceId]/meetings/new/meeting-form.tsx`
  - MOD: `src/modules/meeting/internal/queries.ts`

### WI-#21: 참석자 후보-화자 매칭 (P1) — FR-AI-006
- `matchSpeakersToParticipants(utterances, participants)` 함수
- VITO API 화자 분리 결과에서 고유 speaker 라벨 추출 (등장 순서 유지)
- speaker 수 == participant 수일 때만 순서대로 매칭, 그 외 자동 확정 안 함
- 매칭 결과를 `TranscriptSegment.speakerName`에 저장
- **스키마**: `TranscriptSegment.speakerName String? @map("speaker_name")`
- **파일**: MOD `src/trigger/transcribe.ts`

## Phase 완료 기준
- [ ] 파일 업로드 → Meeting/MeetingAsset 생성
- [ ] 텍스트 붙여넣기 → Meeting 생성 (전사 스킵)
- [ ] 회의 목록 + 상태 표시
- [ ] 상태 전이 단위 테스트 통과
- [ ] VITO 전사 Job 스캐폴드 (API 키 없어도 빌드 가능)
- [ ] CI 5-Gate 통과
