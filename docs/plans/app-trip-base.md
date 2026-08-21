# 1단계 — trip 베이스 이관 (waylog-app)

## 목표

`apps/waylog-app` 에서 여행 상세의 핵심 기능이 네이티브로 동작한다.
웹뷰는 쓰지 않는다. 모든 화면은 RN 컴포넌트다.

## 범위

### 포함

trip-list, trip-place, trip-route, trip-photo, trip-basic-info,
trip-create, trip-invite, trip-member, trip-memo, trip-checklist,
trip-expense, trip 공통(components/hooks/top-level)

place 중 trip 이 의존하는 것: `place.types`, `place.api`, `usePlace`,
`place-search`, `usePlaceDetailOverlay` + `PlaceFullScreenModal`

### 1단계에서 제외 (2단계로)

trip-recommend, trip-community-routes, trip-weather,
trip-marine-activity, trip-chat, features/weather

---

## 설계 원칙 — 웹과의 편차 최소화

이 플랜의 최우선 제약이다. 아래를 지킨다.

### 1. 계층 구조와 파일 패턴을 그대로 승계한다

웹의 계층 규칙(`docs/codebase.md`, `architecture.md` §1)을 앱에서도 동일하게 쓴다.

| 계층        | 파일 패턴                  | 앱에서의 차이                                     |
| ----------- | -------------------------- | ------------------------------------------------- |
| 외부 어댑터 | `*.api.ts`                 | **차이 없음** — `@waylog/domains` 로 이미 공유 중 |
| 도메인      | `*.types.ts`, `*.utils.ts` | **차이 없음** — 공유                              |
| 데이터      | `use*.ts`                  | **차이 없음** — 공유                              |
| UI          | `*.tsx`                    | **여기만 다시 쓴다**                              |

의존 방향 `UI → Data → Domain → Adapter` 를 앱에서도 유지한다.

### 2. 디렉토리 구조를 미러링한다

```text
apps/waylog-web/src/features/trip/trip-route/useTripRoutes.ts
apps/waylog-app/src/features/trip/trip-route/TripRoutesContent.tsx
                  ^^^^^^^^^^^^^^^^^^^^^^^^^^ 동일 경로
```

같은 기능은 같은 경로에 둔다. 웹에서 파일을 찾는 방법이 앱에서도 그대로 통한다.

### 3. `.mobile.tsx` 를 출발점으로 삼는다

웹에 이미 `*.mobile.tsx` 가 18개 있다. 앱 화면은 데스크톱이 아니라
**모바일 변형에서 출발**한다. 레이아웃 판단이 이미 끝나 있다.

앱에는 `.mobile` / `.desktop` 접미사를 쓰지 않는다. 분기가 없으므로
`TripPlaceContent.tsx` 하나만 둔다.

### 4. 데이터 계층은 새로 만들지 않는다

`useTripRoutes`, `useTripPlaces` 등은 **웹 앱 안에 있고 아직 공유되지 않았다.**
이관 대상 훅은 `packages/domains` 로 올려 양쪽이 공유한다.

올릴 때 웹 API 의존이 있으면 그 부분만 주입으로 바꾼다.
훅 시그니처는 바꾸지 않는다 — 웹 호출부가 그대로 동작해야 한다.

### 5. 공개 인터페이스를 재사용한다

`shared/components/Map` 은 이미 provider 무관 인터페이스를 갖고 있다
(`MapProps` / `MarkerProps` / `MapRef`, kakao·google 구현 교체 가능).
앱은 **세 번째 구현**을 추가하는 것이지 새 인터페이스를 만드는 게 아니다.

---

## 브랜치 구성

```text
feat/app-trip-base (Root)
  ├─ feat/app-trip-infra    Expo Router + gluestack + trip-list + TripDetail 셸
  ├─ feat/app-trip-map      Map RN 구현 + trip-route + trip-place
  └─ feat/app-trip-rest     photo·basic-info·create·invite·member
                            ·memo·checklist·expense
```

`app-trip-map` 완료 시점에 "여행 하나를 지도로 볼 수 있음" 이 성립한다.
gluestack · react-native-maps · Expo Router 3축 통합이 여기서 검증된다.
실패하면 `app-trip-rest` 를 쓰기 전에 안다.

---

## 기술 스택

| 영역            | 선택                                                 | 비고                                  |
| --------------- | ---------------------------------------------------- | ------------------------------------- |
| UI              | `@gluestack-ui/core` v5 + `@gluestack-ui/utils`      | NativeWind 기반                       |
| peer            | `react-native-svg`, `react-native-safe-area-context` | gluestack 요구                        |
| 지도            | `react-native-maps` (Google Provider)                | 웹과 동일 Place ID 체계               |
| 네비게이션      | Expo Router                                          | 웹 react-router 7 과 파일 라우팅 동일 |
| 서버 상태       | `@tanstack/react-query` + `@waylog/domains`          | 현행 유지                             |
| 클라이언트 상태 | `zustand`                                            | 웹과 동일                             |
| 사진            | `expo-image-picker`, `expo-image-manipulator`        |                                       |
| 오프라인        | `AsyncStorage` + react-query persist                 |                                       |

`@gluestack-ui/themed` v1 은 2025-09 이후 방치 상태다. 쓰지 않는다.

---

# 브랜치 1 — feat/app-trip-infra

## 목적

앱 셸과 라우팅을 세우고, 여행 목록에서 상세로 진입할 수 있게 한다.

## 선행 태스크 — 의존성 추가 (SDK 54 유지)

**Expo SDK 는 54 를 유지한다.** Expo Go 가 지원하는 버전이기 때문이다.
업그레이드하지 않는다.

`AGENTS.md:3` 은 "Expo SDK 57 / React Native 0.86" 이라고 적혀 있으나
실제는 `expo ~54.0.37` / `react-native 0.81.5` 다. **문서가 틀렸다.**
이 브랜치에서 `AGENTS.md` 를 실제 버전에 맞게 고친다.

### 버전 선택은 `expo install` 에 맡긴다

npm 의 `latest` 를 그대로 쓰면 SDK 54 와 어긋난다.
Expo 생태계 패키지는 SDK 별로 호환 버전이 따로 있고,
그 매핑은 `expo install` 이 알고 있다.

```bash
cd apps/waylog-app
pnpm expo install expo-router react-native-maps react-native-svg \
  react-native-safe-area-context react-native-screens \
  react-native-gesture-handler react-native-reanimated expo-linking
pnpm expo install --check      # 설치 후 SDK 호환 여부 재확인
```

npm 에서 직접 버전을 조회해 고정하지 않는다.
dist-tag 이름이 패키지마다 제각각이라(`sdk-54` 태그가 있는 것도 없는 것도 있다)
수동 조회는 틀리기 쉽다.

### gluestack

`@gluestack-ui/core` v5 는 Expo SDK 별 태그가 없다. NativeWind 기반이므로
`nativewind` + `tailwindcss` 가 함께 필요하다. 설치 후 최소 화면으로
SDK 54 에서 렌더되는지 먼저 확인한다. **여기가 이 브랜치의 첫 검증 지점이다.**

### 확인 사항

- 기존 `LoginScreen` / `TripListScreen` 이 계속 동작하는지 확인.
- `metro.config.js` 의 `SINGLETONS` **목록 커버리지**를 점검한다.

  react 버전 자체는 문제가 되지 않는다. `SINGLETONS` 가 어떤 경로의 import 든
  앱의 `node_modules` 로 강제 리졸브하므로, 웹이 react 를 올려도 앱이 보는
  react 는 한 벌이다. 이미 해결된 문제다.

  점검이 필요한 것은 **목록에 없는 패키지**다. 현재 목록은
  `react`, `react-dom`, `react-native`, `@tanstack/react-query` 4 개다.
  이번에 추가하는 것 중 인스턴스가 하나여야 하는 네이티브 모듈
  (`react-native-safe-area-context`, `react-native-screens`,
  `react-native-gesture-handler`, `react-native-reanimated`)이
  중복 설치되는지 확인하고, 그렇다면 목록에 추가한다.

  ```bash
  pnpm why react-native-safe-area-context   # 중복 설치 여부 확인
  ```

## File Structure

```text
apps/waylog-app/
  app/                                   # Expo Router 라우트
    _layout.tsx                          # QueryClientProvider + gluestack + Auth
    index.tsx                            # 여행 목록
    login.tsx
    trip/
      [tripId]/
        _layout.tsx                      # 탭 셸
        index.tsx                        # 기본 정보
  src/
    features/trip/
      trip-list/
        TripListScreen.tsx
        OngoingHero.tsx
        UpcomingCard.tsx
        PastTripRow.tsx
        CreateTripCardButton.tsx
      TripDetailTabs.tsx
    shared/
      components/                        # gluestack 래퍼가 필요한 경우만
      hooks/
        useOverlay.tsx                   # 웹 useOverlay 의 RN 대응
```

기존 `apps/waylog-app/src/TripListScreen.tsx`, `LoginScreen.tsx` 는
위 구조로 이동한다. 루트에 화면 파일을 두지 않는다.

## 인터페이스

```ts
// src/shared/hooks/useOverlay.tsx
// 웹 shared/hooks/useOverlay 와 동일한 시그니처를 유지한다.
// 호출부 코드가 웹과 같아야 하므로 이름과 인자를 바꾸지 않는다.
interface OverlayController {
  open: (
    render: (props: { isOpen: boolean; close: () => void }) => ReactNode,
  ) => void;
  close: () => void;
}

export function useOverlay(): OverlayController;
```

```ts
// packages/domains/src/trip/useTrips.ts — 이미 존재. 그대로 사용한다.
```

`trip-list.utils.ts` 는 웹에 있고 순수 함수다.
`packages/domains/src/trip/` 로 이동해 양쪽이 공유한다.

## 검증 케이스

`packages/domains/src/trip/__tests__/tripList.utils.test.ts`

```text
it.todo('진행 중인 여행을 시작일 기준으로 고른다')
it.todo('예정된 여행을 시작일 오름차순으로 정렬한다')
it.todo('종료된 여행을 종료일 내림차순으로 정렬한다')
it.todo('여행이 없으면 각 분류가 빈 배열이다')
```

UI(`*.tsx`)는 테스트하지 않는다 — 컴포넌트 테스트 인프라가 없다.
빌드와 실제 앱 확인으로 검증한다.

## 완료 조건

- 로그인 → 여행 목록 → 여행 상세 진입이 동작한다
- 탭 전환이 동작한다 (내용은 비어 있어도 된다)
- `pnpm --filter @waylog/domains test` 통과
- 웹 빌드가 깨지지 않는다 (`trip-list.utils` 이동 영향)

---

# 브랜치 2 — feat/app-trip-map

## 목적

지도가 네이티브로 동작하고, 그 위에서 경로와 장소를 볼 수 있다.
**이 브랜치가 1단계 최대 리스크다.**

## File Structure

```text
apps/waylog-app/src/
  shared/components/Map/
    index.tsx                            # 웹과 동일한 공개 인터페이스
    NativeMap.tsx                        # react-native-maps 구현
    NativeMapMarker.tsx
    NativeMapPath.tsx
    types.ts                             # 웹 types.ts 를 재사용 (아래 참조)
  shared/hooks/
    useQueryParamState.ts                # Expo Router 판. 웹과 동일 시그니처
  features/route/road-route/
    useRoadRoute.ts                      # AsyncStorage 캐시. 웹과 동일 시그니처
  features/trip/
    trip-route/
      TripRoutesContent.tsx              # 웹 .mobile 에서 출발
      RouteTimeline.tsx
      TransportIcon.tsx
      RouteNoteList.tsx
      PlaceSelectSheet.tsx
      useRouteLegs.ts                    # 앱 useRoadRoute 를 쓴다
      useActiveTripDay.ts                # 앱 useQueryParamState 를 쓴다
    trip-place/
      TripPlaceContent.tsx               # 웹 .mobile 에서 출발
      TripPlaceItemButton.tsx
      TripPlaceAdditionButton.tsx
      TripPlaceMapFloatingControls.tsx
      PlacePhotoSection.tsx
  features/place/
    place-search/
      PlaceSearchScreen.tsx
```

## 이동 대상 — packages 로 승격

지도 타입과 데이터 훅은 양쪽이 공유한다.

| 현재 위치                                                         | 이동 위치                                             | 이유                                              |
| ----------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------- |
| `web/shared/components/Map/types.ts`                              | `packages/domains/src/map/types.ts`                   | 좌표·마커 타입은 플랫폼 무관                      |
| `web/.../Map/map.utils.ts`                                        | `packages/domains/src/map/map.utils.ts`               | 순수 함수                                         |
| `web/.../Map/cluster.core.ts`                                     | `packages/domains/src/map/cluster.core.ts`            | 순수 함수                                         |
| `web/features/trip/trip-route/useTripRoutes.ts`                   | `packages/domains/src/trip/useTripRoutes.ts`          | 데이터 계층. **`queryClient` 주입 필요**          |
| `web/features/trip/trip-route/findNearestPlace.utils.ts`          | `packages/domains/src/trip/findNearestPlace.utils.ts` | 순수 함수                                         |
| `web/features/trip/trip-place/useTripPlaces.ts`                   | `packages/domains/src/trip/useTripPlaces.ts`          | 데이터 계층. **`queryClient` 주입 필요**          |
| `web/features/place/place.types.ts`                               | `packages/domains/src/place/place.types.ts`           | 도메인                                            |
| `web/features/place/place.api.ts`                                 | `packages/domains/src/place/place.api.ts`             | 어댑터                                            |
| `web/features/place/usePlace.ts`                                  | `packages/domains/src/place/usePlace.ts`              | 데이터 계층                                       |
| `web/features/route/road-route/roadRoute.api.ts`                  | `packages/domains/src/route/roadRoute.api.ts`         | 어댑터. `@waylog/domains` 만 import — 그대로 이동 |
| `web/features/route/road-route/roadRoute.schema.ts`               | `packages/domains/src/route/roadRoute.schema.ts`      | 도메인                                            |
| `web/features/trip/trip-route/useActiveTripDay.ts` 의 기본값 계산 | `packages/domains/src/trip/activeTripDay.utils.ts`    | 순수 함수로 분리                                  |

이동 시 시그니처를 바꾸지 않는다. 웹 호출부는 import 경로만 바뀐다.

`useMapViewport`, `useMapZoomLevel`, `loader.ts`, `marker.renderers.tsx` 등
google 전용 구현은 이동하지 않는다. 앱은 별도 구현을 갖는다.

### 플랫폼별 개별 구현 — `useRoadRoute`, `useActiveTripDay`

두 훅은 공유하지 않는다. 각 플랫폼이 자기 저장소로 구현한다.
공유를 억지로 만들면 주입 장치가 늘어나 오히려 편차가 커진다.

**공유하는 것은 시그니처다.** 이름·인자·반환 모양을 웹과 같게 맞춰
호출부(`TripRoutesContent` 등) 코드가 양쪽에서 동일하게 유지되도록 한다.

#### `useRoadRoute`

웹은 `clientDatabase`(IndexedDB), 앱은 `AsyncStorage` 로 캐시한다.
`roadRoute.api.ts` 는 `@waylog/domains/api` 의 supabase 만 쓰므로
`packages/domains/src/route/roadRoute.api.ts` 로 **이동해 공유**한다.
캐시 계층만 각자 구현한다.

```ts
// 양쪽 동일 시그니처
export function useRoadRoute(options: {
  waypoints: Coordinate[];
  suspense?: boolean;
}): UseQueryResult<RoadRoute>;
```

`useRouteLegs` 는 `useRoadRoute` 를 쓰므로 함께 각 플랫폼에 둔다.
계산 로직 자체는 짧으므로 중복을 허용한다.

#### `useActiveTripDay`

**앱에도 URL 쿼리 파라미터가 있다.** Expo Router 는 파일 라우팅 위에
실제 URL 개념을 갖는다. 전역 상태를 쓸 이유가 없다.

| 웹 (react-router 7)   | 앱 (Expo Router)             |
| --------------------- | ---------------------------- |
| `useSearchParams()`   | `useLocalSearchParams()`     |
| `setParams({ days })` | `router.setParams({ days })` |
| `?days=2026-08-21`    | 동일 — 딥링크 URL 에 실린다  |

따라서 저장 모델이 양쪽 같다. 앱은 `useQueryParamState` 의 RN 판을
`app/src/shared/hooks/useQueryParamState.ts` 에 만들고,
`useActiveTripDay` 는 웹과 같은 코드가 된다.

```ts
// 양쪽 동일 시그니처
export function useActiveTripDay(tripId: string): {
  value: string;
  update: (value: string) => void;
};
```

기본값 계산(오늘이 여행 기간 안이면 오늘, 아니면 시작일)은 순수 함수이므로
`packages/domains/src/trip/activeTripDay.utils.ts` 로 올려 공유한다.

부수 효과로 딥링크가 동작한다: `waylog://trip/123?days=2026-08-21`

### `queryClient` 전역 import

`useTripRoutes`, `useTripPlaces` 는 `~app/query-client` 의 싱글턴을
직접 import 한다. 앱은 `App.tsx` 에서 자체 `QueryClient` 를 만든다.

**대응**: 전역 import 를 `useQueryClient()` 훅 호출로 바꾼다.
react-query 가 이미 Provider 로 인스턴스를 내려주므로 주입 장치가 따로 필요 없다.
훅 안에서만 쓰이므로 훅 규칙 위반도 아니다.

```ts
// ✗ 현재
import { queryClient } from "~app/query-client";

// ✓ 이동 후
const queryClient = useQueryClient();
```

`mergeQueriesStatus`(`web/shared/utils/merges.ts`)도 `useTripRoutes` 가 쓴다.
순수 함수이므로 `packages/domains/src/utils/` 로 함께 옮긴다.
같은 파일의 `mergeRef`/`mergeProps` 는 DOM 관련이므로 웹에 남긴다.

## 인터페이스

```ts
// packages/domains/src/map/types.ts
// 웹 shared/components/Map/types.ts 에서 이동. 내용 변경 없음.
// MapType 만 확장한다.
export type MapType = "kakao" | "google" | "native";

export interface MapRef {
  panTo: (lat: number, lng: number, level?: number) => void;
  relayout: () => void;
  focus: () => void;
}

export interface MapProps {
  defaultCenter?: Coordinate;
  center?: Coordinate;
  autoFocus?: AutoFocus;
  children?: ReactNode | ((props: MapRenderProps) => ReactNode);
  ref?: Ref<MapRef>;
  clustering?: boolean;
  clusterGridSize?: number;
  onBoundsChange?: (bounds: MapBounds) => void;
}

export interface MarkerProps {
  id?: string;
  lat: number;
  lng: number;
  label?: string;
  variant?: "pin" | "circle";
  color?: MarkerColor;
  opacity?: number;
  outlined?: boolean;
  thumbnailUrl?: string;
  onClick?: (marker: MarkerCallbackData) => void;
}
```

```tsx
// apps/waylog-app/src/shared/components/Map/index.tsx
// 웹의 Map 과 동일한 사용법을 유지한다. type prop 은 받지 않는다
// (앱에는 구현이 하나뿐이므로 소비자가 결정할 이유가 없다 — 원칙 5).
//
// 웹:  <Map type="google" ref={mapRef} defaultCenter={...}>
// 앱:  <Map ref={mapRef} defaultCenter={...}>
export function Map(props: MapProps): ReactNode;
export namespace Map {
  export const Marker: (props: MarkerProps) => ReactNode;
  export const Path: (props: PathProps) => ReactNode;
}
```

`tooltip` 과 `onContextMenu` 는 앱 `MarkerProps` 에서 뺀다.
네이티브에 hover 와 우클릭이 없다 — 소비자가 결정할 수 없는 값이다.

## 명명 — 웹의 결함을 승계하지 않는다

`TripPlaceContent.tsx` 의 `confirmedPlaces` / `wishedPlaces` 는
프로젝트 명명 규칙 위반이다. 일정에 배치된 장소는 `planned`,
아직 배치되지 않은 것은 `candidate` 다.

앱에서는 `plannedPlaces` / `candidatePlaces` 를 쓴다.
웹은 이 브랜치에서 건드리지 않는다 — 별도 리팩터 커밋으로 분리한다.

## 검증 케이스

`packages/domains/src/map/__tests__/cluster.core.test.ts`

```text
it.todo('격자 크기 안의 좌표들을 하나의 클러스터로 묶는다')
it.todo('격자 경계를 넘는 좌표는 다른 클러스터가 된다')
it.todo('클러스터 중심을 소속 좌표의 평균으로 계산한다')
it.todo('좌표가 하나면 클러스터가 아니라 단일 마커로 남는다')
```

`packages/domains/src/trip/__tests__/findNearestPlace.utils.test.ts`

```text
it.todo('기준 좌표에서 가장 가까운 장소를 고른다')
it.todo('후보가 비어 있으면 undefined 를 반환한다')
it.todo('거리가 같으면 먼저 오는 장소를 고른다')
```

`packages/domains/src/trip/__tests__/activeTripDay.utils.test.ts`

```text
it.todo('오늘이 여행 기간 안이면 오늘을 기본 날짜로 고른다')
it.todo('오늘이 여행 시작 전이면 시작일을 고른다')
it.todo('오늘이 여행 종료 후면 시작일을 고른다')
it.todo('여행이 하루짜리면 그 날을 고른다')
```

`packages/domains/src/route/__tests__/roadRoute.utils.test.ts`

`roadRoute.api.ts` 안의 `splitIntoSegments` 는 순수 함수인데 파일 안에 묻혀 있다.
이동 시 `roadRoute.utils.ts` 로 분리한다.

```text
it.todo('경유지를 최대 크기 단위로 나눈다')
it.todo('나뉜 구간이 끝점을 공유하도록 이어붙인다')
it.todo('경유지가 최대 크기 이하면 구간이 하나다')
it.todo('경유지가 둘이면 구간이 하나다')
```

## 완료 조건

- 여행 상세에서 지도가 뜨고 마커가 보인다
- 마커 탭 → 장소 상세 오버레이가 뜬다
- 장소 검색으로 장소를 추가할 수 있다
- 경로 타임라인이 보이고 지도에 경로가 그려진다
- `pnpm --filter @waylog/domains test` 통과
- 웹이 여전히 동작한다 (이동한 훅 11개의 호출부)

---

# 브랜치 3 — feat/app-trip-rest

## 목적

여행 상세의 나머지 탭과 여행 생성·초대 플로우를 채운다.

## File Structure

```text
apps/waylog-app/src/features/trip/
  trip-photo/TripPhotoContent.tsx
  trip-basic-info/TripBasicInfoContent.tsx
  trip-create/TripCreateScreen.tsx
  trip-invite/TripInviteScreen.tsx
  trip-member/TripMemberList.tsx
  trip-memo/
    TripMemoListContent.tsx
    TripMemoDetailScreen.tsx
    TripMemoEditScreen.tsx
  trip-checklist/TripChecklistContent.tsx
  trip-expense/
    TripExpenseContent.tsx
    ExpenseFormSheet.tsx
    ExpenseSummary.tsx

apps/waylog-app/app/trip/[tripId]/
  photo.tsx
  memo/[memoId]/index.tsx
  memo/[memoId]/edit.tsx
  checklist.tsx
  expense.tsx
apps/waylog-app/app/trip/
  new.tsx
  invite/[shareLink].tsx
```

## 웨이브 구성

8개 기능은 서로 독립적이다. 같은 파일을 건드리지 않으므로 병렬 실행한다.
단 라우트 파일(`app/trip/[tripId]/_layout.tsx`)은 탭 추가로 공유되므로
**웨이브 종료 후 한 번에 반영**한다.

| 웨이브 | 태스크                                   |
| ------ | ---------------------------------------- |
| 1      | trip-photo, trip-basic-info, trip-member |
| 2      | trip-create, trip-invite, trip-checklist |
| 3      | trip-memo, trip-expense                  |

trip-expense 가 가장 크다(2,614 LOC). 마지막 웨이브에 단독에 가깝게 둔다.

## 이동 대상 — packages 로 승격

| 현재 위치                                                     | 이동 위치                              | 비고                           |
| ------------------------------------------------------------- | -------------------------------------- | ------------------------------ |
| `web/features/trip/trip-expense/useExpensesByPlace.ts`        | `packages/domains/src/expense/`        | 웹 전용 의존 없음. 그대로 이동 |
| `web/features/trip/trip-checklist/tripChecklist.api.ts`       | `packages/domains/src/trip-checklist/` | 어댑터                         |
| `web/features/trip/trip-checklist/tripChecklist.type.ts`      | `packages/domains/src/trip-checklist/` | 도메인                         |
| `web/features/trip/trip-checklist/tripChecklist.constants.ts` | `packages/domains/src/trip-checklist/` | 도메인                         |
| `web/features/trip/trip-checklist/useTripChecklist.ts`        | `packages/domains/src/trip-checklist/` | 데이터 계층                    |
| `web/features/trip/trip-memo/tripMemo.api.ts`                 | `packages/domains/src/trip-memo/`      | 어댑터                         |
| `web/features/trip/trip-memo/tripMemo.type.ts`                | `packages/domains/src/trip-memo/`      | 도메인                         |
| `web/features/trip/trip-memo/useTripMemo.ts`                  | `packages/domains/src/trip-memo/`      | 데이터 계층                    |

checklist·memo 에는 `*.utils.ts` 가 없다. 순수 로직이 컴포넌트 안에 있다.
이관 시 계산 로직을 `*.utils.ts` 로 **새로 분리**한 뒤 테스트한다
(CLAUDE.md 전략 A — 설계 우선 TDD).

`routeExpenseView.utils.tsx` 는 이동하지 않는다.
`useRoadRoute` 와 `Map` 컴포넌트를 직접 import 하고 있어 순수 로직이 아니다
(`routeExpenseView.utils.tsx:1-2`). 앱에서 동등 화면을 새로 작성한다.

## 검증 케이스

`packages/domains/src/expense/__tests__/expensesByPlace.test.ts`

```text
it.todo('지출을 장소별로 묶는다')
it.todo('장소가 없는 지출을 미분류로 묶는다')
it.todo('같은 장소의 지출 금액을 합산한다')
it.todo('통화가 다른 지출을 통화별로 나눠 합산한다')
```

`packages/domains/src/trip/__tests__/checklist.utils.test.ts`

```text
it.todo('완료 항목과 미완료 항목을 분리한다')
it.todo('완료율을 항목 수 기준으로 계산한다')
it.todo('항목이 없으면 완료율이 0이다')
```

## 완료 조건

- 여행 상세의 모든 탭이 동작한다
- 여행 생성 → 초대 → 멤버 확인 플로우가 동작한다
- 지출 입력과 합산이 동작한다
- `pnpm --filter @waylog/domains test` 통과
- 웹이 여전히 동작한다

---

## 1단계 전체 완료 조건

- 앱에서 로그인 → 여행 목록 → 여행 상세 → 각 탭이 모두 동작한다
- `@waylog/domains` 테스트 전부 통과
- 웹 `pnpm ts-check` 통과, 웹 e2e 통과
- `docs/codebase.md` 에 앱 구조와 이동한 모듈을 반영

## 리스크

| 리스크                                        | 시점       | 대응                                                      |
| --------------------------------------------- | ---------- | --------------------------------------------------------- |
| **gluestack v5 가 SDK 54 에서 안 돌 가능성**  | infra 최초 | 최소 화면으로 먼저 확인. 실패 시 UI 스택 재선정           |
| `SINGLETONS` 목록에 없는 네이티브 모듈 중복   | infra 초반 | `pnpm why` 로 확인 후 목록 추가                           |
| `queryClient` 전역 import 제거가 웹 회귀 유발 | map 초반   | 훅 시그니처 고정. 웹 e2e 로 확인                          |
| react-native-maps 클러스터링 부재             | map 중반   | `cluster.core.ts` 가 순수 함수라 재사용 가능. 렌더만 새로 |
| 훅 11개 이동으로 웹 회귀                      | map        | 시그니처 고정. import 경로만 변경. 웹 e2e 로 확인         |
| trip-expense 규모                             | rest       | 웨이브 3에 단독 배치                                      |
