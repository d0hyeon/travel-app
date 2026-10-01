# 출시 전 체크리스트

약관 동의·Apple 로그인·신고·차단·회원 탈퇴 작업 이후 사람이 직접 해야 하는 일을 모은 문서다. 코드와 DB 마이그레이션, Edge Function 배포는 끝났다.
배포 순서·실기기 확인 같은 개발 절차는 여기 두지 않는다.

1~2장은 약관·Apple 로그인·신고 작업의 잔여 작업, 3~5장은 출시 시점에 운영 환경으로 옮길 외부 서비스·정부 API·Apple 가입 후 작업, 6장은 CI/CD 워크플로를 쓰기 위한 설정, 7장은 결정 사항이다.

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

### 강제 업데이트 정책

- [ ] 마이그레이션 `20261001100000_app_version_policies.sql`을 운영 DB에 적용하고 `pnpm gen-types`로 타입을 다시 만든다. 테이블이 없으면 앱은 정책을 읽지 못하고 강제 업데이트가 조용히 꺼진다.
- [ ] 앱 레코드를 만든 뒤 Supabase 대시보드의 `app_version_policies`에서 iOS `store_url`의 `APP_STORE_ID` 플레이스홀더를 실제 App Store ID로 바꾼다. 최소 버전이 `1.0.0`인 동안은 아무도 막히지 않지만, 바꾸지 않은 채 최소 버전을 올리면 업데이트 버튼이 잘못된 주소로 간다.
- [ ] 첫 출시 빌드에 이 기능이 들어 있어야 한다. 이미 배포된 앱에는 이 로직이 없어서 나중에 넣어도 옛 버전을 막을 수 없다.

### 처리방침 최종 확인

- [ ] 시행일(`packages/domains`의 `TERMS_VERSION`, 현재 `2026-10-01`)이 실제 출시일과 맞는지 확인한다. 바꾸면 약관 페이지에 표시되는 날짜도 함께 바뀐다.

## 3. 외부 서비스 운영 전환

서비스마다 키가 개발·운영으로 갈리는 곳이 많다. 키 이름은 `apps/waylog-web/.env`, `apps/waylog-app/.env`, Supabase Edge Function 시크릿(`supabase secrets list`)에 있다.

| 서비스 | 쓰는 곳 | 키 | 출시 전 할 일 |
| --- | --- | --- | --- |
| Supabase | DB·인증·Storage·Edge Function·cron | `SUPABASE_URL`, `ANON_KEY`, `SERVICE_ROLE_KEY` | 운영 프로젝트 확인(웹은 `VITE_SUPABASE_DEV_*`가 따로 있다). 마이그레이션·Edge Function 15개가 운영에 배포됐는지 확인. cron 두 개(항공편 감시, 공항 도착 안내)가 쓰는 Vault 시크릿 `project_url`이 운영 주소인지 확인. 무료 플랜이면 비활성 시 일시정지되므로 Pro 전환과 백업(PITR) 여부를 정한다. Auth Redirect URLs에 `waylog://auth/callback`과 운영 웹 주소를 등록. |
| Cloudflare R2 | 사진·티켓 파일 저장 | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_BASE_URL` | 운영 버킷과 공개 도메인 확인. 개발 버킷과 분리돼 있는지 확인. Supabase 시크릿과 Vercel 환경변수 양쪽 값이 같은지 확인. |
| Vercel | 웹 호스팅 | `vercel.ts` | `waylog.me`와 `www` 두 도메인 연결. 환경변수를 Production에 등록. AASA(`/.well-known/apple-app-site-association`)가 JSON으로 응답하는지 확인. |
| Google Cloud | 지도(웹 JS·iOS·Android), Places, Directions, Vision | 클라이언트 `VITE_GOOGLE_MAPS_API_KEY`, `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` / 서버 `GOOGLE_PLACES_API_KEY`, `GOOGLE_DIRECTIONS_API_KEY`, `GOOGLE_VISION_API_KEY` | 결제 계정 연결. 클라이언트 키는 웹 HTTP 리퍼러와 iOS·Android 앱 식별자로 제한하고, 서버 키는 사용할 API로만 제한한다. 사용량 예산 알림 설정. |
| Kakao Developers | 웹 지도 SDK, 장소 검색, 길찾기, 카카오 로그인 | `VITE_KAKAO_MAP_KEY`, `KAKAO_REST_KEY` | 플랫폼에 운영 웹 도메인 등록. 카카오모빌리티 길찾기(`apis-navi.kakaomobility.com`)는 별도 권한이 필요한지 확인. 1장 카카오 항목과 함께 처리. |
| Mapbox | 앱 지도 | `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` | 출시용 토큰을 따로 발급하고 URL 제한이 필요한지 확인. 앱 지도만 Mapbox를 쓰므로 Maps SDK for Mobile MAU 과금이 적용된다. 25,000 MAU까지 무료, 이후 1,000명당 $4.00(125,000까지)·$3.20(250,000까지)·$2.40. 개발 기기도 MAU에 잡히니 개발·출시 토큰을 분리해 사용량을 따로 본다. |
| Expo(EAS) | 앱 빌드, 푸시 토큰, 번들 업데이트(EAS Update) | `EXPO_PUBLIC_EAS_PROJECT_ID` | `eas.json`의 `development`·`preview`·`production` 프로필이 각각 같은 이름의 채널에 연결돼 있다. 빌드 번호(`buildNumber`·`versionCode`)는 EAS 서버가 관리하고 `production` 빌드마다 자동으로 올라간다(`appVersionSource: remote`). 이미 스토어에 올린 빌드가 있으면 `eas build:version:set`으로 그보다 큰 번호에서 시작하게 맞춘다. `EXPO_PUBLIC_EAS_PROJECT_ID`가 비면 `app.config.ts`의 `updates.url`이 깨져 업데이트가 통째로 꺼지므로 EAS 빌드 환경(`eas env`)에도 등록한다. 푸시 인증서는 5장 참고. |
| 웹 푸시(VAPID) | 웹 채팅 알림 | `VITE_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | 운영에도 같은 키쌍을 쓸지 정한다. 바꾸면 기존 구독이 모두 무효가 된다. `VAPID_SUBJECT`는 실제 연락처로. |
| Open-Meteo | 해외 날씨 예보 | 없음 | 무료 API는 비상업 이용 조건이다. 수익화 계획이 있으면 유료 구독으로 옮기거나 다른 공급자를 검토한다. 약관 확인 필요. |

- [ ] 클라이언트 번들에 들어가는 키(`VITE_*`, `EXPO_PUBLIC_*`)는 사용자에게 노출된다. 4장의 공공데이터 키도 여기에 해당하므로 도메인·앱 제한을 걸 수 있는 키는 모두 건다.
- [ ] 개발용과 운영용 키가 섞이지 않았는지 `.env`와 Vercel·Supabase 시크릿을 나란히 대조한다.

## 4. 공공데이터포털(정부 API) 운영 전환

모든 정부 API는 공공데이터포털(`apis.data.go.kr`)을 거치고 하나의 일반 인증키(`DATA_GO_SERVICE_KEY`)를 쓴다.
키는 세 곳에 따로 들어 있다. 웹 `VITE_DATA_GO_SERVICE_KEY`, 앱 `EXPO_PUBLIC_DATA_GO_SERVICE_KEY`, Edge Function 시크릿 `DATA_GO_SERVICE_KEY`.

승인된 API는 처음에 개발계정으로 시작한다. 개발계정은 일일 호출 한도가 작아서, 출시 전에 서비스별로 운영계정을 신청해야 한다. 절차는 마이페이지 → 개발계정 상세보기 → 운영계정 신청이며, 활용사례 등록이 필요하다. 서비스에 따라 자동 승인이거나 한도가 고정일 수 있으니 서비스마다 확인한다.

| API | 서비스 경로 | 쓰는 곳 | 호출 주체 |
| --- | --- | --- | --- |
| 기상청 단기예보 | `/1360000/VilageFcstInfoService_2.0` (초단기·단기) | 국내 날씨 예보 | 웹·앱 클라이언트 |
| 한국관광공사 관광빅데이터 | `/B551011/DataLabService` (광역·기초 지자체 방문자) | 계절별 지역 방문 추이 | 웹·앱 클라이언트 |
| 국립해양조사원 | `/1192136/fcstBeachv2`, `/1192136/fcstSkinScubav2` | 해수욕·스킨스쿠버 지수 | 웹·앱 클라이언트 |
| 인천공항 운항현황 | `/B551177/StatusOfPassengerFlightsDSOdp` | 항공편 지연·결항 알림 | Edge Function `flight-status-watch` |
| 인천공항 입국·혼잡 | `/B551177/passgrAnncmt`, `statusOfDepartureCongestion`, `statusOfDepartureCongestionT2` | 공항 도착 안내 | Edge Function `airport-arrival-guidance` |
| 공항 혼잡도 | `/B551178/airport-congestion` | 공항 도착 안내 | Edge Function `airport-arrival-guidance` |

- [ ] 위 6개 서비스 모두 활용 신청이 승인됐는지 확인한다. 하나라도 빠지면 해당 기능만 조용히 실패한다.
- [ ] 서비스별로 운영계정을 신청한다. 신청 시 예상 트래픽을 적어야 하므로 클라이언트 호출 3종(날씨·관광·해양)을 먼저 산정한다.
- [ ] 클라이언트에서 직접 호출하는 3종은 사용자 수만큼 호출이 늘고 키도 번들에 노출된다. 운영계정 한도가 부족하거나 키 노출이 부담스러우면 Edge Function 프록시로 옮길지 정한다.
- [ ] 키 유효기간을 확인한다. 만료되면 세 곳 모두 갱신해야 한다.
- [ ] 이용약관의 출처 표기 의무(공공누리 유형 등)를 서비스별로 확인하고, 필요하면 앱 안에 출처를 표시한다.

## 5. Apple Developer Program 가입 후 할 일

Personal Team으로는 Sign in with Apple, Push Notifications, Associated Domains를 쓸 수 없어서 코드에 임시 우회가 들어 있다. 가입 후 이 우회를 걷어낸다.

### 5-1. 가입 직후

- [ ] Team ID를 확인한다. Personal Team의 ID와 다를 수 있다. 다르면 이 프로젝트에서 서명·AASA에 쓰던 값을 모두 새 Team ID로 바꾼다.
- [ ] App ID `me.waylog.app`에 capability 3개를 켠다: Sign in with Apple, Push Notifications, Associated Domains.
- [ ] Sign in with Apple 설정(Services ID, Key, Supabase Provider, Edge Function 시크릿)은 1장 Apple 항목을 그대로 따른다.

### 5-2. 코드에서 바꿀 것

- [ ] `apps/waylog-web/public/.well-known/apple-app-site-association`의 `APPLE_TEAM_ID` 플레이스홀더를 실제 Team ID로 바꾸고 배포한다. `waylog.me`와 `www.waylog.me` 양쪽에서 JSON으로 응답해야 한다.
- [ ] `apps/waylog-app/app.config.ts`의 `associatedDomains` 주석을 해제한다.
- [ ] `apps/waylog-app/plugins/withPersonalTeamSigning.js`를 삭제하고 `app.config.ts` plugins에서 뺀다. 이 플러그인이 `aps-environment`를 지우고 있어서 남겨 두면 푸시가 켜지지 않는다.
- [ ] `npx expo prebuild --clean` 후 빌드한다. `ios/`는 prebuild 산출물이라 설정을 바꾸면 다시 만들어야 한다.

### 5-3. 푸시 알림

- [ ] APNs 인증 키(.p8)를 발급해 EAS에 등록한다(`eas credentials`). Expo 푸시가 이 키로 iOS에 전달한다.
- [ ] 실기기에서 채팅 알림이 오는지 확인한다. Edge Function `chat-web-push`가 Expo 푸시로 보낸다.
- [ ] Android는 FCM 자격 증명이 필요하다. Firebase 프로젝트와 `google-services.json`이 아직 없다. Firebase 프로젝트를 만들고 FCM V1 서비스 계정 키를 EAS에 등록한다.

### 5-4. 빌드와 심사

- [ ] `eas build --platform ios --profile production`으로 릴리스 빌드를 만들고 TestFlight에 올려 실기기 확인.
- [ ] 번들 업데이트를 실기기에서 확인한다. `production` 빌드를 설치한 뒤 `eas update --channel production`으로 게시하고, 앱을 완전히 종료했다 다시 켠 다음 한 번 더 켰을 때 새 번들이 적용되는지 본다(비필수는 받아만 두고 다음 실행에 적용된다). 필수 업데이트는 `BUNDLE_IS_MANDATORY=true`로 게시해 받은 직후 재시작되는지 본다. 개발 빌드는 `Updates.isEnabled`가 꺼져 있어 확인되지 않는다.
- [ ] Sign in with Apple 로그인과 가입 취소 시 Apple 철회를 실기기에서 확인(`apple-login-setup.md` 마지막 절차).
- [ ] 초대 링크(`https://waylog.me/trip/invite/...`)를 메모 앱 등에서 눌러 앱이 열리는지 확인.
- [ ] App Store Connect에 앱 레코드를 만들고 스크린샷, 카테고리, 연령 등급, 수출 규정 준수 답변을 입력한다.
- [ ] 심사용 계정을 준비한다. 로그인이 카카오·Apple뿐이라 심사자가 로그인할 방법이 없다. 심사 노트에 데모 계정 또는 로그인 방법을 적는다.
- [ ] 개인정보 라벨, Support URL, 심사 노트는 2장 App Store Connect 항목을 따른다.

## 6. CI/CD 설정

`.github/workflows/app-cd.yml`을 실제로 돌리기 위해 사람이 해야 하는 일이다. 워크플로 구성은 `docs/codebase.md`의 CI/CD 절에 있다.

### GitHub

- [ ] Expo 액세스 토큰을 발급해 저장소 시크릿 `EXPO_TOKEN`으로 등록한다(expo.dev → Account settings → Access tokens).
- [ ] PR을 열어 `Detect Changes` 잡이 의도대로 걸러내는지 확인한다. 웹 파일만 바꾼 PR은 e2e가 돌고, 앱 파일만 바꾼 PR은 e2e가 건너뛰어져야 한다.
- [ ] 브랜치 보호의 필수 체크에 `TypeScript Check`, `ESLint Check`, `Unit Tests`를 등록한다. e2e는 건너뛰어질 수 있으니 필수에 넣어도 건너뛴 경우 통과로 처리되는지 확인한다.

### Expo(EAS) 환경변수

`eas.json`의 프로필이 `environment`(development·preview·production)로 값을 읽는다. 세 환경 모두에 등록한다(`eas env:create` 또는 expo.dev). 비어 있으면 업데이트와 빌드에 빈 값이 구워진다.

- [ ] `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`. production은 운영 프로젝트 값.
- [ ] `EXPO_PUBLIC_EAS_PROJECT_ID`. 없으면 `updates.url`이 깨져 업데이트가 통째로 꺼진다.
- [ ] `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`, `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`, `EXPO_PUBLIC_DATA_GO_SERVICE_KEY`, `EXPO_PUBLIC_WEB_BASE_URL`. 개발·출시 키는 3장 기준으로 분리한다.
- [ ] `eas env:list production`으로 위 7개가 모두 있는지 대조한다.

### 첫 배포 확인

- [ ] 먼저 `preview` 프로필로 빌드한 앱을 기기에 설치하고, PR을 열어 `pr-<번호>` 브랜치 업데이트가 올라가는지 본다. preview 빌드가 받는 채널(`preview`)은 PR 브랜치와 자동으로 이어지지 않는다. `eas channel:edit preview --branch pr-<번호>`로 연결해야 해당 PR 번들이 적용된다.
- [ ] main에 병합한 뒤 `production` 브랜치에 업데이트가 게시됐는지 expo.dev에서 확인한다. `production` 채널이 `production` 브랜치를 가리키는지도 함께 본다(`eas channel:view production`).
- [ ] 첫 `app-v*` 태그(예: `app-v1.0.0`)를 푸시해 iOS 빌드가 시작되는지 본다. 빌드는 `--no-wait`라 GitHub에서는 성공으로 끝나고, 실제 결과는 expo.dev에서 확인해야 한다.
- [ ] 태그를 만들기 전 `app.config.ts`의 `version`을 올렸는지 확인한다. 7장의 `runtimeVersion` 정책 때문에 네이티브 변경이 있었다면 버전이 같으면 안 된다.

### 아직 자동화하지 않은 것

- [ ] 스토어 제출(`eas submit`)은 워크플로에 없다. 자동화하려면 `eas.json`에 `submit.production`(iOS `ascAppId`, Android 서비스 계정 키)이 필요하다. 첫 출시는 수동 제출로 하고 이후 자동화할지 정한다.
- [ ] 필수 업데이트가 필요하면 Actions에서 `App CD`를 수동 실행하고 `is_mandatory`를 켠다. 일반 main 푸시는 항상 비필수로 게시된다.

## 7. 결정할 것과 후속 작업

- **`runtimeVersion` 정책**: 지금은 `appVersion`이라 `version`을 올릴 때만 런타임이 바뀐다. 네이티브 모듈을 추가·변경하고 버전을 안 올리면 호환되지 않는 JS가 설치된 앱에 내려가 크래시할 수 있다. 네이티브 변경 때마다 버전을 올리는 규칙으로 갈지, 자동으로 계산하는 `fingerprint` 정책으로 바꿀지 출시 전에 정한다.

- **법률 검토**: 코드베이스에 임의로 넣은 조항(약관 변경 공지 기간, 서비스 종료 공지, 외부 정보 면책, 관할 법원)과 기존 유저 일괄 동의 백필의 유효성을 검토할지 정한다.
- **카카오 연결 끊기**: 탈퇴 시 카카오 서비스 연결(unlink)은 호출하지 않는다. 필요하면 카카오 Admin Key로 호출을 추가한다.
- **문의 이메일**: 지금은 `waylog.customer@gmail.com`이다. `support@waylog.me` 같은 도메인 메일로 바꾸려면 메일 포워딩을 설정하고 `apps/waylog-web/src/features/legal/legal.config.ts`의 `contactEmail`을 고친다.
- **`/support` 페이지**: 보류 중이다. Apple Support URL 요건 때문에 출시 전에 필요할 수 있다.
- **R2 삭제 실패 재시도**: 탈퇴 시 저장 파일 삭제가 실패하면 파일이 남고 다시 시도하지 않는다. 필요하면 정리 작업을 추가한다.
