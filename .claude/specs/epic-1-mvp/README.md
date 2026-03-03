# Epic 1: FlowSummary MVP

> 회의 파일을 업로드하면 AI가 요약하고 액션 아이템을 추출하여
> "누가, 무엇을, 언제까지"를 자동 추적하는 팀용 서비스

## 모델 스택
| 레이어 | 기술 |
|--------|------|
| Frontend | Next.js 16 (App Router) + shadcn/ui |
| Auth | Supabase Auth (Google OAuth + 이메일) |
| DB | Supabase PostgreSQL + Prisma 6 (13 엔터티) |
| Storage | Supabase Storage (사전 서명 URL) |
| Worker | Trigger.dev v3 |
| STT | VITO API (리턴제로) |
| LLM | Claude API |
| Email | Resend + React Email |
| Deploy | Vercel |

## Phase 구조

| Phase | 이름 | 기간 | WI 수 | 스펙 |
|-------|------|------|-------|------|
| 0 | 프로젝트 부트스트랩 | 2~3일 | 5 (P0: 5) | [00-bootstrap.md](./00-bootstrap.md) |
| 1 | 인증 & 워크스페이스 | Sprint 1 (1주) | 8 (P0: 6, P1: 2) | [01-auth-workspace.md](./01-auth-workspace.md) |
| 2 | 회의 업로드 & 전사 파이프라인 | Sprint 2 (1주) | 8 (P0: 6, P1: 2) | [02-upload-transcribe.md](./02-upload-transcribe.md) |
| 3 | AI 요약 & 액션아이템 검수 | Sprint 3 (1주) | 10 (P0: 9, P1: 1) | [03-summary-review.md](./03-summary-review.md) |
| 4 | 알림 & 대시보드 | Sprint 4 (1주) | 9 (P0: 5, P1: 4) | [04-notification-dashboard.md](./04-notification-dashboard.md) |
| 5 | 운영 기능 & 베타 | Beta Sprint (1주) | 6 (P0: 6) | [05-ops-beta.md](./05-ops-beta.md) |

**총 WI**: P0 34개 + P1 12개 = 46개

## 핵심 파이프라인

```
1. 클라이언트 → Supabase Storage (사전 서명 URL)
2. API Route → Meeting 레코드 생성 (status: uploaded)
3. Trigger.dev Job 1: VITO API 전사 + 화자 분리
4. Trigger.dev Job 2: Claude API 요약 + 액션아이템 추출
5. status: review_needed → 사용자 검수
6. 게시 → 알림 스케줄 → status: published
```

## 상태 머신

### Meeting
```
uploaded → processing → review_needed → published → archived
                     ↘ failed (재시도 → processing)
```

### ActionItem
```
extracted → confirmed → in_progress → done
                                   ↘ overdue (시스템 자동)
           ↘ canceled (Admin 이상)
```

## 완료 기준
- 전체 P0 WI 34개 완료
- CI 5-Gate 통과
- 통합 테스트 시나리오 TS-01 ~ TS-08 통과
- Vercel Production 배포 완료

## 현재 진행 상태
- [x] Phase 0: 프로젝트 부트스트랩
- [x] Phase 1: 인증 & 워크스페이스
- [x] Phase 2: 회의 업로드 & 전사 파이프라인
- [x] Phase 3: AI 요약 & 액션아이템 검수
- [x] Phase 4: 알림 & 대시보드
- [x] Phase 5: 운영 기능 & 베타
