# FlowSummary Project Memory

> 프로젝트별 결정사항, 아키텍처, 현재 상태를 기록합니다.

---

## Architecture Decisions
- 2026-03-03: 기술 스택 확정 — Next.js 15 + Supabase + Prisma + Trigger.dev + VITO + Claude API
- 2026-03-03: STT를 VITO API(리턴제로)로 확정 — 한국어 정확도 1위, 화자 분리 내장, 월 100시간 무료
- 2026-03-03: Worker를 Trigger.dev v3로 확정 — Vercel 300초 제한 우회, 별도 Redis 불필요
- 2026-03-03: DB ORM을 Prisma로 확정 — 12개 엔터티 복잡한 관계 쿼리, Supabase Client만으로 부족
- 2026-03-03: 장기 비전 — VITO API → Whisper 파인튜닝 자체 모델 (Flow Speech) 전환 계획

- 2026-03-03: SSOT 구조 채택 — CLAUDE.md 진입점 + .claude/rules/ 분리 (7개 규칙 파일)
- 2026-03-03: WI + RALF Loop 워크플로우 채택 — GitHub Issues(WI-#N) + 브랜치 + PR + CI 5-Gate + RALF
- 2026-03-03: GitHub repo — https://github.com/yonghyeon-dev/FlowSummary (public)
- 2026-03-03: Branch Protection — PR 필수, CI(Quality Gate) 통과 필수, force push 금지

- 2026-03-03: Prisma 7은 driver adapter 필수 등 변경이 커서 Prisma 6.19로 다운그레이드 결정
- 2026-03-03: create-next-app이 Next.js 16.1.6 설치 (최신 안정, App Router 동일)
- 2026-03-03: shadcn/ui 기본 컴포넌트 13개 설치 (button, card, input, dialog, table, badge 등)

- 2026-03-03: Vitest 도입 — 단위 테스트 프레임워크
- 2026-03-03: CI Gate 2 `npx next lint` → `npm run lint` (Next.js 16 호환)
- 2026-03-03: CI Gate 4 `npm test --if-present` (test 스크립트 없을 때 스킵)
- 2026-03-03: Supabase 프로젝트 ref: `rnndkgiekrxcavatcqmh` (ap-south-1)

## Current State
- **Phase**: Phase 3 완료 → Phase 4 (알림 & 대시보드) 진입 예정
- **완료**: Phase 0~3 (부트스트랩 + 인증/워크스페이스 + 업로드/전사 + AI 요약/검수)
- **Next**: Phase 4 WI 생성 → Resend 이메일, 리마인드, 대시보드 구현
- **Branch**: `main` (PR #6, #15, #24, #35 모두 머지 완료)
- **누적 테스트**: 60개 (slugify 9 + meeting-state 13 + constants 11 + action-item-state 17 + parseDueDate 10)
- **GitHub Issues**: #1~#34 생성, #1~#12 + #16~#21 + #25~#33 closed

## Active Epics
- Epic 1: FlowSummary MVP — Phase 0~3 완료, Phase 4~5 대기

---
*Last updated: 2026-03-03*
