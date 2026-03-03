# State Machines

## Meeting 상태

```
uploaded → processing → review_needed → published → archived
                     ↘ failed (재시도 → processing)
```

| 상태 | 설명 | 다음 상태 |
|------|------|-----------|
| uploaded | 파일 업로드 완료, 메타데이터 저장 | processing |
| processing | 전사 또는 AI 처리 진행 중 | review_needed / failed |
| review_needed | 결과 생성 완료, 사용자 검수 필요 | published |
| published | 회의 요약 및 액션 아이템 공개 | archived |
| failed | 처리 실패 | processing (재시도) |
| archived | 보관 상태 | 없음 |

### 규칙
- 상태 전이는 정해진 순서만 허용, 건너뛰기 금지
- `failed` → `processing`은 재시도만 허용 (운영자 또는 시스템)

## ActionItem 상태

```
extracted → confirmed → in_progress → done
                                   ↘ overdue (시스템 자동, 마감일 초과)
           ↘ canceled (Admin 이상)
```

| 상태 | 설명 | 변경 주체 |
|------|------|-----------|
| extracted | AI가 추출, 아직 확정 전 | 시스템 |
| confirmed | 담당자 및 마감일 확정 | 사용자 |
| in_progress | 진행 중 | 담당자 / Admin |
| done | 완료 | 담당자 / Admin |
| overdue | 마감일 초과, 미완료 | 시스템 자동 |
| canceled | 유효하지 않음 | Admin 이상 |

### 규칙
- `done` 전환은 담당자 본인 또는 Admin 이상만 가능
- `overdue`는 시스템이 자동 전환, 수동 변경 불가
- confidence 0.75 미만 → '확인 필요' 배지, 강제 확정 안 함
