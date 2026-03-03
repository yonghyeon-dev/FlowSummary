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

## Current State
- **Phase**: 프로젝트 초기 설정 완료
- **완료**: 규칙/에이전트/SSOT/CI/RALF/Branch Protection 전부 세팅
- **Next**: 로드맵 작성 → Epic/Phase/WI 생성 → MVP 개발 시작
- **스펙 문서**: `Downloads/meeting_action_tracker_functional_spec_v1.docx` (PRD)

## Active Epics
(아직 없음 — 다음 세션에서 로드맵 기반 Epic 생성 예정)

---
*Last updated: 2026-03-03*
