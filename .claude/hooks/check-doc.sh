#!/bin/bash
# 문서 업데이트 필요 여부 체크

MARKER=".claude/.doc-ran"

if [ -f "$MARKER" ]; then
  echo '{"ok":true}'
  exit 0
fi

count=$(git diff --name-only HEAD 2>/dev/null | grep -cE '\.(ts|tsx|prisma)$')
count=${count:-0}

if [ "$count" -ge 3 ]; then
  echo "{\"ok\":false,\"reason\":\"소스 파일 ${count}개 변경됨. doc-agent로 스펙 문서 업데이트를 권장합니다.\"}"
else
  echo '{"ok":true}'
fi
