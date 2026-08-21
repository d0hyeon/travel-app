# 2단계 — trip 잔여 기능 이관 (waylog-app)

## 성격 — 이것은 포팅이다

로직·구조·UI 는 **웹에 이미 전부 있다.**
이 작업은 의존성을 바꾸는 것이다.

```text
react-dom / @mui/material / react-router  →  react-native / mui shim / expo-router
```

### 절대 규칙

1. **기능을 누락시키지 않는다.** 웹에 있는 동작은 앱에도 전부 있어야 한다.
2. **다르게 구현하지 않는다.** 웹 컴포넌트를 열어놓고 옮긴다.
   구조를 개선하거나 재설계하지 않는다.
3. **네이티브 제약으로 웹 스펙을 못 지키면 임의 대체하지 말고 보고한다.**

기준은 언제나 웹이다. 판단이 필요하면 웹 파일을 열어 확인한다.

### 포팅 대응표

| 웹                                    | 앱                                                   |
| ------------------------------------- | ---------------------------------------------------- |
| `@mui/material`                       | `~shared/components/mui` (shim)                      |
| `@mui/icons-material/X`               | `@expo/vector-icons` MaterialIcons                   |
| `react-router` `useNavigate`/`Link`   | `expo-router` `useRouter`                            |
| `useSearchParams`                     | `useLocalSearchParams` + `router.setParams`          |
| `div` / `span`                        | `Box` / `Typography`                                 |
| `onClick`                             | `onClick` (shim 이 `onPress` 로 흡수)                |
| CSS `hover` / `:focus`                | 제거 — 네이티브에 없다                               |
| `.mobile.tsx`                         | 접미사 없는 단일 파일. **모바일 판에서 출발한다**    |
| `.desktop.tsx`                        | 옮기지 않는다                                        |

`.desktop.tsx` 는 옮기지 않는다. 앱에 데스크톱 분기가 없다.
`.mobile.tsx` 가 있으면 **그것이 출발점**이다 — 레이아웃 판단이 이미 끝나 있다.

---

## 브랜치 구성

```text
feat/app-trip-stage2 (Root)
  ├─ feat/app-photo-exif-place    1단계 잔여 — EXIF 장소 자동 매칭
  ├─ feat/app-trip-chat           메세지 기능
  └─ feat/app-trip-rest2          recommend·community-routes·weather
                                  ·marine-activity·create·invite
```

**브랜치당 500 LOC 목표는 이번 작업에서 예외다.**
포팅은 목적이 하나라 쪼갤 경계가 없다.

---

## 사전 확인 — status 문서 정정

`docs/plans/app-trip-status.md` 의 "1단계 잔여" 2건 중
**메모 상세 화면은 이미 완료되어 있다.**

- `app/trip/[tripId]/memo/[memoId].tsx` — 상세(고정·수정·삭제 메뉴 포함)
- `app/trip/[tripId]/memo/[memoId]/edit.tsx` — 수정
- 진입: `TripMemo.tsx:95`, `TripPinnedMemos.tsx:46`

커밋 `cc77f2f` 에서 들어갔고 status 문서가 갱신되지 않았다.
실제 1단계 잔여는 **EXIF 1건**이다. 브랜치 1 완료 시 status 문서를 정정한다.

---

# 브랜치 1 — feat/app-photo-exif-place

## 목적

앱에서 사진을 올릴 때 EXIF GPS 로 장소를 자동 매칭한다. 웹과 동일 동작.

## 웹 현재 구조

```text
shared/utils/exif.ts              extractGps(file): Coordinate | null    exifr, File 기반
features/photo/photo.utils.ts     findNearestPlaceFromPhoto(file, places)
                                    → extractGps + 500m 이내 최근접
features/trip/trip-photo/useTripPhotos.ts
                                  placeId ?? await findNearestPlaceFromPhoto(...)
```

## 포팅 판단

**좌표 추출만 플랫폼별이고, 매칭 로직은 공유한다.**

- 웹은 `exifr` 로 `File` 을 파싱한다.
- 앱은 `expo-image-picker` 가 `exif: true` 옵션으로 GPS 를 **이미 반환한다.**
  파싱 라이브러리를 추가하지 않는다. (`expo-image-picker` 는 이미 설치돼 있다)

매칭 로직은 `packages/domains/src/trip/findNearestPlace.utils.ts` 에
**이미 있다.** 웹 `photo.utils.ts` 가 더하는 것은 500m 임계값뿐이다.

새 함수를 만들지 않고 기존 함수에 임계값을 더한다.
"최근접 장소 찾기" 는 하나의 개념이고 임계값은 그 매개변수다.
나누면 호출부가 두 모듈을 조립해야 한다.

## 인터페이스

```ts
// packages/domains/src/trip/findNearestPlace.utils.ts — 기존 함수에 옵션 추가
export function findNearestPlace<T extends Coordinate>(
  coordinate: Coordinate,
  places: T[],
  options?: { withinMeters?: number },
): T | null;
```

기존 호출부 2곳(`TripRoutesContent.mobile.tsx:112`, 앱 `TripRoutesContent.tsx:103`)은
인자를 넘기지 않으므로 그대로 동작한다.

```ts
// apps/waylog-app/src/features/trip/trip-photo/useTripPhotos.ts
// 웹과 동일하게 placeId 가 없으면 좌표로 추정한다.
interface UploadParams {
  assets: Array<{ uri: string; exif?: Record<string, unknown> | null }>;
  placeId?: string;
}
```

`TripPhotoContent.tsx` 의 `launchImageLibraryAsync` 에 `exif: true` 를 켜고
`result.assets` 를 그대로 넘긴다. uri 만 뽑아 넘기던 것을 바꾼다.

EXIF 의 `GPSLatitude`/`GPSLongitude`(+ `GPSLatitudeRef`/`GPSLongitudeRef`)를
`Coordinate` 로 바꾸는 것은 앱 전용이므로
`apps/waylog-app/src/features/photo/exif.utils.ts` 에 둔다.

```ts
export function toCoordinate(
  exif: Record<string, unknown> | null | undefined,
): Coordinate | null;
```

## 검증 케이스

`packages/domains/src/trip/__tests__/findNearestPlace.utils.test.ts` (기존 파일에 추가)

```text
it('제한 거리 안에 있는 가장 가까운 장소를 고른다')
it('가장 가까운 장소도 제한 거리 밖이면 null 을 반환한다')
it('제한 거리를 주지 않으면 거리와 무관하게 가장 가까운 장소를 고른다')
```

`apps/waylog-app` 은 테스트 인프라가 없다. `exif.utils.ts` 는 순수 함수이므로
`packages/domains` 로 올리지 않는 대신 실제 앱에서 확인한다.

> 위 3건은 이미 작성되어 red 확인까지 끝났다. 구현만 남았다.

## 완료 조건

- 앱에서 GPS 있는 사진을 올리면 500m 이내 장소에 자동 배정된다
- GPS 가 없거나 500m 밖이면 미분류로 올라간다 (웹과 동일)
- `pnpm --filter @waylog/domains test` 통과
- 웹이 여전히 동작한다 (`findNearestPlace` 호출부 2곳)
- `docs/plans/app-trip-status.md` 의 1단계 잔여 항목 정정

---

# 브랜치 2 — feat/app-trip-chat

## 목적

여행 메세지 기능을 앱에 붙인다.

## 웹 파일 — 전부 옮긴다

```text
features/trip/trip-chat/
  tripChat.types.ts              어댑터·도메인 → packages 승격
  tripChat.api.ts                    "
  useTripChatMessages.ts         데이터 → packages 승격
  useUnreadChatCount.ts              "
  TripChatPanel.tsx              UI → 앱 재작성
  TripChatMessage.tsx                "
  ChatFab.tsx                        "
  ChatIconButton.tsx                 "
  ChatToast.tsx                      "
  ChatPushNoticeCard.tsx             "
  TripUnreadCountBadge.tsx           "
  useTripChatOverlay.tsx             "
  notification/
    chatting-notification.types.ts
    useChatActivation.ts
    useChatWebPushFallback.ts    ← 웹 전용. 앱은 별도 판단 (아래)
    push.sw.ts                   ← 웹 전용. 옮기지 않는다
TripChatPage.tsx                 → app/trip/[tripId]/chat.tsx
```

## packages 승격 대상

| 현재 위치                                      | 이동 위치                            | 이유        |
| ---------------------------------------------- | ------------------------------------ | ----------- |
| `web/.../trip-chat/tripChat.types.ts`          | `packages/domains/src/trip-chat/`    | 도메인      |
| `web/.../trip-chat/tripChat.api.ts`            | `packages/domains/src/trip-chat/`    | 어댑터      |
| `web/.../trip-chat/useTripChatMessages.ts`     | `packages/domains/src/trip-chat/`    | 데이터 계층 |
| `web/.../trip-chat/useUnreadChatCount.ts`      | `packages/domains/src/trip-chat/`    | 데이터 계층 |
| `web/.../notification/useChatActivation.ts`    | `packages/domains/src/trip-chat/`    | 데이터 계층 |

이동 시 **시그니처를 바꾸지 않는다.** 웹 호출부는 import 경로만 바뀐다.
`~app/query-client` 전역 import 가 있으면 `useQueryClient()` 로 바꾼다 (1단계와 동일).

기존 테스트(`__test__/` 6개)도 함께 옮긴다. 테스트를 고치지 않는다.
`msw` 기반 통합 테스트가 packages 에서 도는지 확인하고,
안 되면 옮기지 말고 **보고한다** — 임의로 삭제하거나 약화시키지 않는다.

## 푸시 알림 — 확인 후 진행

웹은 `useWebPushSubscription` + service worker(`push.sw.ts`) 로 웹푸시를 쓴다.
앱은 이 경로를 쓸 수 없다.

**이 브랜치에서는 채팅 기능 본체(목록·전송·읽음·미읽음 배지)를 먼저 완성한다.**
푸시 알림은 다음 순서로 다룬다.

1. 채팅 본체를 푸시 없이 동작시킨다. `useChatActivation` 의 활성화 상태 관리는
   그대로 쓴다 (AsyncStorage 기반 `useStorageStore` 가 앱에 이미 있다).
2. 푸시가 필요한 시점에 `expo-notifications` + APNs 설정을 별도로 진행한다.

**주의**: Personal Team 프로비저닝 프로파일로는 푸시 권한(aps-environment)이
붙지 않는다. 실기기 푸시 검증은 유료 계정이 필요하다.
푸시를 이 브랜치에서 끝내야 한다면 그 제약을 먼저 보고한다.

`ChatPushNoticeCard`(푸시 권한 안내 카드)는 UI 이므로 옮긴다.
동작 연결은 위 2번 시점에 한다.

## 앱 File Structure

```text
apps/waylog-app/
  app/trip/[tripId]/
    chat.tsx                            웹 TripChatPage.tsx
  src/features/trip/trip-chat/
    TripChatPanel.tsx
    TripChatMessage.tsx
    ChatFab.tsx
    ChatIconButton.tsx
    ChatToast.tsx
    ChatPushNoticeCard.tsx
    TripUnreadCountBadge.tsx
    useTripChatOverlay.tsx
```

## 필요한 shim 추가

웹 trip-chat 이 쓰는 MUI 중 앱 shim 에 없는 것:

```text
Avatar, Badge, CircularProgress, Divider, Fade, Snackbar, SnackbarContent
```

`~shared/components/mui/` 에 추가한다. 웹 MUI 와 같은 prop 이름을 쓴다.
`react-transition-group`(`Fade`)은 Reanimated 로 대체한다 —
`shared/components/animation/` 에 이미 있는 것을 우선 확인한다.

`FullScreenPopup`, `SlideReveal`, `NotificationCard` 도 앱에 없다.
`shared/components/` 에 대응 컴포넌트를 만든다.

## 검증 케이스

승격한 테스트가 그대로 통과하는 것이 검증이다. 새로 쓰지 않는다.

```text
packages/domains/src/trip-chat/__tests__/
  tripChat.api.test.ts
  tripChat.types.test.ts
  useUnreadChatCount.test.ts
  useTripChat.test.ts
  tripChat.integration.test.ts
```

## 완료 조건

- 여행 상세에서 채팅 진입 → 메세지 목록이 보인다
- 메세지 전송이 동작한다
- 미읽음 개수 배지가 웹과 같이 동작한다
- 승격한 테스트 전부 통과
- 웹 채팅이 여전히 동작한다 (import 경로만 변경)
- 푸시 알림 상태를 명시적으로 보고한다 (완료 / 미착수 + 사유)

---

# 브랜치 3 — feat/app-trip-rest2

## 목적

나머지 잔여 기능을 전부 붙인다.

## 중요 — 대부분 새 화면이 아니라 기존 탭에 붙는다

| 기능                  | 웹 마운트 지점                                   | 앱 대응     |
| --------------------- | ------------------------------------------------ | ----------- |
| trip-recommend 마커   | `TripPlaceContent.mobile.tsx:88`                 | 장소 탭     |
| trip-recommend 목록   | `TripBasicInfoContent.mobile.tsx:83`             | 정보 탭     |
| trip-community-routes | `TripBasicInfoContent.mobile.tsx:97`             | 정보 탭     |
| trip-weather          | `TripRoutesContent.mobile.tsx:141`               | 계획 탭     |
| trip-marine-activity  | `TripRoutesContent.mobile.tsx:164`               | 계획 탭     |
| trip-create           | `/trip/new` 라우트                               | 새 라우트   |
| trip-invite           | `/trip/invite/:shareLink` 라우트                 | 새 라우트   |

앱의 해당 탭 파일에 웹과 **같은 위치**에 같은 컴포넌트를 붙인다.

## 웨이브 구성

기능끼리 독립적이지만 **같은 탭 파일을 건드리는 것끼리는 같은 웨이브에 넣지 않는다.**

| 웨이브 | 태스크                                    | 건드리는 공유 파일        |
| ------ | ----------------------------------------- | ------------------------- |
| 1      | weather 승격, marine-activity, trip-invite | `TripRoutesContent` (marine 단독) |
| 2      | trip-weather, trip-create                 | `TripRoutesContent` (weather 단독) |
| 3      | trip-recommend                            | `TripPlaceContent` + `TripBasicInfoContent` |
| 4      | trip-community-routes                     | `TripBasicInfoContent`    |

웨이브 1 의 weather 승격은 trip-weather 의 선행 조건이므로 먼저 끝나야 한다.

## packages 승격 대상

| 현재 위치                                            | 이동 위치                                  | 비고                    |
| ---------------------------------------------------- | ------------------------------------------ | ----------------------- |
| `web/features/weather/weather.types.ts`              | `packages/domains/src/weather/`            | 도메인                  |
| `web/features/weather/weather.api.ts`                | `packages/domains/src/weather/`            | 어댑터 (해외, 438줄)    |
| `web/features/weather/domestic-weather.api.ts`       | `packages/domains/src/weather/`            | 어댑터 (국내, 938줄)    |
| `web/features/weather/useDailyWeatherForecast.ts`    | `packages/domains/src/weather/`            | 데이터 계층             |
| `web/features/weather/useHourlyForecast.ts`          | `packages/domains/src/weather/`            | 데이터 계층             |
| `web/.../trip-recommend/trip-recommend.api.ts`       | `packages/domains/src/trip-recommend/`     | 어댑터                  |
| `web/.../trip-recommend/useRecommendedPlaces.ts`     | `packages/domains/src/trip-recommend/`     | 데이터 계층             |
| `web/.../trip-community-routes/communityRoute.types.ts` | `packages/domains/src/community-route/` | 도메인                  |
| `web/.../trip-community-routes/communityRoute.api.ts`   | `packages/domains/src/community-route/` | 어댑터                  |
| `web/.../trip-community-routes/useCommunityRoutes.ts`   | `packages/domains/src/community-route/` | 데이터 계층             |
| `web/.../trip-community-routes/useCommunityRouteDetail.ts` | `packages/domains/src/community-route/` | 데이터 계층          |
| `web/features/trip/trip-invite/useInvitedTrip.ts`    | `packages/domains/src/trip/`               | 데이터 계층             |

`marine-activity` 는 **이미 `packages/domains/src/marine-activity/` 에 전부 있다.**
승격할 것이 없다. UI 만 옮긴다.

weather 데이터 계층은 HTTP + date-fns 만 쓴다. 플랫폼 의존이 없어 그대로 이동한다.
`domestic-weather.api.ts` 의 938줄 대부분은 기상청 격자 변환 테이블이다. 그대로 옮긴다.

## 앱 File Structure

```text
apps/waylog-app/
  app/trip/
    new.tsx                                       웹 TripCreatePage
    invite/[shareLink].tsx                        웹 TripInvitePage
  src/features/
    weather/
      WeatherIcon.tsx
      DailyWeatherInfoBox.tsx
      HourlyForecastList.tsx
      HourlyForecastItem.tsx
    trip/
      trip-recommend/
        RecommendedMarkers.tsx
        RecommendedPlaceListSection.tsx
        RecommendedPlaceDetailOverlay.tsx
      trip-community-routes/
        CommunityRoutesSection.tsx
        CommunityRouteThumbnail.tsx
        CommunityRouteDetailOverlay.tsx
      trip-weather/
        TripWeatherIconButton.tsx
        TripWeatherForecastSheet.tsx
      trip-marine-activity/
        MarineActivityMarkerIcon.tsx
        TripMarineActivityMapMarkers.tsx
        TripMarineActivityDetailOverlay.tsx
      trip-create/
        TripCreateScreen.tsx
        DestinationStep.tsx
        DateStep.tsx
        InfoStep.tsx
      trip-invite/
        TripInviteScreen.tsx
```

`TripWeatherForecastDialog.tsx` 는 데스크톱용이다. 옮기지 않는다.
`CommunityRoutesSection.desktop.tsx` 도 옮기지 않는다.

`RecommendedPlaceListSection.tsx` 는 모바일·데스크톱 export 두 개가 한 파일에 있다.
모바일 export 만 옮긴다.

## 필요한 shim 추가

앱 shim 에 없는 것:

```text
Card, CardContent, CardHeader, Container, Dialog, DialogContent,
LinearProgress, Paper, ToggleButton, ToggleButtonGroup, alpha, useTheme
```

`Dialog` 는 앱에서 바텀시트가 표준이다. 웹이 `Dialog` 를 쓰는 곳은
**모바일 판에서 이미 `BottomSheet` 를 쓰는지 먼저 확인**한다.
`.mobile.tsx` 가 바텀시트를 쓰면 그것이 기준이다.

`ToggleButtonGroup` 은 `trip-weather` 가 날짜 토글에 쓴다.
앱에 `TripDateToggleGroup` 대응이 이미 있는지 계획 탭에서 확인한다.

## 이미 있는 것 — 재사용

- `useRoadRoute` — community-routes 가 쓴다. 앱에 이미 있다
- `Map` / `Map.Marker` / `Map.Path` — 앱 구현 완료
- `BottomSheet` — 앱 자체 구현 완료
- `useOverlay` — 앱에 있다
- `useQueryParamState` / `useActiveTripDay` — 앱에 있다
- `LocationForm` — trip-create 의 `DestinationStep` 이 쓴다. 앱 유무 확인 필요
- `date-picker` — trip-create 의 `DateStep` 이 쓴다. 앱에 이미 있다

`Map/polygon-layer.utils` 는 community-routes 가 쓴다.
순수 함수면 `packages/domains/src/map/` 으로 올리고, google 전용이면 앱에서 새로 만든다.
**옮기기 전에 파일을 열어 확인한다.**

## 검증 케이스

승격하는 모듈 중 기존 테스트가 있는 것은 함께 옮긴다.

```text
packages/domains/src/weather/__tests__/weatherAvailability.test.ts   (웹에서 이동)
```

`trip-weather` / `trip-marine-activity` 의 컴포넌트 테스트
(`TripWeatherForecastSheet.test.tsx`, `TripMarineActivityDetailOverlay.test.tsx`)는
웹에 남긴다. 앱은 컴포넌트 테스트 인프라가 없다.

승격 대상 중 테스트 없는 순수 함수가 새로 생기면 그때 전략 A 로 채운다.
**포팅 과정에서 새 순수 함수를 만들지 않는 것이 원칙이다.**

## 완료 조건

- 정보 탭에 추천 장소 목록과 커뮤니티 경로가 보인다
- 장소 탭 지도에 추천 마커가 보이고 탭하면 상세가 뜬다
- 계획 탭에 날씨 아이콘이 보이고 탭하면 예보 시트가 뜬다
- 계획 탭 지도에 해양 활동 마커가 보이고 탭하면 상세가 뜬다
- 여행 생성 3단계(목적지·날짜·정보)가 동작한다
- 초대 링크로 진입해 여행에 참여할 수 있다
- `pnpm --filter @waylog/domains test` 통과
- 웹이 여전히 동작한다

---

## 2단계 전체 완료 조건

- 웹 trip 기능 중 앱에 없는 것이 없다 (영구 제외 항목 제외)
- `@waylog/domains` 테스트 전부 통과
- 웹 `pnpm ts-check` 통과, 웹 e2e 통과
- `docs/codebase.md` 에 승격한 모듈과 앱 구조 반영
- `docs/plans/app-trip-status.md` 갱신

## 앱 전체에서 영구 제외

statistics, explorer, post + feed, `PlaceDetailPage` 라우트(`/place/:placeId`)

## 리스크

| 리스크                                    | 시점   | 대응                                                      |
| ----------------------------------------- | ------ | --------------------------------------------------------- |
| 네이티브 푸시 권한 (Personal Team)        | chat   | 채팅 본체를 푸시와 분리. 제약을 보고 후 별도 진행         |
| `msw` 통합 테스트가 packages 에서 안 돎   | chat   | 옮기지 말고 보고. 테스트를 약화시키지 않는다              |
| shim 부족분이 예상보다 큼                 | rest2  | 웹이 실제로 쓰는 prop 만 구현. 전체 MUI 를 재현하지 않는다 |
| 훅 12개 승격으로 웹 회귀                  | 전체   | 시그니처 고정. import 경로만 변경. 웹 e2e 로 확인         |
| `polygon-layer.utils` 가 google 전용      | rest2  | 파일 확인 후 결정. 순수하면 승격, 아니면 앱에서 새로      |
