# Phase 1: 인증 & 워크스페이스

> 기간: Sprint 1 (1주) | WI: 8개 (P0: 6, P1: 2)

## WI 목록

### WI-#6: 이메일 회원가입 & 로그인 (P0) — FR-AUTH-001
- 회원가입: 이메일 + 비밀번호 + 이름
- 로그인: 이메일 + 비밀번호
- 이메일 인증 (Supabase 기본 제공)
- Auth callback 라우트 (`/auth/callback`)
- 로그인 후 워크스페이스 선택/생성 페이지로 리다이렉트
- 로그아웃
- **완료 기준**: 가입 → 이메일 확인 → 로그인 → 대시보드 진입 플로우 동작

### WI-#7: Google 소셜 로그인 (P0) — FR-AUTH-002
- Supabase Google OAuth 설정
- 소셜 로그인 버튼 추가
- 최초 소셜 로그인 시 User 레코드 자동 생성
- **완료 기준**: Google 로그인 → 대시보드 진입 동작

### WI-#8: 워크스페이스 생성 (P0) — FR-WS-001
- 워크스페이스 생성 폼 (이름)
- slug 자동 생성 (이름 기반 slugify)
- 생성자를 OWNER로 Membership 자동 추가
- 워크스페이스 선택 페이지 (사용자가 속한 워크스페이스 목록)
- API: `POST /api/v1/workspaces`
- **완료 기준**: 워크스페이스 생성 → 대시보드 진입

### WI-#9: 멤버 초대 (P0) — FR-AUTH-003, FR-WS-002
- 초대 링크 생성 (토큰 기반)
- 이메일로 초대 링크 발송 (Resend)
- `/invite/[token]` 페이지: 초대 수락 → 가입/로그인 → 워크스페이스 참가
- API: `POST /api/v1/workspaces/[id]/invitations`
- **완료 기준**: 초대 이메일 → 링크 클릭 → 워크스페이스 참가

### WI-#10: 멤버 권한 관리 (P0) — FR-WS-003
- Settings 페이지: 멤버 목록 + 역할 표시
- 역할 변경 (Owner/Admin만 가능)
- 멤버 제거 (Owner/Admin만 가능)
- API: `PATCH /api/v1/workspaces/[id]/members/[userId]`
- **완료 기준**: 멤버 목록 조회, 역할 변경, 멤버 제거 동작

### WI-#11: 멤버 별칭 관리 (P0) — FR-WS-004
- 멤버별 별칭(aliases) 설정 UI
- 화자 매칭에 활용될 별칭 저장
- API: `PATCH /api/v1/workspaces/[id]/members/[userId]/aliases`
- **완료 기준**: 별칭 추가/삭제 동작

### WI-#12: 온보딩 (P1) — FR-AUTH-004
- 최초 로그인 시 시간대/알림 설정

### WI-#13: 비활성 멤버 보관 처리 (P1) — FR-WS-005
- 멤버 비활성화 (is_active=false)
- 기존 작업 유지, UI에 '비활성 멤버' 표시

## Phase 완료 기준
- [ ] 이메일 가입/로그인 동작
- [ ] Google 소셜 로그인 동작
- [ ] 워크스페이스 생성 + 멤버 자동 추가
- [ ] 초대 링크로 멤버 참가
- [ ] 멤버 역할 변경/제거
- [ ] 멤버 별칭 관리
- [ ] CI 5-Gate 통과

## 산출물
- 로그인/가입 화면
- 워크스페이스 생성 화면
- 설정(멤버) 화면
