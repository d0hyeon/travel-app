# 출시 전 체크리스트

약관 동의·Apple 로그인·신고·차단·회원 탈퇴 작업 이후 사람이 직접 해야 하는 일을 모은 문서다. 코드와 DB 마이그레이션, Edge Function 배포는 끝났다.
배포 순서·실기기 확인 같은 개발 절차는 여기 두지 않는다.

## 1. 콘솔에서 직접 할 것

### Apple

- [ ] Apple Developer Program 가입(유료).
- [ ] App ID `me.waylog.app`에 Sign in with Apple 활성화.
- [ ] Services ID 생성(웹 로그인용). 도메인 `<ref>.supabase.co`, Return URL `https://<ref>.supabase.co/auth/v1/callback`.
- [ ] Key(.p8) 발급. Key ID와 Team ID를 기록해 둔다.
- [ ] Supabase → Authentication → Providers → Apple 활성화. Client IDs는 `me.waylog.app,me.waylog.web`, Secret은 .p8로 만든 Client Secret JWT.
- [ ] Edge Function 시크릿 등록. 없으면 가입 취소·탈퇴 때 Apple 철회를 건너뛰고 계정 삭제만 진행한다.

  ```
  supabase secrets set APPLE_TEAM_ID=<Team ID> APPLE_KEY_ID=<Key ID> APPLE_CLIENT_ID=me.waylog.app APPLE_PRIVATE_KEY="$(cat AuthKey_<Key ID>.p8)"
  ```

- [ ] 웹 Apple 로그인용 Secret은 6개월마다 새로 만들어 Supabase에 넣는다. 캘린더에 등록한다.
  앱 로그인과 탈퇴 철회는 이 Secret을 쓰지 않아 영향이 없다. 웹 Apple 로그인을 제공하지 않기로 하면 이 갱신과 웹 Services ID가 필요 없다(로그인 화면의 Apple 버튼만 제거).

자세한 절차와 한계는 [`apple-login-setup.md`](./apple-login-setup.md)에 있다.

### 카카오

- [ ] 개발자 콘솔에 개인정보처리방침 URL(웹 `/privacy`) 등록.
- [ ] 비즈앱 전환과 동의항목(닉네임·프로필 사진) 확인.

## 2. 스토어·운영 준비

### App Store Connect

- [ ] 개인정보 라벨: 위치(서버·제3자 전송 시 수집으로 표시), 사진, 사용자 콘텐츠, 식별자(푸시 토큰) 등 실제 수집 항목.
- [ ] Support URL: 연락처가 보이는 페이지여야 한다. 지금은 `/support`가 없어 처리방침 URL을 쓰면 지적받을 수 있다.
- [ ] 개인정보처리방침 URL(웹 `/privacy`).
- [ ] 심사 노트: 신고·차단(게시물 메뉴, 프로필 메뉴, 설정 → 차단한 사용자)과 회원 탈퇴(설정 → 회원 탈퇴) 위치 설명.

### Google Play

- [ ] Data Safety 양식.
- [ ] 개발자 연락 이메일(이용자에게 공개된다).
- [ ] 개인정보처리방침 URL.

### 신고 운영

Apple 가이드라인 1.2는 신고를 24시간 안에 처리하라고 요구한다. 자동 통지가 없어서 매일 직접 확인해야 한다.

- [ ] 매일 Supabase에서 `reports`, `user_blocks`를 조회하고 조치한다. 쿼리와 조치 방법은 [`moderation.md`](./moderation.md).
- [ ] 필요해지면 Database Webhook으로 신고·차단 INSERT를 메일이나 Slack에 연결한다.

### 처리방침 최종 확인

- [ ] 시행일(`packages/domains`의 `TERMS_VERSION`, 현재 `2026-10-01`)이 실제 출시일과 맞는지 확인한다. 바꾸면 약관 페이지에 표시되는 날짜도 함께 바뀐다.

## 3. 결정할 것과 후속 작업

- **법률 검토**: 코드베이스에 임의로 넣은 조항(약관 변경 공지 기간, 서비스 종료 공지, 외부 정보 면책, 관할 법원)과 기존 유저 일괄 동의 백필의 유효성을 검토할지 정한다.
- **카카오 연결 끊기**: 탈퇴 시 카카오 서비스 연결(unlink)은 호출하지 않는다. 필요하면 카카오 Admin Key로 호출을 추가한다.
- **문의 이메일**: 지금은 `waylog.customer@gmail.com`이다. `support@waylog.me` 같은 도메인 메일로 바꾸려면 메일 포워딩을 설정하고 `apps/waylog-web/src/features/legal/legal.config.ts`의 `contactEmail`을 고친다.
- **`/support` 페이지**: 보류 중이다. Apple Support URL 요건 때문에 출시 전에 필요할 수 있다.
- **R2 삭제 실패 재시도**: 탈퇴 시 저장 파일 삭제가 실패하면 파일이 남고 다시 시도하지 않는다. 필요하면 정리 작업을 추가한다.
