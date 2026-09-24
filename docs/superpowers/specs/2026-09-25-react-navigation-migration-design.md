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

API 사용 빈도 (`app/`, `src/` 전체):

| API | 횟수 |
|---|---|
| `useRouter` | 70 |
| `router.push` | 28 |
| `useLocalSearchParams` | 26 |
| `router.back` | 12 |
| `router.replace` | 6 |
| `useFocusEffect` | 4 (react-navigation과 동일 API, 무변경) |
| `usePathname` | 3 |
| `router.setParams` | 2 |

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
export type RootStackParamList = {
  Login: undefined
  Home: undefined
  TripDetail: { tripId: string }
  TripDetailChecklist: { tripId: string }
  TripMemoDetail: { tripId: string; memoId: string }
  TripMemoEdit: { tripId: string; memoId: string }
  TripCreate: undefined
  TripInvite: { shareLink: string }
  ExplorerDetail: { placeId: string }
  ExplorerTopVisited: undefined
  ExplorerRecentHot: undefined
  ExplorerMostSaved: undefined
  PostNew: undefined
  PostDetail: { postId: string }
  UserProfile: { userId: string }
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
  TripInfo: { tripId: string }
  TripPlace: { tripId: string }
  TripRoute: { tripId: string }
  TripExpense: { tripId: string }
  TripPhoto: { tripId: string }
}
```

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
```

### API 매핑

| 기존 (expo-router) | 대체 (@react-navigation) |
|---|---|
| `useRouter().push('trip/[tripId]', { tripId })` | `useAppNavigation().navigate('TripDetail', { tripId })` |
| `useRouter().back()` | `useAppNavigation().goBack()` |
| `useRouter().replace(...)` | `useAppNavigation().replace(...)` |
| `useRouter().setParams(...)` | `useAppNavigation().setParams(...)` |
| `useLocalSearchParams<{tripId: string}>()` | `useAppRoute<'TripDetail'>().params` |
| `usePathname()` | 화면별로 `useAppRoute().name` 또는 `useNavigationState()`로 개별 대응 (3곳) |
| `<Link href="...">` (expo-router) | `<Link>` (`@react-navigation/native`), `to={{ screen, params }}` |
| `<Redirect href="..." />` (expo-router, 선언적) | 마운트 시 `navigate(..., { replace: true })`를 호출하는 소형 컴포넌트로 직접 구현 (react-navigation엔 선언적 Redirect 없음) |

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
- `usePathname` 3곳은 개별 코드를 봐야 정확한 대체 방법이 나온다(플랜 단계에서 확정).
- 화면별 세부 옵션(예: 루트 `index` 화면의 `animation: 'none'`, 각 `Tabs.Screen`의 `tabBarIcon`/`title`)은
  트리를 옮겨 적는 과정에서 하나씩 대조하며 빠짐없이 이전해야 한다 — 파일 트리를 그대로 복사하는 것이
  아니므로 놓치기 쉽다.

## 테스트

- UI 컴포넌트(`*.tsx`)이므로 컴포넌트 테스트 인프라 없음. 빌드와 실기기 확인으로 검증한다
  (`docs/testing.md`, `CLAUDE.md` 방침과 동일).
- 순수 로직으로 분리 가능한 부분(예: `usePathname` 대체 로직)이 있다면 `*.utils.ts`로 분리해 단위 테스트.
