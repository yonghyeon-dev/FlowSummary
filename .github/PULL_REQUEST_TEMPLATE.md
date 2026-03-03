## Summary
<!-- 변경 사항 1-3줄 요약 -->


## Related WI
<!-- closes #N 형식으로 연결 -->
closes #

---

## RALF Checklist

### R: Review
- [ ] CI 전체 Gate 통과
- [ ] 코드 셀프 리뷰 완료
- [ ] 변경 범위가 WI 범위와 일치

### A: Approve
- [ ] 상태 머신 전이 규칙 준수 (Meeting / ActionItem)
- [ ] API Route 인증 + workspace_id 검사 확인
- [ ] AI 처리가 Trigger.dev 작업 내에서 실행
- [ ] internal/ 직접 import 없음
- [ ] 하드코딩된 값 없음
- [ ] 보안 금지 패턴 위반 없음

### L: Land
- [ ] Squash merge 사용
- [ ] 커밋 메시지 형식: `{type}(WI-{N}): 한글 설명`

### F: Follow-up
- [ ] 후속 WI 필요 여부 확인
- [ ] 스펙 문서 갱신 필요 여부 확인 (doc-agent)
- [ ] Vercel Preview 배포 확인
