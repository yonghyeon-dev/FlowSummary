# Tech Stack

## 확정 스택

| 레이어 | 기술 | 비고 |
|--------|------|------|
| Frontend | Next.js 15 (App Router) | |
| API | Next.js Route Handlers | 단일 코드베이스 |
| Auth | Supabase Auth | Google OAuth + 이메일 + 초대 링크 |
| DB | Supabase PostgreSQL + Prisma | 12개 엔터티, 타입 안전성 |
| Storage | Supabase Storage | 사전 서명 URL, 500MB 업로드 |
| Worker | Trigger.dev v3 | 장시간 작업, 재시도/모니터링 내장 |
| Email | Resend + React Email | 리마인드, 주간 요약 |
| AI STT | VITO API (리턴제로) | 한국어 1위, 화자 분리 내장, 월 100시간 무료 |
| AI LLM | Claude API | 요약, 액션아이템 추출, JSON 구조화 |
| Deploy | Vercel | |

## 장기 비전

```
Phase 1 (MVP)    → VITO API (외부)
Phase 2 (성장)   → 데이터 축적 (회의 음성 + 검수된 텍스트)
Phase 3 (자체)   → Whisper 파인튜닝 + pyannote → "Flow Speech" 엔진
Phase 4 (사업)   → Flow Speech API 외부 판매
```

## 스택 선택 근거
- **VITO**: 한국어 CER 1위 (~7%), 화자 분리 내장, MVP 기간 무료
- **Prisma**: 12개 엔터티 간 복잡한 관계 쿼리, Supabase Client만으로 부족
- **Trigger.dev**: Vercel Serverless 300초 제한 → 60분 회의 전사 불가, 별도 Redis 불필요
- **Resend**: React Email 템플릿, Vercel 생태계 호환
