# Architecture Rules

## Core Flow

```
경계 분리(개념) → 모듈화(구조) → 캡슐화(접근제어)
```

### 1. 경계 분리 (Boundary)
- 변경 전 "이 코드의 경계는 무엇인가?" 먼저 정의
- 새 코드는 반드시 특정 경계에 소속

### 2. 모듈화 (Module)
- 경계 = 모듈 폴더
- 구조: `module/index.ts` + `module/internal/`

### 3. 캡슐화 (Encapsulation)
- `index.ts`만 외부 노출 (Public API)
- `internal/*` 외부 import 금지

## 디렉토리 구조

```
moduleA/
  index.ts        # Public API
  internal/       # Private
```

## 규칙
- 모듈 간 의존은 반드시 `index.ts`를 통해서만
- `internal/` 내부 파일을 외부에서 직접 import 금지
- 공통 컴포넌트는 `shared/` 또는 `common/` 모듈에 배치
