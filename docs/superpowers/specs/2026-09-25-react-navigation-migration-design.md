# waylog-app: expo-router → @react-navigation 전환 설계

## 배경

Expo SDK 54 → 57 업그레이드(Xcode 27 Device Hub 대응, `feat/expo-sdk-upgrade` 브랜치) 과정에서
SDK 56부터 `expo-router`가 `@react-navigation/*` 직접 import를 Metro 번들 타임에 차단하는 것을 확인했다.
`waylog-app`은 폼 퍼널(`PostFormFunnel`, `TransportFormFunnel`)에서 파일 라우팅과 무관한 로컬
`createNativeStackNavigator()` 인스턴스를 쓰고 있는데, 조사 결과 expo-router의 `Stack`은 이런
"파일 트리 밖 로컬 위저드" 패턴을 공식 지원하지 않는다(마이그레이션 가이드의 `native-stack` 매핑도
"No direct equivalent. Use the `Stack` layout instead"로만 되어 있고, `Stack`은 항상 `app/` 파일
트리에 종속되도록 설계되어 있다).

이와 별개로 다음 불만이 있었다:
- expo-router의 DX가 만족스럽지 않다.
- 웹(`apps/waylog-web`, React Router 7)은 선언적으로 라우트 트리를 코드로 구성하는데, 앱은 파일
  기반 규약이라 두 코드베이스의 라우팅 사고방식이 다르다.
- 중첩 라우트(스택 안에 탭, 탭 밖에 숨은 화면 등)의 자유도가 UX 요구사항상 필요하다.

이번 기회에 `expo-router`를 완전히 걷어내고 `@react-navigation`으로 전환한다.

## 목표

- `app/` 디렉토리(파일 기반 라우팅) 제거, 네비게이터 트리를 코드로 명시적으로 선언
- 웹 `routes.ts`와 동일한 패턴으로 라우트를 중앙에서 상수/타입으로 관리
- 기존 화면 전환 UX(애니메이션, 탭 제스처, 뒤로가기 동작)를 그대로 유지
- 딥링크(카카오 로그인 콜백, 여행 초대 링크) 유지
- 폼 퍼널의 로컬 중첩 스택 패턴은 그대로 재사용 가능해야 함(오히려 이번 전환의 핵심 동기)

## 범위

전체 전환. `apps/waylog-app/app/` 하위 28개 라우트 파일, `expo-router` API를 쓰는 40개 파일
(`useRouter`, `useLocalSearchParams`, `usePathname`, `<Link>` 등) 전부 대상.

## 현재 라우트 트리 (조사 결과)

```
app/_layout.tsx                              — RootLayout, Stack 1개(index)만 명시 등록, 나머진 파일 자동 등록
app/login.tsx                                — Redirect 가드
app/(tabs)/_layout.tsx                       — Tabs: 내 여행(index)/피드/탐색/프로필
app/(tabs)/index.tsx, feed.tsx, explorer.tsx, profile.tsx
app/explorer.tsx, app/explorer/[placeId].tsx, top-visited.tsx, recent-hot.tsx, most-saved.tsx
app/post/new.tsx, app/post/[postId].tsx
app/u/[userId].tsx
app/trip/new.tsx
app/trip/invite/[shareLink].tsx
app/trip/[tripId]/_layout.tsx                — Stack (headerShown: false)
app/trip/[tripId]/(detail)/_layout.tsx       — Tabs: 정보/장소/계획/정산/사진 (backBehavior: none)
                                                 + checklist (href: null — 탭바엔 안 보이지만 라우트로 존재)
app/trip/[tripId]/(detail)/{index,place,route,expense,photo,checklist}.tsx
app/trip/[tripId]/memo/[memoId].tsx, memo/[memoId]/edit.tsx
app/trip/[tripId]/transport/new.tsx, transport/[transportId].tsx
```

`RouterTabNavigation`(`src/shared/components/tab-navigation/RouterTabNavigation.tsx`)은 이미
`@react-navigation/bottom-tabs`의 `BottomTabBarProps`를 표준 인터페이스로 받는 커스텀 tabBar
렌더러라 **변경 없이 재사용 가능**.

API 사용 빈도 (`app/`, `src/` 전체, 전수 조사로 확정한 실측치):

| API | 횟수 |
|---|---|
| `router.push` | 28 |
| `useLocalSearchParams` | 13 (호출 지점 기준) |
| `router.back` | 12 |
| `router.replace` | 6 |
| `useFocusEffect` | 4 (react-navigation과 동일 API, 무변경) |
| `usePathname` | 2 (`src/features/auth/auth-redirect.tsx` 한 파일) |
| `router.setParams` | 1 (`src/shared/hooks/useQueryParamState.ts`) |
| `<Redirect>` | 5 |
| `<Link href="...">` | 0 (매핑 대상 아님) |

## 신규 구조

### 루트 트리

```
NavigationContainer (linking 포함)
└─ RootStack (createNativeStackNavigator)
   ├─ Login
   ├─ Home                — BottomTabs (내 여행 / 피드 / 탐색 / 프로필)
   ├─ TripDetail           — 아래 "여행 상세 하위 트리" 참조
   ├─ TripDetailChecklist  — 탭 밖, 스택으로 push (기존 href:null 대체)
   ├─ TripMemoDetail, TripMemoEdit
   ├─ TripCreate, TripInvite
   ├─ ExplorerDetail, ExplorerTopVisited, ExplorerRecentHot, ExplorerMostSaved
   ├─ PostNew, PostDetail
   ├─ UserProfile
   └─ TransportNew, TransportDetail
```

### 여행 상세 하위 트리 (스택 안에 탭 중첩 — 기존과 동일 구조)

```
TripDetail (Stack, headerShown: false)
└─ TripDetailTabs (BottomTabs: 정보/장소/계획/정산/사진, backBehavior: none)
```

`checklist`는 탭 스크린 목록에서 제외하고 `RootStack`의 `TripDetailChecklist`로 이전한다
(기존 `href: null`과 동일하게 "탭바엔 안 보이지만 진입 가능"을 스택 push로 재현).

## 타입 정의

```ts
// src/app/routes.ts

// location/category/explorer-view-mode 는 3개 탐색 랭킹 화면이 공유하는
// useQueryParamState 기반 필터·뷰모드 파라미터다.
type ExplorerFilterParams = {
  location?: string
  category?: string
  'explorer-view-mode'?: string
}

export type RootStackParamList = {
  Login: undefined
  Home: undefined
  TripDetail: { tripId: string; days?: string; 'route-id'?: string; 'info-tab'?: string }
  TripDetailChecklist: { tripId: string }
  TripMemoDetail: { tripId: string; memoId: string }
  TripMemoEdit: { tripId: string; memoId: string }
  TripCreate: { step?: string }
  TripInvite: { shareLink: string }
  ExplorerDetail: { placeId: string; tab?: string }
  ExplorerTopVisited: ExplorerFilterParams
  ExplorerRecentHot: ExplorerFilterParams
  ExplorerMostSaved: ExplorerFilterParams
  PostNew: { tripId?: string }
  PostDetail: { postId: string }
  UserProfile: { userId: string; tab?: string }
  TransportNew: { tripId: string }
  TransportDetail: { tripId: string; transportId: string }
}

export type HomeTabParamList = {
  MyTrips: undefined
  Feed: undefined
  Explorer: undefined
  Profile: undefined
}

export type TripDetailTabParamList = {
  TripInfo: { tripId: string; 'info-tab'?: string }
  TripPlace: { tripId: string }
  TripRoute: { tripId: string; days?: string; 'route-id'?: string }
  TripExpense: { tripId: string }
  TripPhoto: { tripId: string }
}
```

`TripDetail`(스택)이 받는 `days`/`route-id`/`info-tab`은 화면 진입 시 초기값 전달용으로만
쓰고(딥링크·`navigate('TripDetail', { tripId, days })` 식 초기 포커스 지정), 탭이 뜬 뒤의
실제 상태 갱신은 각 탭 스크린 자신의 `TripDetailTabParamList` 파라미터(`useAppNavigation`을
`TripDetailTabParamList`용으로도 쓸 수 있도록 탭 전용 오버로드 필요 — 아래 훅 계층 참조)를
`setParams`하는 방식으로 탭 스크린 스코프에서 처리한다. 즉 `TripRoute` 탭 안의
`TripRoutesContent`는 `TripDetail`이 아니라 `TripRoute`의 params를 읽고 쓴다.

### 탭 내부에서 스택 레벨 화면으로 이동 — `useAppNavigation`을 그대로 쓴다

`TripDetail`의 `TripInfo` 탭 안에서 렌더되는 여러 컴포넌트(`UpcomingTransportSection`,
`TripMemo`, `TripPinnedMemos`, `TripTransportList`, `TripPostCreateCard`,
`TripBasicInfoContent`의 교통편 섹션)는 `TransportDetail`/`TripMemoDetail`/`TransportNew`/
`PostNew`처럼 탭 트리 **밖**(`RootStackParamList`)에 있는 화면으로 이동한다. `@react-navigation`은
자식 네비게이터(탭) 안에서도 `useNavigation()`이 타입 파라미터로 지정한 부모 스택의 라우트로
바로 `navigate`할 수 있으므로, 이 컴포넌트들은 `useTripDetailTabNavigation`이 아니라
**`useAppNavigation`**(스택 스코프)을 그대로 쓴다. 반대로 `TripDetailHeader`(탭 트리 밖,
`TripDetail` 스택 스크린이 직접 렌더)도 `useAppRoute<'TripDetail'>()`로 `tripId`를 읽고
`useAppNavigation().goBack()`으로 뒤로가기 한다 — 탭 스코프 훅과는 무관하다.

정리하면 "이 컴포넌트가 최종적으로 어느 파라미터 리스트의 화면으로 이동/조회하는가"가 기준이지
"어디서 렌더되는가"가 기준이 아니다. `TripRoutesContent`(경로 탭 내부 상태)만 자기 탭 자신의
params를 쓰므로 `useTripDetailTabNavigation`/`useTripDetailTabRoute`가 필요하고, 나머지는 모두
`useAppNavigation`/`useAppRoute`로 충분하다.

## 네비게이션 훅 계층

40개 소비 파일이 `@react-navigation`을 직접 import하지 않고 이 계층을 통해서만 접근한다.

```ts
// src/shared/hooks/useAppNavigation.ts
export function useAppNavigation<T extends keyof RootStackParamList = keyof RootStackParamList>() {
  return useNavigation<NativeStackNavigationProp<RootStackParamList, T>>()
}

export function useAppRoute<T extends keyof RootStackParamList>() {
  return useRoute<RouteProp<RootStackParamList, T>>()
}

// TripDetail 탭(정보/장소/계획/정산/사진) 내부에서만 쓰는 탭 스코프 전용 오버로드.
// RootStackParamList 훅과 이름이 겹치지 않게 별도로 둔다 — 탭 내부 컴포넌트가 실수로
// 스택 레벨 네비게이터를 잡아 상위 화면으로 잘못 navigate 하는 걸 타입으로 막는다.
export function useTripDetailTabNavigation<T extends keyof TripDetailTabParamList = keyof TripDetailTabParamList>() {
  return useNavigation<BottomTabNavigationProp<TripDetailTabParamList, T>>()
}

export function useTripDetailTabRoute<T extends keyof TripDetailTabParamList>() {
  return useRoute<RouteProp<TripDetailTabParamList, T>>()
}
```

### API 매핑

| 기존 (expo-router) | 대체 (@react-navigation) |
|---|---|
| `useRouter().push('trip/[tripId]', { tripId })` | `useAppNavigation().navigate('TripDetail', { tripId })` |
| `useRouter().back()` | `useAppNavigation().goBack()` |
| `useRouter().replace(...)` | `useAppNavigation().replace(...)` |
| `useRouter().setParams(...)` | `useAppNavigation().setParams(...)` |
| `useLocalSearchParams<{tripId: string}>()` | `useAppRoute<'TripDetail'>().params` |
| `usePathname()` | `src/features/auth/auth-redirect.tsx`의 `LoginRedirect`/`useLoginRedirect` 2곳에서만 사용. `useAppRoute().name` + `.params`로 "돌아갈 화면"을 구성하는 지역 로직으로 대체 (조사 결과 실사용 2건, 설계 초안의 "3곳"은 부정확했음) |
| `<Redirect href="..." />` (expo-router, 선언적) | 마운트 시 `navigate(..., { replace: true })`를 호출하는 소형 컴포넌트로 직접 구현 (react-navigation엔 선언적 Redirect 없음) |

`<Link href="...">`는 코드베이스 전수 조사 결과 실사용 0건이라 매핑 대상에서 제외한다.

### `useQueryParamState` — route params 기반으로 재구현, 소비처 9곳은 시그니처 무변경

`src/shared/hooks/useQueryParamState.ts`는 URL 쿼리 파라미터에 화면 내부 UI 상태(탭 선택,
필터, 위저드 스텝 등)를 영속화해 화면 재진입·딥링크·뒤로가기에도 값이 살아남게 하는 범용
훅이다. `useLocalSearchParams()` + `router.setParams()`로 구현되어 있고, 9곳에서 소비한다:

| 소비 파일 | 키 | 해당 라우트 |
|---|---|---|
| `src/features/explorer/PlaceDetailScreen.tsx` | `tab` | `ExplorerDetail` |
| `src/features/explorer/explorer-filters/useExplorerFilterParams.ts` | `location`, `category` | `ExplorerTopVisited`/`ExplorerRecentHot`/`ExplorerMostSaved`(모두 소비) |
| `src/features/explorer/explorer-view/useExplorerViewMode.ts` | `explorer-view-mode` | 위와 동일 화면들 공용 |
| `src/features/user-profile/UserProfileScreen.tsx` | `tab` | `UserProfile` |
| `src/features/trip/trip-route/useActiveTripDay.ts` | `days` | `TripDetail`(TripRoute 탭) |
| `src/features/trip/trip-route/TripRoutesContent.tsx` | `route-id` | `TripDetail`(TripRoute 탭) |
| `src/features/trip/trip-create/TripCreateScreen.tsx` | `step` | `TripCreate` |
| `src/features/trip/trip-basic-info/TripBasicInfoContent.tsx` | `info-tab` | `TripDetail`(TripInfo 탭) |

**"URL 파람처럼 컨텍스트만 유지"하면 되고 웹과 시그니처를 맞출 필요는 없다는 방향에 따라**,
`useState`가 아니라 **route params**로 통일한다. `useState`는 컴포넌트가 언마운트-재마운트되면
초기화되지만, route params는 `@react-navigation`이 네비게이션 상태의 일부로 들고 있어 화면을
벗어났다 돌아와도, 딥링크로 특정 값을 지정해 열어도 유지된다 — 지금 `router.setParams` 기반
구현과 동일한 특성이다.

**구현**: 위 표의 각 라우트(`RootStackParamList`)에 해당 키를 optional 파라미터로 추가하고,
`useQueryParamState`를 내부적으로 `useAppNavigation().setParams()` + `useAppRoute().params`로
재구현한다. 시그니처(`useQueryParamState<T>(key, options): [T, Dispatch<T>]`)는 그대로 유지해
9곳의 호출부 코드는 무변경으로 둔다. `router.setParams`의 다음 렌더 반영 지연을 우회하던
`optimisticValue` state는, `navigation.setParams`도 동일하게 비동기 반영될 수 있으므로 **그대로
유지**한다(제거하지 않음).

전수 조사로 초기 설계안과 달라진 점: `PostNew`는 `undefined`가 아니라
`TripPostCreateCard.tsx`가 `router.push({ pathname: '/post/new', params: { tripId } })`로
넘기는 `tripId`를 받는다. 나머지 옵셔널 키들은 모두 `useQueryParamState` 소비처 조사로 확정한
것이며, 위 "타입 정의" 코드가 이미 최종본이다.

## 딥링크

```ts
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['waylog://', 'https://waylog.me', 'https://www.waylog.me'],
  config: {
    screens: {
      TripInvite: 'trip/invite/:shareLink',
    },
  },
}
```

카카오 로그인 콜백(`waylog://auth/callback`)은 화면 전환이 아니라 Supabase 인증 SDK가 소비하는
리스너이므로 `linking.config.screens`에 포함하지 않는다. 기존과 동일하게 `expo-linking`의 URL
이벤트 리스너로 처리하며 이 부분은 변경하지 않는다.

## 폼 퍼널 (전환 동기가 된 코드)

`PostFormFunnel`, `TransportFormFunnel`은 `@react-navigation/native-stack`을 로컬로 인스턴스화하는
현재 방식을 그대로 유지한다. `EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK` 환경변수와 그 검사 자체가
사라지므로, 이 두 파일은 실질적으로 수정 없이 동작한다.

## `useTripId` — 스코프별로 분리

`src/features/trip/useTripId.ts`는 `useLocalSearchParams<{ tripId?: string }>()`로 전역
파라미터를 읽는 헬퍼로, `TripDetail` 하위 탭 5개(`index`/`place`/`route`/`expense`/`photo`,
`checklist`는 탭 밖으로 이동 예정)와 `TransportDetailScreen`(별도 스택 스크린)이 함께 쓴다.

새 구조에서 이 둘은 서로 다른 파라미터 리스트에 속한다 — 탭 5개는 `TripDetailTabParamList`,
`TransportDetailScreen`은 `RootStackParamList`의 `TransportDetail`. 하나의 훅으로 통일할 수
없으므로 스코프별로 나눈다:

- `useTripDetailTabTripId()` (`src/features/trip/useTripId.ts`에 함께 정의) —
  `useTripDetailTabRoute().params.tripId`를 반환. `TripDetail` 탭 5개(`checklist` 이전 대상
  `TripDetailChecklist` 포함하지 않음)가 쓴다.
- `TransportDetailScreen`은 `useAppRoute<'TransportDetail'>().params.tripId`를 직접 쓴다
  (별도 헬퍼 없이 인라인, 소비처가 1곳뿐이라 헬퍼로 뺄 이유가 없다).
- `TripDetailChecklist`(`RootStackParamList`)는 `useAppRoute<'TripDetailChecklist'>().params.tripId`를
  직접 쓴다(마찬가지로 소비처 1곳).

기존 `useTripId`의 주석("한 번 더 렌더되므로 tripId를 잃는다")이 설명하던 expo-router 특유의
전역 파라미터 렌더 타이밍 문제는, `@react-navigation`에서 각 스크린이 자기 자신의 route
params를 직접 받는 구조로 바뀌면서 애초에 해당하지 않게 된다 — 우회 로직 자체가 불필요해진다.

## 마이그레이션 순서

독립적으로 빌드 검증 가능한 단위로 나눈다. 각 단계 종료 시 `pnpm ios`로 실행 확인.

1. `src/app/routes.ts` 작성 (타입 + `AppRoute` 상수) — 기존 코드에 영향 없음, 격리 가능
2. `useAppNavigation`/`useAppRoute` 훅 작성
3. 루트: `app/_layout.tsx` → `RootNavigator.tsx`(`NavigationContainer` + `RootStack` 뼈대). `Login` 화면 하나만 연결해 빌드 검증
4. `Home` 탭 트리(4탭) 연결 + 해당 화면들 API 치환
5. `TripDetail` 하위 트리(스택+탭 중첩, 가장 복잡) 연결 + 해당 화면들 API 치환
6. 나머지 평면 라우트(explorer, post, u, transport, memo, trip/new, trip/invite) 순차 연결
7. `linking` config 연결, 카카오 로그인 콜백 회귀 확인
8. `expo-router` 계열 의존성 제거, `app/` 디렉토리 삭제, `app.config.ts`의 `expo-router` 플러그인 제거.
   `index.ts`는 현재 `import 'expo-router/entry'` 한 줄이므로 `registerRootComponent(RootNavigator)`
   (from `expo`)로 교체
9. `EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK` 제거

## 리스크

- `TripDetail`의 스택-안-탭 중첩 애니메이션/제스처가 expo-router와 동일하게 보이는지. 둘 다
  `@react-navigation` 위에서 동작하므로 이론상 동일해야 하나 실기기 확인 필요.
- `checklist`를 탭 밖 스택으로 옮겼을 때 뒤로가기 동작이 기존과 같은지.
- `useQueryParamState` route params 재구현이 `TripDetail`처럼 스택 스크린과 그 안의 탭 스크린이
  같은 개념적 상태(`route-id` 등)를 서로 다른 파라미터 리스트(`RootStackParamList` vs
  `TripDetailTabParamList`)로 나눠 갖는 구조라, 초기값 전달(스택)과 상태 갱신(탭)의 경계가
  헷갈리기 쉽다 — 구현 시 "누가 읽고 누가 쓰는지"를 파일별로 명확히 주석해야 한다.
- 화면별 세부 옵션(예: 루트 `index` 화면의 `animation: 'none'`, 각 `Tabs.Screen`의 `tabBarIcon`/`title`)은
  트리를 옮겨 적는 과정에서 하나씩 대조하며 빠짐없이 이전해야 한다 — 파일 트리를 그대로 복사하는 것이
  아니므로 놓치기 쉽다.

## 테스트

- UI 컴포넌트(`*.tsx`)이므로 컴포넌트 테스트 인프라 없음. 빌드와 실기기 확인으로 검증한다
  (`docs/testing.md`, `CLAUDE.md` 방침과 동일).
- 순수 로직으로 분리 가능한 부분(예: `useQueryParamState`의 옵션 파싱, `toLoginHref`류 URL/파라미터
  조합 로직)이 있다면 `*.utils.ts`로 분리해 단위 테스트.
