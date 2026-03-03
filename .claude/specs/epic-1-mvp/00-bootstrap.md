# Phase 0: 프로젝트 부트스트랩

> 기간: 2~3일 | WI: 5개 (전부 P0)

## WI 목록

### WI-#1: Next.js 15 프로젝트 초기화 (P0)
- `create-next-app` (App Router, TypeScript, Tailwind CSS)
- shadcn/ui 설치 및 기본 컴포넌트 추가
- ESLint 설정 (Next.js 기본 + import order)
- 디렉토리 구조 수립:
  ```
  src/
  ├── app/           # Next.js App Router
  ├── lib/           # 공통 유틸
  ├── modules/       # 비즈니스 로직 (캡슐화)
  ├── components/    # 공유 UI 컴포넌트
  ├── trigger/       # Trigger.dev Jobs
  └── prisma/        # Prisma 스키마
  ```
- **완료 기준**: `npm run dev` 정상 실행, shadcn/ui 컴포넌트 렌더링 확인

### WI-#2: Supabase 프로젝트 연결 (P0)
- 환경변수 설정 (`.env.local`)
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (서버 전용)
  - `DATABASE_URL` (Prisma용 direct connection)
  - `DIRECT_URL` (Prisma용 direct connection, pooler 아님)
- `lib/supabase/` 클라이언트 유틸 생성:
  - `client.ts` — 브라우저용 클라이언트
  - `server.ts` — 서버 컴포넌트/Route Handler용 클라이언트
  - `middleware.ts` — 미들웨어용 클라이언트
- **완료 기준**: 서버/클라이언트에서 Supabase 연결 확인

### WI-#3: Prisma 스키마 정의 — 12 엔터티 (P0)
- 엔터티:
  1. User
  2. Workspace
  3. Membership (User ↔ Workspace M:N)
  4. Meeting
  5. MeetingAsset
  6. TranscriptSegment
  7. MeetingSummary
  8. ActionItem
  9. ActionItemHistory
  10. NotificationLog
  11. UsageLedger
  12. Integration
  13. AuditLog (추가)
- 인덱스 5개:
  1. Meeting: `[workspace_id, meeting_date]`
  2. ActionItem: `[workspace_id, status]`
  3. ActionItem: `[assignee_user_id, status]`
  4. TranscriptSegment: `[meeting_id, start_time]`
  5. NotificationLog: `[scheduled_at, sent]`
- enum: MeetingStatus, ActionItemStatus, MembershipRole, NotificationType
- **완료 기준**: `npx prisma validate` 통과, `npx prisma generate` 성공

### WI-#4: Trigger.dev v3 설정 (P0)
- `@trigger.dev/sdk` v3 설치
- `trigger.config.ts` 설정
- 첫 번째 Job 스캐폴드 (`trigger/transcribe.ts`)
- **완료 기준**: `npx trigger.dev@latest dev` 정상 연결

### WI-#5: 공통 레이아웃 & 미들웨어 (P0)
- Root Layout (`app/layout.tsx`): 폰트, 메타데이터, ThemeProvider
- 인증 미들웨어 (`middleware.ts`): Supabase Auth 세션 갱신
- 라우트 그룹:
  - `(auth)/` — 로그인/가입 (비인증)
  - `(dashboard)/` — 메인 기능 (인증 필요)
- 공통 컴포넌트 스캐폴드:
  - `components/shared/header.tsx`
  - `components/shared/sidebar.tsx`
- **완료 기준**: 인증 미들웨어 동작 확인, 레이아웃 렌더링

## Phase 완료 기준
- [x] `npm run dev` 정상 실행
- [x] Prisma 스키마 validate 통과
- [x] Supabase 클라이언트 유틸 생성
- [x] Trigger.dev 설정 파일 생성
- [x] 인증 미들웨어 + 라우트 그룹 구성
- [x] CI 5-Gate 통과
