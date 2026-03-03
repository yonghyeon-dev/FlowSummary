# Security Rules

## API 권한 검사 (모든 Route 필수)
1. **인증 확인**: Supabase Auth 세션 검증
2. **workspace_id 소속 확인**: 요청자가 해당 워크스페이스 멤버인지 검증
3. **역할 확인**: Owner/Admin/Member 권한 수준에 맞는 동작만 허용

## 권한 모델 (3단계)
| 권한 | 가능 기능 |
|------|----------|
| Owner | 멤버 초대/삭제, 역할 변경, 플랜 변경, 워크스페이스 삭제 |
| Admin | 회의 업로드, 결과 검수, 담당자 변경, 리마인드 설정 |
| Member | 회의 열람, 본인 할 일 확인/상태 변경, 개인 알림 설정 |

## 금지 패턴
- `supabaseAdmin` (service_role) 클라이언트 컴포넌트에서 사용 금지
- `NEXT_PUBLIC_`에 secret 키 노출 금지
- `dangerouslySetInnerHTML` sanitize 없이 사용 금지
- AI `raw_model_output` 일반 사용자 API에서 반환 금지 (운영자 전용)
- Prisma `$queryRaw`에 사용자 입력 직접 삽입 금지

## 파일 업로드 보안
- 사전 서명 URL로만 업로드 (서버 경유 금지)
- 지원 확장자: mp3, m4a, wav, mp4, mov
- 파일 크기 제한: 500MB 이하
- 중복 업로드 감지: 파일 해시 + 동일 회의일 조합

## 데이터 보호
- 업로드 파일/전사 데이터: 삭제 요청 시 30일 이내 완전 삭제
- 전송 구간 TLS, 저장 구간 암호화 적용
- 삭제된 멤버의 기존 작업: owner_user_id 유지, UI에 '비활성 멤버' 표시
