# Workflow Rules (WI + Branch + RALF)

## Work Item (WI) 관리

### 형식
- GitHub Issues로 관리
- 제목: `[{type}] 설명 (FR-XXX-NNN)`
- 라벨: `wi-type/{feat|fix|chore}`, `wi-priority/{P0|P1|P2}`

### WI 번호
- GitHub Issue 번호가 곧 WI 번호
- 참조 형식: `WI-#N` (예: `WI-#1`, `WI-#12`)

## 브랜치 컨벤션

### 형식
```
{type}/WI-{issue-number}-{slug}
```

### 예시
```
feat/WI-1-auth-setup
fix/WI-12-upload-status
chore/WI-3-prisma-schema
refactor/WI-8-meeting-module
```

### 규칙
- `main`에 직접 push 금지
- 모든 변경은 feature branch → PR → merge
- 브랜치 수명: 가능한 짧게 (1 WI = 1 branch = 1 PR)

## RALF Loop

### R: Review
1. PR 생성 시 CI 자동 실행 (GitHub Actions)
2. CI 5-Gate: TypeScript → Lint → Prisma → Test → Build
3. Security Audit (경고만, 차단 안 함)
4. 셀프 코드 리뷰 + PR 체크리스트 확인

### A: Approve
1. **필수 조건** (하나라도 실패 시 머지 불가):
   - CI 전체 Gate 통과
   - PR 체크리스트 완료
   - 리뷰어 승인 (1인 팀: self-approve 허용)
2. **권장 조건**:
   - 후속 WI 식별 완료
   - Vercel Preview 배포 확인

### L: Land (Merge)
1. **Squash merge** 사용 (커밋 히스토리 깔끔)
2. 커밋 메시지 형식: `{type}(WI-#N): 한글 설명`
   - 예: `feat(WI-#1): 이메일 기반 회원가입 구현`
3. 머지 후 브랜치 **자동 삭제**
4. `main` 머지 → Vercel 자동 배포

### F: Follow-up
1. WI 자동 Close (PR에 `closes #N` 포함)
2. 후속 WI 생성 (리뷰 중 발견된 개선점/기술 부채)
3. 배포 확인 (Vercel Production)
4. 스펙 문서 갱신 여부 확인 (doc-agent Stop hook이 자동 제안)

## CI 품질 게이트

| Gate | 검사 | 실패 시 |
|------|------|--------|
| 1. Type Check | `tsc --noEmit` | PR 머지 차단 |
| 2. Lint | `next lint` | PR 머지 차단 |
| 3. Prisma | `prisma validate && generate` | PR 머지 차단 |
| 4. Test | `jest` / `vitest` | PR 머지 차단 |
| 5. Build | `next build` | PR 머지 차단 |
| Security | `npm audit --audit-level=high` | 경고만 |

## 로컬 qa-agent ↔ CI 관계

```
로컬 (qa-agent)              원격 (GitHub Actions)
━━━━━━━━━━━━━━━             ━━━━━━━━━━━━━━━━━━━
Gate 1: tsc            ←→    Gate 1: tsc
Gate 2: lint           ←→    Gate 2: lint
Gate 3: security              Gate 3: prisma
Gate 4: boundaries            Gate 4: test
Gate 5: build          ←→    Gate 5: build

로컬: 보안/아키텍처 패턴 (코드 레벨 정적 분석)
CI: 빌드/타입/테스트 (통합 레벨 검증)
```
