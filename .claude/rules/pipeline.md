# Async Pipeline Rules

## 절대 규칙
1. **AI 처리(전사/요약/추출)는 반드시 Trigger.dev 작업으로 실행** — API Route에서 직접 호출 금지
2. **파일 업로드는 사전 서명 URL** — 서버 경유 금지
3. **AI 출력은 JSON 스키마 검증 통과 시에만 저장** — 실패 시 `failed` 상태
4. **재처리 시 기존 결과 보존** — 덮어쓰지 않고 버전 관리
5. **AI 프롬프트와 모델 버전은 DB에 저장** — 품질 비교 가능해야 함

## 파이프라인 흐름

```
1. 클라이언트 → Supabase Storage (사전 서명 URL)
2. API Route → Meeting 레코드 생성 (status: uploaded)
3. Trigger.dev Job 1: VITO API 전사 + 화자 분리 → TranscriptSegment 저장
4. Trigger.dev Job 2: Claude API 요약 + 액션아이템 추출 → MeetingSummary + ActionItem 저장
5. status: review_needed → 사용자 검수
6. 게시 → 알림 스케줄 생성 → status: published
```

## STT 처리 세부
- VITO API로 전사 + 화자 분리 동시 처리
- 세그먼트별 speaker_label + 텍스트 + 시간 저장
- 참석자 후보 이름과 speaker_label 매칭 시도 (유사 이름은 후보 추천만, 자동 확정 안 함)

## LLM 처리 세부
- Claude API로 요약 + 액션아이템 + 의사결정 구조화 추출
- JSON 스키마 검증 통과해야 저장
- confidence 점수 포함, 0.75 미만은 '확인 필요'
- 자연어 마감일 → 회의일 기준 절대 날짜 변환 (실패 시 due_date null, 원문 유지)

## 알림 파이프라인
- 게시 시 담당자에게 이메일 발송 (Resend)
- 마감 전일/당일 오전 9시 리마인드 (사용자 시간대)
- overdue 시 하루 1회, 최대 3회 추가 리마인드
- 매주 월요일 Admin에게 주간 미완료 요약
