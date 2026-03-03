# FlowSummary Project Memory

> 프로젝트별 결정사항, 아키텍처, 현재 상태를 기록합니다.

---

## Architecture Decisions
- 2026-03-03: 기술 스택 확정 — Next.js 15 + Supabase + Prisma + Trigger.dev + VITO + Claude API
- 2026-03-03: STT를 VITO API(리턴제로)로 확정 — 한국어 정확도 1위, 화자 분리 내장, 월 100시간 무료
- 2026-03-03: Worker를 Trigger.dev v3로 확정 — Vercel 300초 제한 우회, 별도 Redis 불필요
- 2026-03-03: DB ORM을 Prisma로 확정 — 12개 엔터티 복잡한 관계 쿼리, Supabase Client만으로 부족
- 2026-03-03: 장기 비전 — VITO API → Whisper 파인튜닝 자체 모델 (Flow Speech) 전환 계획

## Current State
- **Phase**: 프로젝트 초기 설정 (규칙/에이전트/SSOT 구조 완료)
- **Next**: 프로젝트 초기화 (Next.js init, Prisma 스키마, 디렉토리 구조)

## Active Epics
(아직 없음 — MVP 개발 시작 시 생성)

---
*Last updated: 2026-03-03*
