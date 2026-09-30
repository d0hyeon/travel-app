# Apple 로그인 설정

코드는 준비되어 있고, 아래 콘솔 설정이 끝나야 동작한다. 유료 Apple Developer Program 가입이 선행 조건이다.

## Apple Developer

1. Identifiers → App ID `me.waylog.app` 에 **Sign in with Apple** capability 활성화
2. Identifiers → Services ID 생성 (예: `me.waylog.web`). 웹 로그인의 `client_id` 가 된다.
   - Domains: Supabase 프로젝트 도메인 (`<ref>.supabase.co`)
   - Return URLs: `https://<ref>.supabase.co/auth/v1/callback`
3. Keys → Sign in with Apple 키 생성, `.p8` 다운로드 (Key ID, Team ID 기록)

## Supabase

Authentication → Providers → Apple 활성화

- Client IDs: `me.waylog.app,me.waylog.web` (앱 번들 ID와 Services ID, 쉼표로 구분)
- Secret Key: `.p8` 와 Team ID, Key ID, Services ID 로 만든 client secret JWT
  - **6개월마다 만료된다.** 갱신 일정을 캘린더에 등록한다.
- 앱은 `signInWithIdToken` 을 쓰므로 Secret 없이도 동작하지만, 웹은 필요하다.

## 앱 빌드

`app.config.ts` 의 `usesAppleSignIn` 과 `expo-apple-authentication` 플러그인이 entitlement 를 넣는다.
`ios/` 는 prebuild 산출물이므로 `npx expo prebuild --clean` 후 다시 빌드해야 반영된다.
Personal Team 서명으로는 Sign in with Apple capability 를 쓸 수 없다.

## 알아둘 동작

- Apple 은 이름을 **최초 로그인 응답에서만** 준다. 앱은 받은 이름을 `updateUser` 로 세션 메타데이터에 남겨 가입 시 프로필 이름으로 쓴다. 첫 로그인에서 이름 제공을 거부하면 이름은 빈 문자열로 저장된다.
- 웹 Apple OAuth 가 이름을 `user_metadata` 에 넣는지는 실제 로그인으로 확인해야 한다. 안 들어오면 웹 Apple 가입자의 이름은 빈 문자열이다.
- 가입 취소(약관 거절) 후 같은 Apple 계정으로 다시 로그인하면 Apple 이 이름을 다시 주지 않는다.
- 이메일 가리기를 선택한 사용자는 릴레이 주소를 받는다.

## 가입 취소 시 Apple 토큰 철회

앱에서 Apple 로 로그인한 뒤 약관을 거절하면 `cancel-sign-up` 이 계정을 지우기 전에 Apple 인가를 철회한다(Guideline 5.1.1(v)).
앱이 받은 `authorizationCode` 를 세션 메타데이터(`apple_authorization_code`)에 남기고, 함수가 이를 토큰으로 교환해 철회한다.

Edge Function 시크릿:

```
supabase secrets set APPLE_TEAM_ID=<Team ID> APPLE_KEY_ID=<Key ID> APPLE_CLIENT_ID=me.waylog.app APPLE_PRIVATE_KEY="$(cat AuthKey_<Key ID>.p8)"
```

한계:
- `authorizationCode` 는 Apple 이 5분만 유효하게 준다. 로그인 후 5분이 지나 거절하면 철회는 실패하고 계정 삭제만 진행된다(철회 실패는 삭제를 막지 않는다).
- 시크릿이 없으면 철회를 건너뛰고 삭제만 한다.
- 웹 Apple 로그인은 인가 코드를 앱이 받지 못해 철회하지 않는다.
- 이 경로는 실제 Apple 계정과 시크릿 없이는 검증하지 못했다. 배포 전에 실기기에서 로그인 → 거절 → Apple ID 설정의 "Apple로 로그인 사용 앱" 목록에서 사라지는지 확인한다.

## 회원 탈퇴 시 Apple 인가 철회

설정의 '회원 탈퇴'는 삭제 전에 앱이 Apple 로 재인증해 새 `authorizationCode` 를 받고, `delete-account` 함수가 이를 토큰으로 교환해 철회한다.
가입 취소 때 쓰는 5분 제한 문제가 없다. 시크릿(`APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_CLIENT_ID`, `APPLE_PRIVATE_KEY`)은 `cancel-sign-up` 과 함께 쓴다.
재인증 화면에서 사용자가 취소하면 탈퇴는 진행되지 않는다. 웹 Apple 로그인 사용자는 철회하지 않는다.
