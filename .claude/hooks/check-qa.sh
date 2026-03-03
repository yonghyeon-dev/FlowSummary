#!/bin/bash
# QA 검증 필요 여부 체크

MARKER=".claude/.qa-ran"

if [ -f "$MARKER" ]; then
  echo '{"ok":true}'
  exit 0
fi

count=$(git diff --name-only HEAD 2>/dev/null | grep -cE '\.(ts|tsx|prisma)$')
count=${count:-0}

if [ "$count" -gt 0 ]; then
  echo "{\"ok\":false,\"reason\":\"미커밋 소스 파일 ${count}개 변경됨. CI 검증(tsc/lint/build) 또는 qa-agent 실행을 권장합니다.\"}"
else
  echo '{"ok":true}'
fi
