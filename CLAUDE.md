# FlowSummary — 회의 실행 추적 서비스

> 회의 파일을 업로드하면 AI가 요약하고 액션 아이템을 추출하여
> "누가, 무엇을, 언제까지"를 자동 추적하는 팀용 서비스

## 전역 규칙 참조
`~/.claude/CLAUDE.md` 규칙 준수 (Git 커밋 컨벤션, Memory System, DocOps)

## 프로젝트 규칙 (SSOT)
각 규칙은 `.claude/rules/`에서 관리. Claude Code가 자동 로드.

| 파일 | 내용 |
|------|------|
| `tech-stack.md` | 기술 스택 정의 + 장기 비전 |
| `architecture.md` | 경계 분리 → 모듈화 → 캡슐화, 디렉토리 구조 |
| `state-machines.md` | Meeting / ActionItem 상태 전이 규칙 |
| `pipeline.md` | 비동기 파이프라인 절대 규칙 + 흐름 |
| `security.md` | 인증, 권한 검사, 금지 패턴 |
| `code-quality.md` | 컴포넌트 재사용, 하드코딩 금지, UTF-8 |
| `workflow.md` | WI 관리, 브랜치 컨벤션, RALF Loop, CI 게이트 |

## 배포 규칙 (절대)
- **`vercel --prod` CLI 직접 배포 금지** — Git push → Vercel 자동 배포만 허용
- **긴급 수정이라도 프로세스 예외 없음**: 브랜치 → CI → PR → 머지 → 자동 배포
- 위반 시: 사용자에게 즉시 보고하고 롤백 방법 안내

## 작업 전 체크리스트
- [ ] **브랜치 생성**: main에서 직접 작업 금지
- [ ] 경계 분리: "이 코드의 경계는 무엇인가?" 정의
- [ ] 상태 머신: Meeting/ActionItem 전이 규칙 확인
- [ ] 보안: API Route에 인증 + workspace_id 검사
- [ ] 파이프라인: AI 처리는 Trigger.dev 작업 내에서만

## PR Checklist
- [ ] internal 직접 import 없음?
- [ ] 공개 API 최소화?
- [ ] 하드코딩된 값 없음?
- [ ] 상태 전이 규칙 준수?
- [ ] API Route 인증 + workspace_id 검사?
- [ ] AI 처리가 Trigger.dev 내에서 실행?
