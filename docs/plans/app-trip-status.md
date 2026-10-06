# 앱 trip 이관 현황

`apps/waylog-app` 이 웹(`apps/waylog-web`)을 얼마나 따라왔는지 기록한다.
기준은 언제나 웹이다 — 네이티브 제약으로 웹 스펙을 지키지 못하면
임의로 대체하지 말고 보고한다.

작성 시점: 2026-08-21

## 완료

| 영역 | 비고 |
| --- | --- |
| 로그인 / 여행 목록 / 여행 상세 셸 | 탭 5개 (정보·장소·계획·정산·사진) |
| trip-basic-info | |
| trip-place | 지도·클러스터·바텀시트 |
| trip-route | 드래그 정렬, 일자별 경로 |
| trip-expense | |
| trip-checklist | |
| trip-memo | 목록까지 |
| trip-photo | |
| trip-member | |
| 지도 | `react-native-maps` (Google 단일). 장소검색·도로경로만 국내외 분기 |
| 바텀시트 | 자체 구현. 스냅·스크롤·키보드 대응 |

## 1단계 잔여

없다. 2026-08-22 기준 모두 완료.

| 작업 | 상태 | 비고 |
| --- | --- | --- |
| 메모 상세 화면 | 완료 | `cc77f2f`. 목록·고정 목록에서 진입, 수정·삭제 포함 |
| 사진 EXIF 장소 자동 매칭 | 완료 | picker 의 `exif: true` 사용. 웹과 같은 500m 기준 |

## 2단계

플랜: [`docs/plans/app-trip-stage2.md`](./app-trip-stage2.md)

브랜치 3개로 나눈다. 성격은 포팅이며 기능을 누락하거나 다르게 구현하지 않는다.

| 브랜치 | 범위 | 상태 |
| --- | --- | --- |
| `feat/app-photo-exif-place` | 1단계 잔여 (EXIF) | 완료 |
| `feat/app-trip-chat` | trip-chat | 완료 (푸시 알림 제외) |
| `feat/app-trip-rest2` | trip-recommend, trip-community-routes, trip-weather, trip-marine-activity, trip-create, trip-invite, features/weather | 완료 |

## 채팅 푸시 알림 — 코드 완료, 실기기 검증 대기

코드는 전부 작성했다. **iOS 실기기 검증만 계정 문제로 막혀 있다.**

### 구성

| 위치 | 역할 |
| --- | --- |
| `supabase/functions/chat-web-push/expoPush.ts` | Expo Push Service 호출 |
| `supabase/functions/chat-web-push/index.ts` | 구독 종류로 웹·앱 발송을 가름 |
| `app/src/features/auth/pushSubscription.api.ts` | 토큰 저장·삭제 |
| `app/src/features/auth/useNativePushSubscription.ts` | 구독 상태 (웹 `useWebPushSubscription` 과 같은 시그니처) |
| `app/src/features/trip/trip-chat/notification/useChatNotification.ts` | 알림 표시 판단·탭 처리 |
| `app/src/features/trip/trip-chat/ChatPushNoticeCard.tsx` | 권한 안내 카드 |

`push_subscriptions` 테이블은 그대로 쓴다. 마이그레이션이 없다.
앱은 `endpoint` 에 Expo 토큰(`ExponentPushToken[...]`)을, `subscription` 에
`{ type: 'expo', token }` 을 넣는다. 서버가 `endpoint` 형태로 보낼 경로를 판단한다.

### 남은 작업 — 실기기 검증 전 필요

1. **EAS 프로젝트 생성** — `eas init`. `projectId` 가 없으면 토큰을 받을 수 없다.
   `useNativePushSubscription` 의 `isEnabled` 가 false 가 되어 안내 카드가
   "실기기에서만 알림을 설정할 수 있어요" 로 뜬다.
2. **Expo 에 푸시 자격증명 등록** — `eas credentials`.
   - iOS: **Apple Developer Program 유료 계정($99/년) 필요.**
     Personal Team 으로는 `aps-environment` 가 서명되지 않아 토큰 발급이 실패한다.
   - Android: FCM 무료. `google-services.json` 을 등록하면 된다.
3. **Edge Function 재배포** — `supabase functions deploy chat-web-push`

Android 는 유료 계정 없이 지금 검증할 수 있다.

## 네이티브 제약으로 웹과 다른 지점

임의로 대체하지 않고 아래에 기록한다.

| 지점 | 웹 | 앱 | 사유 |
| --- | --- | --- | --- |
| 커뮤니티 경로 썸네일 | 지역 폴리곤 배경 + 경로 도트 | 경로 도트만 | 웹은 `/visit-layer/*.geojson` 정적 파일을 상대 URL 로 받는다. 앱에는 그 파일도, 상대 URL 을 받을 방법도 없다 |
| 데스크톱 분기 | `.desktop.tsx` / Dialog | 없음 | 앱은 모바일 단일. `.mobile.tsx` 경로만 옮겼다 |

## 앱 전체에서 영구 제외

statistics, explorer, post + feed, `PlaceDetailPage` 라우트(`/place/:placeId`)

## 확인 방법

실기기 빌드·서명은 `docs/codebase.md` 가 아니라 아래를 따른다.

- 번들 ID `me.waylog.app`, 팀 `JHQ5538PH7`
- Personal Team 은 프로비저닝 프로파일이 7일마다 만료된다. 만료 시 Xcode 에서 재발급
- 코드 수정 후에는 Metro 로그에서 전체 번들 전달(`Bundled ... (N modules)`, N 이 네 자리)과
  `ERROR` 0건을 함께 확인한다. 둘 중 하나만 보면 크래시 상태를 정상으로 오인한다
