# expo-router → @react-navigation 전환 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `apps/waylog-app`의 파일 기반 라우팅(`expo-router`)을 코드로 명시 선언하는
`@react-navigation` 네비게이터 트리로 전환한다.

**Architecture:** 루트 `NativeStack`(`RootStack`) 안에 `Login`, `Home`(4탭 `BottomTabs`),
`TripDetail`(자체 스택 안에 5탭 `BottomTabs` 중첩), 그리고 나머지 평면 라우트들을 스크린으로
등록한다. 모든 소비 코드는 `useAppNavigation`/`useAppRoute`(스택 스코프) 또는
`useTripDetailTabNavigation`/`useTripDetailTabRoute`(TripDetail 탭 스코프) 훅을 통해서만
네비게이션에 접근한다.

**Tech Stack:** `@react-navigation/native` ^7.4.1, `@react-navigation/native-stack` ^7.19.2,
`@react-navigation/bottom-tabs` ^7.19.2, React Native 0.86.3, Expo SDK 57, TypeScript 6.0.

**Spec:** `docs/superpowers/specs/2026-09-25-react-navigation-migration-design.md`

## Global Constraints

- 화면 전환 UX(애니메이션, 탭 제스처, 뒤로가기 동작)를 기존과 동일하게 유지한다.
- `RouterTabNavigation`(`src/shared/components/tab-navigation/RouterTabNavigation.tsx`)은
  수정하지 않는다 — 이미 `BottomTabBarProps` 표준 인터페이스라 그대로 재사용한다.
- 40개 이상의 소비 파일은 `@react-navigation`을 직접 import하지 않고 반드시
  `useAppNavigation`/`useAppRoute`/`useTripDetailTabNavigation`/`useTripDetailTabRoute`를
  통해서만 네비게이션에 접근한다.
- `PostFormFunnel`, `TransportFormFunnel`의 로컬 `createNativeStackNavigator()` 인스턴스는
  건드리지 않는다 — 이번 전환으로 이미 정상 동작한다.
- 각 태스크 종료 시 `pnpm --filter waylog-app exec tsc --noEmit`으로 타입 검증하고,
  트리 구성이 바뀌는 태스크(3, 4, 5, 6, 7, 9)는 추가로 `pnpm ios`로 실기기/시뮬레이터 확인한다.
- UI 컴포넌트(`*.tsx`)에는 컴포넌트 테스트 인프라가 없다 — 순수 로직만 `*.utils.ts`로 분리해
  단위 테스트하고, 화면 자체는 빌드와 실기기 확인으로 검증한다(`CLAUDE.md` 방침).
- 커밋은 목적 단위로 분리한다 — 하나의 태스크가 여러 목적(예: 라우트 이전 + 무관한 정리)을
  섞지 않는다.

## Review Focus

- **`TripDetail` 탭 내부에서 `useAppNavigation()`(스택 스코프)을 잘못 써서 상위 스택 타입으로
  탭 화면을 `navigate` 하려 하는 경우** — 타입 에러가 나야 정상이지만, `as any` 캐스팅으로
  우회하면 런타임에 존재하지 않는 라우트로 navigate를 시도해 크래시한다. 탭 스코프 파일은 반드시
  `useTripDetailTabNavigation`을 쓰는지 태스크 5에서 확인한다.
- **`useQueryParamState` 재구현 후 낙관적 업데이트가 실제로 동작하는지** — `navigation.setParams`가
  다음 렌더까지 반영이 늦으면, `optimisticValue`를 제거했을 경우 필터/탭 전환이 한 프레임
  깜빡이거나 이전 값으로 잠깐 되돌아간다. 태스크 8에서 실기기로 직접 탭을 빠르게 전환해 확인한다.
- **`checklist`를 탭 밖 스택 스크린(`TripDetailChecklist`)으로 옮긴 뒤 뒤로가기 동작** —
  기존엔 `href: null`로 탭 트리 안에 숨어있어 뒤로가기 시 이전 탭으로 돌아갔을 가능성이 있는데,
  스택으로 옮기면 뒤로가기가 `TripDetail` 자체로 나갈 수 있다. 태스크 6에서 실제로 진입 경로와
  뒤로가기를 왕복 확인한다.
- **딥링크로 앱이 완전히 종료된 상태(cold start)에서 열렸을 때 `TripInvite`로 바로
  진입되는지** — `linking` config는 앱이 이미 떠 있을 때와 cold start일 때 동작이 달라질 수
  있다. 태스크 9에서 두 경우를 모두 확인한다.
- **`<Redirect>` 5곳을 명령형 컴포넌트로 바꾼 뒤, 조건이 매 렌더마다 재평가돼 무한 루프에
  빠지지 않는지** — `useEffect`로 `navigate`를 감싸지 않고 렌더 중에 직접 호출하면 리액트가
  에러를 던지거나 무한 재귀할 수 있다. 태스크 3, 6에서 각 `<Redirect>` 대체 컴포넌트를 만들 때
  `useEffect` 의존성 배열을 구체적인 값(경로 문자열/불리언)으로 좁혀 확인한다.

---

## Task 1: `routes.ts` 타입과 상수 작성

**Files:**
- Create: `apps/waylog-app/src/app/routes.ts`

**Interfaces:**
- Produces: `RootStackParamList`, `HomeTabParamList`, `TripDetailTabParamList` 타입들.
  이후 모든 태스크가 이 타입들을 import해서 쓴다.

- [ ] **Step 1: 타입 파일 작성**

```ts
// apps/waylog-app/src/app/routes.ts

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

- [ ] **Step 2: 타입 검증**

Run: `cd apps/waylog-app && pnpm exec tsc --noEmit`
Expected: 새 파일 자체는 에러 없음 (아직 아무도 import하지 않으므로 기존 코드에 영향 없음)

- [ ] **Step 3: Commit**

```bash
git add apps/waylog-app/src/app/routes.ts
git commit -m "$(cat <<'EOF'
feat(앱): react-navigation 라우트 파라미터 타입을 정의한다

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: 네비게이션 훅 계층 작성

**Files:**
- Create: `apps/waylog-app/src/shared/hooks/useAppNavigation.ts`

**Interfaces:**
- Consumes: `RootStackParamList`, `TripDetailTabParamList` (Task 1)
- Produces: `useAppNavigation<T>()`, `useAppRoute<T>()`, `useTripDetailTabNavigation<T>()`,
  `useTripDetailTabRoute<T>()`. 이후 모든 화면 컴포넌트가 이 4개 훅만으로 네비게이션에 접근한다.

- [ ] **Step 1: 훅 파일 작성**

```ts
// apps/waylog-app/src/shared/hooks/useAppNavigation.ts
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import type { RootStackParamList, TripDetailTabParamList } from '../../app/routes'

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

- [ ] **Step 2: 타입 검증**

Run: `cd apps/waylog-app && pnpm exec tsc --noEmit`
Expected: 에러 없음 (아직 아무도 import하지 않음)

- [ ] **Step 3: Commit**

```bash
git add apps/waylog-app/src/shared/hooks/useAppNavigation.ts
git commit -m "$(cat <<'EOF'
feat(앱): react-navigation 훅 계층을 추가한다

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: 로그인 화면과 인증 리다이렉트 헬퍼 이전

**Files:**
- Create: `apps/waylog-app/src/features/auth/LoginRoute.tsx`
- Modify: `apps/waylog-app/src/features/auth/auth-redirect.tsx` (전체 재작성)

**Interfaces:**
- Consumes: `useAppNavigation`, `useAppRoute` (Task 2)
- Produces: `LoginRoute`(스크린 컴포넌트), `useReturnTo()`, `useLoginRedirect()`,
  `RequireAuthRedirect`(컴포넌트, 기존 `LoginRedirect`를 대체). 이후 Task 4, 6이
  `RequireAuthRedirect`를 `fallback`으로 소비한다.

**배경**: 기존 `app/login.tsx`(`LoginRoute`)와 `src/features/auth/auth-redirect.tsx`
(`LoginRedirect`, `useLoginRedirect`, `useReturnTo`)는 `usePathname()`/`useLocalSearchParams()`로
"돌아갈 경로"를 문자열로 들고 다녔다. `@react-navigation`에는 파일 경로 문자열이 없으므로,
"돌아갈 경로"를 `{ screen: keyof RootStackParamList; params?: ... }` 형태의 객체로 바꾼다.

- [ ] **Step 1: `auth-redirect.tsx`를 route 객체 기반으로 재작성**

```tsx
// apps/waylog-app/src/features/auth/auth-redirect.tsx
import { useEffect } from 'react'
import { useAppNavigation, useAppRoute } from '../../shared/hooks/useAppNavigation'
import type { RootStackParamList } from '../../app/routes'

type ReturnTo = { screen: keyof RootStackParamList; params?: Record<string, unknown> }

const HOME: ReturnTo = { screen: 'Home' }

/**
 * 인증이 필요한 화면의 fallback. 돌아올 자리를 들고 로그인으로 보낸다.
 * expo-router 시절엔 `usePathname()`으로 현재 URL을 얻었지만, react-navigation엔
 * 파일 경로 개념이 없어 호출부가 명시적으로 `returnTo`를 넘긴다.
 */
export function RequireAuthRedirect({ returnTo = HOME }: { returnTo?: ReturnTo }) {
  const navigation = useAppNavigation()

  useEffect(() => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login', params: { returnTo } }],
    })
    // returnTo 는 호출부에서 인라인 객체로 넘어오는 경우가 많아 매 렌더 참조가 바뀔 수 있다.
    // screen 값만 실제로 의미 있는 변경이므로 그것만 의존성으로 좁힌다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, returnTo.screen])

  return null
}

/** 세션 만료를 감지한 쪽이 명령형으로 호출한다. */
export function useLoginRedirect() {
  const navigation = useAppNavigation()
  const route = useAppRoute()

  return () => {
    const returnTo: ReturnTo = { screen: route.name, params: route.params as Record<string, unknown> }
    navigation.reset({ index: 0, routes: [{ name: 'Login', params: { returnTo } }] })
  }
}
```

주의: `RootStackParamList.Login`에 `returnTo?: ReturnTo` 필드가 필요하다 — Task 1에서 아직
추가하지 않았으므로 이 스텝에서 함께 보정한다.

- [ ] **Step 2: `Login` 파라미터 타입 보정**

`apps/waylog-app/src/app/routes.ts`의 `RootStackParamList.Login`을 수정:

```ts
// 변경 전: Login: undefined
// 변경 후:
Login: { returnTo?: { screen: keyof RootStackParamList; params?: Record<string, unknown> } }
```

- [ ] **Step 3: `LoginRoute` 스크린 컴포넌트 작성**

```tsx
// apps/waylog-app/src/features/auth/LoginRoute.tsx
import { useEffect } from 'react'
import { useAuth } from '@waylog/domains/clients'
import { useAppNavigation, useAppRoute } from '../../shared/hooks/useAppNavigation'
import { LoginScreen } from './LoginScreen'

export function LoginRoute() {
  const { data: auth } = useAuth({ required: false })
  const navigation = useAppNavigation()
  const { params } = useAppRoute<'Login'>()
  const returnTo = params?.returnTo ?? { screen: 'Home' as const }

  useEffect(() => {
    if (auth == null) return
    navigation.reset({
      index: 0,
      routes: [{ name: returnTo.screen, params: returnTo.params } as never],
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth, navigation, returnTo.screen])

  if (auth != null) return null

  return <LoginScreen />
}
```

기존 `app/login.tsx`는 `<Redirect href={returnTo} />`로 렌더 중 즉시 리다이렉트했지만, 여기서는
`useEffect`로 감싼다 — Review Focus에서 짚은 "렌더 중 navigate 호출로 인한 리액트 에러"를
피하기 위함이다.

- [ ] **Step 4: 타입 검증**

Run: `cd apps/waylog-app && pnpm exec tsc --noEmit`
Expected: `app/login.tsx`와 기존 `auth-redirect.tsx` 소비처(아직 `LoginRedirect`/`useReturnTo`를
import하는 파일들)에서 에러가 날 수 있다 — 이 태스크에서는 무시하고 다음 태스크들에서 하나씩
정리한다(Task 4, 6에서 `fallback={<LoginRedirect />}` 전부를 `fallback={<RequireAuthRedirect />}`로
교체). 지금은 `auth-redirect.tsx` 자체와 `LoginRoute.tsx`에 새로 생긴 에러만 없으면 된다.

- [ ] **Step 5: Commit**

```bash
git add apps/waylog-app/src/features/auth/LoginRoute.tsx apps/waylog-app/src/features/auth/auth-redirect.tsx apps/waylog-app/src/app/routes.ts
git commit -m "$(cat <<'EOF'
feat(앱): 로그인 리다이렉트를 route 객체 기반으로 재작성한다

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: 루트 네비게이터 뼈대 + Home 탭 트리 연결

**Files:**
- Create: `apps/waylog-app/src/app/RootNavigator.tsx`
- Create: `apps/waylog-app/src/app/HomeTabs.tsx`
- Modify: `apps/waylog-app/src/features/trip/trip-list/TripListScreen.tsx` (API 치환)
- Modify: `apps/waylog-app/src/features/post/FeedScreen.tsx` (API 치환)
- Modify: `apps/waylog-app/src/features/explorer/ExplorerCatalogScreen.tsx` 소비처 확인
  (탭용 `explorer.tsx`가 `useBottomTabBarHeight`를 직접 썼던 지점 — 아래 Step 3 참조)
- Modify: `apps/waylog-app/src/features/user-profile/UserProfileScreen.tsx` (API 치환 + `tab` params)
- Modify: `apps/waylog-app/index.ts` (진입점을 `RootNavigator`로 즉시 교체)
- Create: `apps/waylog-app/src/app/NotYetMigratedScreen.tsx` (임시 플레이스홀더)
- Not modified yet: `apps/waylog-app/app/*` 전체 (Task 7에서 삭제. 이 디렉토리는 이제 어디서도
  import되지 않지만, `expo-router` 패키지 자체는 아직 제거하지 않으므로 빌드에는 영향 없다.)

**Interfaces:**
- Consumes: `RootStackParamList`, `HomeTabParamList` (Task 1), `useAppNavigation`, `useAppRoute`
  (Task 2), `LoginRoute`, `RequireAuthRedirect` (Task 3)
- Produces: `RootNavigator`(최상위 컴포넌트, 이 태스크부터 실제 앱 진입점), `HomeTabs`(Task 5, 6이
  계속 `RootStack`에 스크린을 추가해 나갈 대상), `NotYetMigratedScreen`(Task 5, 6이 아직 연결
  안 한 라우트 자리를 채우는 임시 스크린 — 각 태스크가 끝날 때마다 실제 스크린으로 교체되며
  사라진다)

**배경**: `index.ts`를 이 태스크에서 즉시 `RootNavigator`로 바꾼다. 아직 옮기지 않은 화면
(`TripDetail`, `PostDetail` 등)은 `NotYetMigratedScreen`(라우트 이름만 보여주는 더미)으로
등록해 앱이 실제로 뜨고 `Home` 탭까지는 진짜로 동작하는 상태를 각 태스크 종료 시점마다 유지한다.
이렇게 하면 태스크마다 `pnpm ios`로 실제 화면을 확인할 수 있다 — "마지막에 한 번에 스위치"하는
대신, 각 태스크가 끝날 때 이미 최종 연결 상태의 일부다.

- [ ] **Step 1: `RootNavigator.tsx` 뼈대 작성 (Login, Home만 연결)**

```tsx
// apps/waylog-app/src/app/RootNavigator.tsx
import 'react-native-url-polyfill/auto'
import '../shared/polyfills'

import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthErrorBoundary, AuthStateSync } from '@waylog/domains/clients'
import { getActivedChatTripId } from '@waylog/domains/modules/trip-chat'
import { isTripChatPushData } from '@waylog/domains/modules/trip-chat/tripChatPush'
import { ExceptionError } from '@waylog/utility'
import * as Notifications from 'expo-notifications'
import { StatusBar } from 'expo-status-bar'
import { Suspense, type PropsWithChildren } from 'react'
import { ActivityIndicator, LogBox, StyleSheet, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { TamaguiProvider } from 'tamagui'
import { setupApi } from '../api-config'
import { LoginRoute } from '../features/auth/LoginRoute'
import { useLoginRedirect } from '../features/auth/auth-redirect'
import { useChatNotificationResponse } from '../features/trip/trip-chat/notification/useChatNotification'
import { useFlightStatusNotificationResponse } from '../features/trip/trip-transport/notification/useFlightStatusNotification'
import { OverlayProvider } from '../shared/hooks/useOverlay.context'
import { queryClient } from '../shared/query-client'
import { tamaguiConfig } from '../../tamagui.config'
import type { RootStackParamList } from './routes'
import { HomeTabs } from './HomeTabs'
import { NotYetMigratedScreen } from './NotYetMigratedScreen'

setupApi()
LogBox.ignoreLogs([ExceptionError.name])
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const tripMessage = notification.request.content.data
    const isActiveTripMessage = isTripChatPushData(tripMessage)
      && tripMessage.tripId === getActivedChatTripId()
    const shouldPresent = !isActiveTripMessage

    return {
      shouldShowBanner: shouldPresent,
      shouldShowList: shouldPresent,
      shouldPlaySound: shouldPresent,
      shouldSetBadge: false,
    }
  },
})

const RootStack = createNativeStackNavigator<RootStackParamList>()

function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator />
    </View>
  )
}

export function RootNavigator() {
  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <GestureHandlerRootView style={styles.fill}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <AuthStateSync />
            <OverlayProvider>
              <Suspense fallback={<Loading />}>
                <NotificationGateway />
                <AuthGateway>
                  <NavigationContainer>
                    <RootStack.Navigator screenOptions={{ headerShown: false }}>
                      <RootStack.Screen name="Home" component={HomeTabs} options={{ animation: 'none' }} />
                      <RootStack.Screen name="Login" component={LoginRoute} />
                      {/* Task 5, 6에서 하나씩 실제 스크린으로 교체되며 이 배열에서 빠진다. */}
                      <RootStack.Screen name="TripDetail" component={NotYetMigratedScreen} />
                      <RootStack.Screen name="TripDetailChecklist" component={NotYetMigratedScreen} />
                      <RootStack.Screen name="TripMemoDetail" component={NotYetMigratedScreen} />
                      <RootStack.Screen name="TripMemoEdit" component={NotYetMigratedScreen} />
                      <RootStack.Screen name="TripCreate" component={NotYetMigratedScreen} />
                      <RootStack.Screen name="TripInvite" component={NotYetMigratedScreen} />
                      <RootStack.Screen name="ExplorerDetail" component={NotYetMigratedScreen} />
                      <RootStack.Screen name="ExplorerTopVisited" component={NotYetMigratedScreen} />
                      <RootStack.Screen name="ExplorerRecentHot" component={NotYetMigratedScreen} />
                      <RootStack.Screen name="ExplorerMostSaved" component={NotYetMigratedScreen} />
                      <RootStack.Screen name="PostNew" component={NotYetMigratedScreen} />
                      <RootStack.Screen name="PostDetail" component={NotYetMigratedScreen} />
                      <RootStack.Screen name="UserProfile" component={NotYetMigratedScreen} />
                      <RootStack.Screen name="TransportNew" component={NotYetMigratedScreen} />
                      <RootStack.Screen name="TransportDetail" component={NotYetMigratedScreen} />
                    </RootStack.Navigator>
                  </NavigationContainer>
                </AuthGateway>
              </Suspense>
            </OverlayProvider>
            <StatusBar style="auto" />
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </TamaguiProvider>
  )
}

/** 세션이 만료되면 돌아올 자리를 들고 로그인으로 보낸다. */
function AuthGateway({ children }: PropsWithChildren) {
  const redirectToLogin = useLoginRedirect()

  return <AuthErrorBoundary onSessionExpired={redirectToLogin}>{children}</AuthErrorBoundary>
}

/** 알림 도메인별 응답 처리를 루트에서 함께 등록한다. */
function NotificationGateway() {
  useChatNotificationResponse()
  useFlightStatusNotificationResponse()
  return null
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fill: { flex: 1 },
})
```

주의: 기존 `app/_layout.tsx`는 `index`(=Home) 화면에만 `animation: 'none'`을 줬다 — 위 코드가
그 옵션을 `RootStack.Screen name="Home"`에 그대로 옮겼다. `useChatNotificationResponse`,
`useFlightStatusNotificationResponse`는 네비게이션과 무관한 로직이므로 내부에서 여전히
`router.push`를 쓰고 있을 수 있다 — Task 6에서 해당 파일들의 API를 치환한다.

- [ ] **Step 1.5: `NotYetMigratedScreen` 작성**

```tsx
// apps/waylog-app/src/app/NotYetMigratedScreen.tsx
import { useAppRoute } from '../shared/hooks/useAppNavigation'
import { Typography } from '../shared/components/design-system'
import { View, StyleSheet } from 'react-native'

/** Task 5, 6 진행 중 아직 실제 스크린으로 연결하지 않은 라우트의 임시 자리 표시. */
export function NotYetMigratedScreen() {
  const route = useAppRoute()
  return (
    <View style={styles.screen}>
      <Typography>{route.name} — 아직 연결되지 않음</Typography>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center' },
})
```

- [ ] **Step 2: `HomeTabs.tsx` 작성**

```tsx
// apps/waylog-app/src/app/HomeTabs.tsx
import { MaterialIcons } from '@expo/vector-icons'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { StyleSheet } from 'react-native'
import { AuthGuard } from '@waylog/domains/clients'
import { palette } from '../shared/config/tokens'
import { RequireAuthRedirect } from '../features/auth/auth-redirect'
import { TripListScreen } from '../features/trip/trip-list/TripListScreen'
import { FeedScreen } from '../features/post/FeedScreen'
import { ExplorerCatalogScreen } from '../features/explorer/ExplorerCatalogScreen'
import { UserProfileScreen } from '../features/user-profile/UserProfileScreen'
import { useAuth } from '@waylog/domains/clients'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import type { HomeTabParamList } from './routes'

const Tab = createBottomTabNavigator<HomeTabParamList>()

export function HomeTabs() {
  return (
    <Tab.Navigator
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.textSecondary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="MyTrips"
        options={{ title: '내 여행', tabBarIcon: ({ color, size }) => <MaterialIcons name="luggage" color={color} size={size} /> }}
      >
        {() => (
          <AuthGuard fallback={<RequireAuthRedirect />}>
            <TripListScreen />
          </AuthGuard>
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{ title: '피드', tabBarIcon: ({ color, size }) => <MaterialIcons name="dynamic-feed" color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Explorer"
        options={{ title: '탐색', tabBarIcon: ({ color, size }) => <MaterialIcons name="explore" color={color} size={size} /> }}
      >
        {() => <ExplorerTab />}
      </Tab.Screen>
      <Tab.Screen
        name="Profile"
        options={{ title: '프로필', tabBarIcon: ({ color, size }) => <MaterialIcons name="person-outline" color={color} size={size} /> }}
      >
        {() => (
          <AuthGuard fallback={<RequireAuthRedirect />}>
            <ProfileTab />
          </AuthGuard>
        )}
      </Tab.Screen>
    </Tab.Navigator>
  )
}

// 기존 app/(tabs)/explorer.tsx 가 하던 것 그대로 — 탭바 높이를 콘텐츠 바닥 여백으로 넘긴다.
function ExplorerTab() {
  const bottomTabBarHeight = useBottomTabBarHeight()
  return <ExplorerCatalogScreen bottomContentInset={bottomTabBarHeight} />
}

// 기존 app/(tabs)/profile.tsx 가 하던 것 그대로.
function ProfileTab() {
  const { data: auth } = useAuth()
  const bottomTabBarHeight = useBottomTabBarHeight()
  return <UserProfileScreen userId={auth.id} bottomContentInset={bottomTabBarHeight} />
}

const styles = StyleSheet.create({
  tabBar: { height: 84, paddingTop: 8, paddingBottom: 24 },
  tabLabel: { fontSize: 11, fontWeight: '700' },
})
```

주의: `useBottomTabBarHeight`는 이미 `@react-navigation/bottom-tabs`에서 직접 가져오는 것이
맞다 — 이건 탭 내부에서만 쓰는 표준 훅이라 애초에 `useAppNavigation` 계층으로 감쌀 필요가
없다(RootStackParamList/TripDetailTabParamList와 무관한 범용 API).

- [ ] **Step 2.5: `UserProfileScreen`의 `useQueryParamState` 임시 눈속임**

`UserProfileScreen.tsx`는 `useQueryParamState<ProfileTab>('tab', ...)`을 쓰는데, 이 훅은
내부적으로 `useLocalSearchParams`/`useRouter`(expo-router)를 호출한다. 이번 태스크에서
`index.ts`가 `RootNavigator`(`@react-navigation`의 `NavigationContainer`)로 완전히 바뀌면
expo-router의 `NavigationContainer`가 더는 마운트되지 않으므로, 이 훅을 그대로 두면
`Profile` 탭 진입 시 크래시한다.

`useQueryParamState`의 정식 재구현은 Task 8(전체 9개 소비처를 한 번에 route params로
통일)에서 하기로 계획했지만, `Profile` 탭 하나만은 이 태스크에서 앞당겨 처리해야 한다.
`UserProfileScreen.tsx`에서 이 호출 한 줄만 로컬 `useState`로 임시 대체한다(Task 8에서
`RootStackParamList.UserProfile.tab`을 쓰는 정식 구현으로 다시 교체):

```tsx
// 변경 전: const [currentTab, selectTab] = useQueryParamState<ProfileTab>('tab', { defaultValue: 'feed', parse: parseProfileTab })
// 변경 후 (Task 8에서 재교체 예정):
const [currentTab, selectTab] = useState<ProfileTab>('feed')
```

- [ ] **Step 2.6: `TripListScreen`, `FeedScreen` API 치환**

`TripListScreen.tsx`:

```tsx
// 변경 전:
// import { useRouter } from 'expo-router'
// const router = useRouter()
// const openTrip = (tripId: string) => router.push(`/trip/${tripId}`)
// const openTripCreation = () => router.push('/trip/new')

// 변경 후:
import { useAppNavigation } from '../../shared/hooks/useAppNavigation'
// ...
const navigation = useAppNavigation()
const openTrip = (tripId: string) => navigation.navigate('TripDetail', { tripId })
const openTripCreation = () => navigation.navigate('TripCreate', {})
```

`FeedScreen.tsx`(두 곳 — `FeedScreen`과 내부 `Contents` 컴포넌트 각각 자기 `useRouter()`를
가지고 있었다):

```tsx
// FeedScreen 함수 내부, 변경 전: const router = useRouter(); ... onPress={() => router.push('/post/new')}
// 변경 후:
const navigation = useAppNavigation()
// ...
onPress={() => navigation.navigate('PostNew', {})}

// Contents 함수 내부, 변경 전: const router = useRouter(); const openPost = (postId) => router.push(`/post/${postId}`)
// 변경 후:
const navigation = useAppNavigation()
const openPost = (postId: string) => navigation.navigate('PostDetail', { postId })
```

- [ ] **Step 3: `index.ts` 진입점 교체**

```ts
// apps/waylog-app/index.ts
// 변경 전: import 'expo-router/entry'
// 변경 후:
import { registerRootComponent } from 'expo'
import { RootNavigator } from './src/app/RootNavigator'

registerRootComponent(RootNavigator)
```

- [ ] **Step 4: 타입 검증**

Run: `cd apps/waylog-app && pnpm exec tsc --noEmit`
Expected: 에러 없음. `app/` 디렉토리는 더 이상 어디서도 import되지 않지만 아직 삭제하지
않았으므로 `tsc`가 그 파일들도 같이 검사해 기존 expo-router 관련 타입 에러가 남아있을 수
있다 — `app/` 하위 파일에서 나는 에러는 이 태스크에서는 무시한다(Task 7에서 디렉토리째
삭제되면 사라진다). `apps/waylog-app/src/` 하위 파일에서 나는 에러만 없으면 된다.

- [ ] **Step 5: 실기기/시뮬레이터 확인**

Run: `pnpm --filter waylog-app ios`
Expected: 앱이 뜨고 `Login` 화면(비로그인 시) 또는 `Home` 화면(로그인 시)이 보인다.
`Home`의 4개 탭(내 여행/피드/탐색/프로필)을 모두 눌러보고 각각 화면이 정상 렌더되는지,
탭 전환 애니메이션과 아이콘이 기존과 동일한지 확인한다. 여행 목록에서 여행을 탭하면
`TripDetail`로 이동을 시도하는데, 아직 `NotYetMigratedScreen`이 뜨는 게 정상이다(Task 5에서
연결).

- [ ] **Step 6: Commit**

```bash
git add apps/waylog-app/index.ts apps/waylog-app/src/app/RootNavigator.tsx apps/waylog-app/src/app/HomeTabs.tsx apps/waylog-app/src/app/NotYetMigratedScreen.tsx apps/waylog-app/src/features/user-profile/UserProfileScreen.tsx apps/waylog-app/src/features/trip/trip-list/TripListScreen.tsx apps/waylog-app/src/features/post/FeedScreen.tsx
git commit -m "$(cat <<'EOF'
feat(앱): 앱 진입점을 react-navigation 루트 네비게이터로 교체한다

Home 탭 4개를 연결하고 나머지 라우트는 임시 화면으로 채운다.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```
