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
