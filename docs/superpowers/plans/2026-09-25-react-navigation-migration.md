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

---

## Task 5: `TripDetail` 하위 트리 연결 (스택 + 탭 중첩, 가장 복잡)

**Files:**
- Create: `apps/waylog-app/src/features/trip/TripDetailStack.tsx` (스택 스크린, 기존
  `app/trip/[tripId]/_layout.tsx` 대체)
- Create: `apps/waylog-app/src/features/trip/TripDetailTabs.tsx` (탭 트리, 기존
  `app/trip/[tripId]/(detail)/_layout.tsx` 대체)
- Modify: `apps/waylog-app/src/features/trip/useTripId.ts` (스코프별 분리)
- Modify: `apps/waylog-app/src/features/trip/components/TripDetailHeader.tsx`
- Modify: `apps/waylog-app/src/features/trip/trip-basic-info/TripBasicInfoContent.tsx`
- Modify: `apps/waylog-app/src/features/trip/trip-route/TripRoutesContent.tsx`
- Modify: `apps/waylog-app/src/features/trip/trip-route/useActiveTripDay.ts`
- Modify: `apps/waylog-app/src/features/trip/trip-transport/UpcomingTransportSection.tsx`
- Modify: `apps/waylog-app/src/features/trip/trip-memo/TripMemo.tsx`
- Modify: `apps/waylog-app/src/features/trip/trip-memo/TripPinnedMemos.tsx`
- Modify: `apps/waylog-app/src/features/trip/trip-transport/TripTransportList.tsx`
- Modify: `apps/waylog-app/src/features/trip/trip-basic-info/TripPostCreateCard.tsx`
- Modify: `apps/waylog-app/src/app/RootNavigator.tsx` (`TripDetail` 플레이스홀더 제거)

**Interfaces:**
- Consumes: `RootStackParamList`, `TripDetailTabParamList` (Task 1), `useAppNavigation`,
  `useAppRoute`, `useTripDetailTabNavigation`, `useTripDetailTabRoute` (Task 2),
  `RouterTabNavigation`(기존, 무변경)
- Produces: `TripDetailStack`(`RootStack`에 등록될 컴포넌트)

**배경**: 기존 `app/trip/[tripId]/_layout.tsx`(스택)와 `app/trip/[tripId]/(detail)/_layout.tsx`
(탭)를 하나로 합쳐 `TripDetailStack` 하나로 만든다. 탭 안에서 렌더되지만 탭 밖 스크린
(`TransportDetail`, `TripMemoDetail`, `TransportNew`, `PostNew`)으로 이동하는 컴포넌트들은
설계 스펙의 "탭 내부에서 스택 레벨 화면으로 이동" 절에 따라 `useAppNavigation`을 그대로 쓴다.

- [ ] **Step 1: `useTripId.ts`를 스코프별로 분리**

```ts
// apps/waylog-app/src/features/trip/useTripId.ts
import { assert } from '@waylog/utility'
import { useTripDetailTabRoute } from '../../shared/hooks/useAppNavigation'

/** TripDetail 탭(정보/장소/계획/정산/사진) 내부에서만 쓴다. */
export function useTripDetailTabTripId() {
  const { params } = useTripDetailTabRoute()
  assert(!!params?.tripId, 'tripId is required')

  return params.tripId
}
```

`TransportDetailScreen`은 `useAppRoute<'TransportDetail'>().params.tripId`를 인라인으로 직접
쓰도록 아래 Step에서 수정한다 — 별도 헬퍼 없음(소비처 1곳뿐).

- [ ] **Step 2: `(detail)` 탭 5개 파일에서 `useTripId` → `useTripDetailTabTripId` 치환**

`app/trip/[tripId]/(detail)/index.tsx`, `place.tsx`, `route.tsx`, `expense.tsx`, `photo.tsx`의
내용을 각각 아래 경로의 새 컴포넌트로 옮기고 import를 치환한다. 5개 모두 동일 패턴이므로
`index.tsx` 예시만 전체를 보이고 나머지는 치환 규칙만 적용한다.

```tsx
// apps/waylog-app/src/features/trip/trip-basic-info/TripInfoTabScreen.tsx
// (기존 app/trip/[tripId]/(detail)/index.tsx 를 그대로 옮기되 import만 교체)
import { Suspense } from 'react'
import { useTripDetailTabTripId } from '../useTripId'
import { ActivityIndicator, View, StyleSheet } from 'react-native'
import { TripBasicInfoContent } from './TripBasicInfoContent'
import { palette } from '../../../shared/config/tokens'

export function TripInfoTabScreen() {
  const tripId = useTripDetailTabTripId()

  return (
    <View style={styles.screen}>
      <Suspense fallback={<ActivityIndicator style={styles.fill} />}>
        <TripBasicInfoContent tripId={tripId} />
      </Suspense>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  fill: { flex: 1 },
})
```

나머지 4개(치환 규칙 동일 — `useTripId` → `useTripDetailTabTripId`, import 경로만 조정):

- `place.tsx` → `apps/waylog-app/src/features/trip/trip-place/TripPlaceTabScreen.tsx`
  (`TripPlaceContent` 렌더)
- `route.tsx` → `apps/waylog-app/src/features/trip/trip-route/TripRouteTabScreen.tsx`
  (`TripRoutesContent` 렌더)
- `expense.tsx` → `apps/waylog-app/src/features/trip/trip-expense/TripExpenseTabScreen.tsx`
  (`TripExpenseContent` 렌더)
- `photo.tsx` → `apps/waylog-app/src/features/trip/trip-photo/TripPhotoTabScreen.tsx`
  (`TripPhotoContent` 렌더)

- [ ] **Step 3: `checklist.tsx`를 탭 밖 `RootStack` 스크린으로 이전**

```tsx
// apps/waylog-app/src/features/trip/trip-checklist/TripDetailChecklistScreen.tsx
// (기존 app/trip/[tripId]/(detail)/checklist.tsx 를 옮기되, 탭이 아니라 RootStack 소속이므로
// useAppRoute를 쓴다)
import { Suspense } from 'react'
import { useAppRoute } from '../../../shared/hooks/useAppNavigation'
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native'
import { TripChecklist } from './TripChecklist'
import { palette } from '../../../shared/config/tokens'
import { FLOATING_TAB_BAR_RESERVE } from '../../../shared/components'

export function TripDetailChecklistScreen() {
  const { params } = useAppRoute<'TripDetailChecklist'>()

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Suspense fallback={<ActivityIndicator style={styles.fill} />}>
        <TripChecklist tripId={params.tripId} />
      </Suspense>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  fill: { flex: 1 },
  content: { padding: 16, paddingBottom: 16 + FLOATING_TAB_BAR_RESERVE },
})
```

- [ ] **Step 4: `TripDetailTabs.tsx` 작성 (기존 `(detail)/_layout.tsx` 대체)**

```tsx
// apps/waylog-app/src/features/trip/TripDetailTabs.tsx
import { MaterialIcons } from '@expo/vector-icons'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { RouterTabNavigation, TRANSPARENT_SCENE_STYLE } from '../../shared/components'
import { palette } from '../../shared/config/tokens'
import { TripInfoTabScreen } from './trip-basic-info/TripInfoTabScreen'
import { TripPlaceTabScreen } from './trip-place/TripPlaceTabScreen'
import { TripRouteTabScreen } from './trip-route/TripRouteTabScreen'
import { TripExpenseTabScreen } from './trip-expense/TripExpenseTabScreen'
import { TripPhotoTabScreen } from './trip-photo/TripPhotoTabScreen'
import type { TripDetailTabParamList } from '../../app/routes'

const Tab = createBottomTabNavigator<TripDetailTabParamList>()

export function TripDetailTabs() {
  return (
    <Tab.Navigator
      // 탭은 replace 로 동작한다. 뒤로가기는 직전 탭이 아니라 여행 화면을 벗어난다.
      backBehavior="none"
      tabBar={(props) => (
        <RouterTabNavigation
          {...props}
          variant="apple"
          visibleNames={['TripInfo', 'TripPlace', 'TripRoute', 'TripExpense', 'TripPhoto']}
          style={styles.floatingTabBar}
        />
      )}
      screenOptions={{
        headerShown: false,
        sceneStyle: TRANSPARENT_SCENE_STYLE,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.grey,
      }}
    >
      <Tab.Screen name="TripInfo" component={TripInfoTabScreen} options={{ tabBarIcon: ({ color }) => <MaterialIcons name="info" size={22} color={color} />, title: '정보' }} />
      <Tab.Screen name="TripPlace" component={TripPlaceTabScreen} options={{ tabBarIcon: ({ color }) => <MaterialIcons name="pin-drop" size={22} color={color} />, title: '장소' }} />
      <Tab.Screen name="TripRoute" component={TripRouteTabScreen} options={{ tabBarIcon: ({ color }) => <MaterialIcons name="near-me" size={22} color={color} />, title: '계획' }} />
      <Tab.Screen name="TripExpense" component={TripExpenseTabScreen} options={{ tabBarIcon: ({ color }) => <MaterialIcons name="receipt" size={22} color={color} />, title: '정산' }} />
      <Tab.Screen name="TripPhoto" component={TripPhotoTabScreen} options={{ tabBarIcon: ({ color }) => <MaterialIcons name="photo" size={22} color={color} />, title: '사진' }} />
    </Tab.Navigator>
  )
}

const styles = StyleSheet.create({
  // 탭바가 scene 위에 얹혀야 콘텐츠가 바닥까지 이어진다. 가려지는 높이는
  // 각 화면이 FLOATING_TAB_BAR_RESERVE 로 비운다.
  floatingTabBar: { position: 'absolute', left: 0, right: 0, bottom: 0 },
})
```

`checklist`는 `visibleNames`에서 빠졌으므로 탭바에 보이지 않는다(기존 `href: null`과 동일 효과) —
Step 3에서 이미 탭 트리 밖으로 옮겼으므로 여기 등록 자체가 없다.

- [ ] **Step 5: `TripDetailStack.tsx` 작성 (기존 `[tripId]/_layout.tsx` 대체)**

```tsx
// apps/waylog-app/src/features/trip/TripDetailStack.tsx
import { ErrorBoundary } from '@waylog/react'
import { View, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, Stack, Typography } from '~/shared/components/design-system'
import { palette } from '../../shared/config/tokens'
import { TripDetailHeader } from './components/TripDetailHeader'
import { TripDetailTabs } from './TripDetailTabs'

export function TripDetailStack() {
  const insets = useSafeAreaInsets()

  return (
    <View style={styles.screen}>
      <ErrorBoundary
        fallback={({ resetError }) => (
          <Stack style={styles.error}>
            <Typography color="text.secondary">여행 정보를 불러오지 못했어요</Typography>
            <Button variant="contained" onPress={resetError} style={styles.retryButton}>다시 시도</Button>
          </Stack>
        )}
      >
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TripDetailHeader />
        </View>
        <View style={styles.fill}>
          <TripDetailTabs />
        </View>
      </ErrorBoundary>
    </View>
  )
}

const styles = StyleSheet.create({
  error: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  fill: { flex: 1 },
  screen: { flex: 1, backgroundColor: palette.background },
  retryButton: { marginTop: 12 },
  header: { backgroundColor: palette.background },
})
```

주의: 기존 `(detail)/_layout.tsx`는 `headerShown: false`인 `[tripId]/_layout.tsx`(Stack) 안에
탭이 중첩된 구조였다. `RootStack.Screen name="TripDetail"`도 `screenOptions={{ headerShown:
false }}`를 이미 상속하므로(Task 4의 `RootNavigator`) 여기서 별도로 `headerShown` 옵션을
줄 필요가 없다.

- [ ] **Step 6: `TripDetailHeader` API 치환**

```tsx
// apps/waylog-app/src/features/trip/components/TripDetailHeader.tsx
// Resolved 함수 내부, 변경 전:
// const { tripId } = useLocalSearchParams<{ tripId: string }>()
// const router = useRouter()
// ...
// onPress={() => router.back()}

// 변경 후:
import { useAppNavigation, useAppRoute } from '../../../shared/hooks/useAppNavigation'
// ...
function Resolved() {
  const { params } = useAppRoute<'TripDetail'>()
  const navigation = useAppNavigation()
  const { data: trip, update } = useTrip(params.tripId)
  return (
    <Stack direction="row" alignItems="center" style={styles.header}>
      <Pressable accessibilityLabel="뒤로가기" onPress={() => navigation.goBack()} style={styles.backButton}>
        <MaterialIcons name="arrow-back" size={22} color={palette.text} />
      </Pressable>
      {/* ...나머지 동일, ChatIconButton tripId={params.tripId} */}
    </Stack>
  )
}
```

`useLocalSearchParams`, `useRouter` import를 제거하고 위 두 훅으로 교체한다.

- [ ] **Step 7: `TripBasicInfoContent` API 치환**

```tsx
// 변경 전: import { useRouter } from 'expo-router'; const router = useRouter()
// 변경 후:
import { useAppNavigation } from '../../../shared/hooks/useAppNavigation'
// ...
const navigation = useAppNavigation()

// 변경 전: onPress={(transportId) => router.push(`/trip/${tripId}/transport/${transportId}`)}
// 변경 후:
onTransportPress={(transportId) => navigation.navigate('TransportDetail', { tripId, transportId })}

// 변경 전: onPress={() => router.push(`/trip/${tripId}/transport/new`)}
// 변경 후:
onPress={() => navigation.navigate('TransportNew', { tripId })}
```

`useQueryParamState('info-tab', ...)` 호출은 이 태스크에서 손대지 않는다(Task 8에서 일괄
재구현). `app/`이 아직 있는 동안은 정상 동작한다 — 이 파일은 이제 탭 트리 안(`TripInfo`)에서
렌더되지만, `useQueryParamState`가 `useLocalSearchParams`/`useRouter`(expo-router)를 호출하는
것은 `NavigationContainer`(react-navigation)와 무관하게 expo-router 모듈 자체의 함수 호출이라,
Task 4에서 `index.ts`를 이미 바꿨으므로 **실제로는 크래시한다** — Task 4의 `UserProfileScreen`과
같은 문제. 이 태스크에서 `TripBasicInfoContent`의 `useQueryParamState` 한 줄도 임시로
`useState`로 바꿔야 한다:

```tsx
// 변경 전: const [currentTab, setCurrentTab] = useQueryParamState('info-tab', { defaultValue: 'default' })
// 변경 후 (Task 8에서 재교체 예정):
const [currentTab, setCurrentTab] = useState('default')
```

`useState`를 이미 import하고 있지 않다면 `react`에서 추가로 import한다.

- [ ] **Step 8: `TripRoutesContent`, `useActiveTripDay` 임시 처리**

같은 이유로 `TripRoutesContent.tsx`의 `useQueryParamState<string>('route-id', ...)`와
`useActiveTripDay.ts`의 `useQueryParamState<string>('days', ...)`도 이 태스크에서 임시
`useState`로 바꾼다(Task 8에서 재교체):

```ts
// useActiveTripDay.ts, 변경 전:
// const [value, update] = useQueryParamState<string>('days', {
//   defaultValue: () => getDefaultTripDay(trip, new Date().toISOString().split('T')[0]!),
// })
// 변경 후:
import { useState } from 'react'
// ...
const [value, update] = useState<string>(() => getDefaultTripDay(trip, new Date().toISOString().split('T')[0]!))
```

```tsx
// TripRoutesContent.tsx, 변경 전:
// const [selectedRouteId, setSelectedRouteId] = useQueryParamState<string>('route-id', {
//   defaultValue: () => routes[0]?.id ?? '',
// })
// 변경 후:
const [selectedRouteId, setSelectedRouteId] = useState<string>(() => routes[0]?.id ?? '')
```

- [ ] **Step 9: `UpcomingTransportSection`, `TripMemo`, `TripPinnedMemos`, `TripTransportList`,
  `TripPostCreateCard` API 치환**

5개 파일 모두 같은 패턴(`useRouter` → `useAppNavigation`, 문자열 경로 → `navigate` 호출):

```ts
// UpcomingTransportSection.tsx
// 변경 전: const router = useRouter(); onPress={() => router.push(`/trip/${tripId}/transport/${transport.id}`)}
// 변경 후:
const navigation = useAppNavigation()
onPress={() => navigation.navigate('TransportDetail', { tripId, transportId: transport.id })}

// TripMemo.tsx
// 변경 전: const router = useRouter(); onPress={() => router.push(`/trip/${tripId}/memo/${memo.id}`)}
// 변경 후:
const navigation = useAppNavigation()
onPress={() => navigation.navigate('TripMemoDetail', { tripId, memoId: memo.id })}

// TripPinnedMemos.tsx — TripMemo.tsx와 동일 패턴
const navigation = useAppNavigation()
onPress={() => navigation.navigate('TripMemoDetail', { tripId, memoId: memo.id })}

// TripTransportList.tsx
// 변경 전: const router = useRouter(); onPress={() => router.push(`/trip/${tripId}/transport/new`)}
// 변경 후:
const navigation = useAppNavigation()
onPress={() => navigation.navigate('TransportNew', { tripId })}

// TripPostCreateCard.tsx
// 변경 전: const router = useRouter(); onPress={() => router.push({ pathname: '/post/new', params: { tripId } })}
// 변경 후:
const navigation = useAppNavigation()
onPress={() => navigation.navigate('PostNew', { tripId })}
```

각 파일에서 `import { useRouter } from 'expo-router'`를 제거하고
`import { useAppNavigation } from '.../useAppNavigation'`으로 교체한다(상대 경로는 파일
위치에 맞게 조정 — 예: `trip-transport/`에서는 `../../../shared/hooks/useAppNavigation`,
`trip-basic-info/`에서도 동일).

- [ ] **Step 10: `TransportDetailScreen`의 `useTripId` 인라인 치환**

```tsx
// apps/waylog-app/src/features/trip/trip-transport/transport-detail/TransportDetailScreen.tsx
// 변경 전: import { useTripId } from '../../useTripId'; const tripId = useTripId()
// 변경 후:
import { useAppRoute } from '../../../../shared/hooks/useAppNavigation'
// ...
export function TransportDetailScreen() {
  const { params: { tripId } } = useAppRoute<'TransportDetail'>()
  // ...
```

- [ ] **Step 11: `RootNavigator.tsx`에 `TripDetail`, `TripDetailChecklist` 실제 스크린 연결**

```tsx
// RootStack.Screen name="TripDetail" component={NotYetMigratedScreen} 를 아래로 교체:
<RootStack.Screen name="TripDetail" component={TripDetailStack} />
// RootStack.Screen name="TripDetailChecklist" component={NotYetMigratedScreen} 를 아래로 교체:
<RootStack.Screen name="TripDetailChecklist" component={TripDetailChecklistScreen} />
```

import 추가: `import { TripDetailStack } from '../features/trip/TripDetailStack'`,
`import { TripDetailChecklistScreen } from '../features/trip/trip-checklist/TripDetailChecklistScreen'`.

`TripBasicInfoContent`가 체크리스트를 자체 탭(`currentTab === 'checklist'`)으로도 보여주고
있었다는 점에 주의 — 이건 `TripDetailChecklistScreen`(스택 스크린, `checklist-id` 없는 전체
목록)과는 다른 화면이다. 기존 동작 그대로 둔다(이 태스크에서 `TripBasicInfoContent` 내부
탭 전환 로직은 건드리지 않음).

- [ ] **Step 12: 남은 `app/trip/[tripId]/*` 파일에서 옛 import 정리 확인**

`app/trip/[tripId]/(detail)/*.tsx`와 `app/trip/[tripId]/_layout.tsx`는 이제 `RootNavigator`
트리에서 참조되지 않지만 파일은 아직 존재한다(Task 7에서 삭제). 이 파일들이 여전히
`expo-router`를 import하고 있어도 컴파일은 되므로 이 태스크에서는 그대로 둔다.

- [ ] **Step 13: 타입 검증**

Run: `cd apps/waylog-app && pnpm exec tsc --noEmit`
Expected: `apps/waylog-app/src/` 하위에 에러 없음.

- [ ] **Step 14: 실기기/시뮬레이터 확인**

Run: `pnpm --filter waylog-app ios`
Expected: `Home`의 "내 여행" 탭에서 여행을 하나 눌러 `TripDetail`로 진입한다. 상단에
`TripDetailHeader`(여행 이름, 뒤로가기, 채팅 아이콘)가 보이고, 하단에 5개 탭(정보/장소/계획/
정산/사진)이 기존과 동일한 "apple" 스타일 플로팅 탭바로 보인다. 각 탭을 전환해 화면이 정상
렌더되는지 확인한다. "정보" 탭에서 다가오는 교통편을 눌러 `TransportDetail`로, 고정 메모를
눌러 `TripMemoDetail`로 이동해본다(둘 다 아직 `NotYetMigratedScreen` — Task 6에서 연결).
뒤로가기로 `TripDetail` → `Home`까지 정상 복귀하는지 확인한다.

- [ ] **Step 15: Commit**

```bash
git add apps/waylog-app/src/features/trip apps/waylog-app/src/app/RootNavigator.tsx
git commit -m "$(cat <<'EOF'
feat(앱): TripDetail 스택과 탭 트리를 react-navigation으로 연결한다

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: 나머지 평면 라우트 연결 (explorer, post, u, transport, memo, trip/new, trip/invite)

**Files:**
- Create: `apps/waylog-app/src/features/trip/trip-memo/TripMemoDetailScreen.tsx` (기존
  `app/trip/[tripId]/memo/[memoId].tsx` 대체)
- Create: `apps/waylog-app/src/features/trip/trip-memo/TripMemoEditScreen.tsx` (기존
  `app/trip/[tripId]/memo/[memoId]/edit.tsx` 대체)
- Modify: `apps/waylog-app/src/app/RootNavigator.tsx` (남은 모든 플레이스홀더 교체)
- Modify: `apps/waylog-app/src/features/post/PostDetailScreen.tsx`
- Modify: `apps/waylog-app/src/features/post/PostCreationScreen.tsx`
- Modify: `apps/waylog-app/src/features/explorer/PlaceDetailScreen.tsx`
- Modify: `apps/waylog-app/src/features/explorer/ExplorerCatalogScreen.tsx` (죽은 `useRouter` import 제거)
- Modify: `apps/waylog-app/src/features/explorer/explorer-saved/MostSavedPlacesSection.tsx`
- Modify: `apps/waylog-app/src/features/explorer/explorer-ranking/ExploredPlacesRankingSection.tsx`
- Modify: `apps/waylog-app/src/features/explorer/explorer-recent/RecentHotPlacesSection.tsx`
- Modify: `apps/waylog-app/src/features/explorer/explorer-view/ExplorerRankingGrid.tsx`
- Modify: `apps/waylog-app/src/features/explorer/explorer-view/ExplorerMap.tsx`
- Modify: `apps/waylog-app/src/features/explorer/explorer-view/ExplorerScreenHeader.tsx`
- Modify: `apps/waylog-app/src/features/explorer/explorer.utils.ts` (`buildExplorerPlaceDetailPath` 제거)
- Modify: `apps/waylog-app/src/features/user-profile/UserProfileScreen.tsx` (`tab` params 정식화)
- Modify: `apps/waylog-app/src/features/user-profile/ProfileFeedTab.tsx`
- Modify: `apps/waylog-app/src/features/trip/trip-create/TripCreateScreen.tsx`
- Modify: `apps/waylog-app/src/features/trip/trip-invite/TripInviteScreen.tsx`
- Modify: `apps/waylog-app/src/features/trip/components/TripLeaveButton.tsx`
- Modify: `apps/waylog-app/src/features/place/place-detail/PlaceDetailSheet.tsx`
- Modify: `apps/waylog-app/src/shared/components/design-system/AppBar.tsx`
- Modify: `apps/waylog-app/src/features/trip/trip-transport/useTransportId.ts` (삭제 — 소비처를
  `useAppRoute`로 직접 전환)
- Modify: `apps/waylog-app/src/features/trip/trip-transport/TransportCreationScreen.tsx`
- Modify: `apps/waylog-app/src/features/trip/trip-transport/transport-detail/TransportDetailMenu.tsx`

**Interfaces:**
- Consumes: `RootStackParamList` (Task 1), `useAppNavigation`, `useAppRoute` (Task 2)
- Produces: 없음(이 태스크로 `RootStackParamList`의 모든 화면이 실제 스크린으로 연결 완료)

- [ ] **Step 1: `PostDetailScreen`, `PostCreationScreen` API 치환**

```tsx
// PostDetailScreen.tsx, ResolvedPostDetail 함수 내부
// 변경 전: const router = useRouter()
// 변경 후:
import { useAppNavigation, useAppRoute } from '../../shared/hooks/useAppNavigation'
const navigation = useAppNavigation()
const { params } = useAppRoute<'PostDetail'>()
const { postId } = params
// (기존 postId prop 대신 route params에서 직접 읽는다 — 아래 Step 8에서
// RootNavigator 연결부가 이 컴포넌트를 prop 없이 직접 등록하도록 정리한다)

// 변경 전: onPress={() => router.push(`/u/${post.authorId}`)}
// 변경 후:
onPress={() => navigation.navigate('UserProfile', { userId: post.authorId })}

// 변경 전: onPress={() => router.back()} (2곳: 뒤로가기 버튼, PostMenu onDelete)
// 변경 후:
onPress={() => navigation.goBack()}

// 변경 전: onPlacePress={(placeId) => router.push(`/explorer/${placeId}`)}
// 변경 후:
onPlacePress={(placeId) => navigation.navigate('ExplorerDetail', { placeId })}
```

```tsx
// PostCreationScreen.tsx
// 변경 전:
// import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
// const router = useRouter()
// const params = useLocalSearchParams<{ tripId?: string | string[] }>()
// const fixedTripId = Array.isArray(params.tripId) ? params.tripId[0] : params.tripId
// ...
// <Stack.Screen options={{ gestureEnabled: step === startStep }} />
// ...
// router.replace(`/post/${post.id}`)

// 변경 후:
import { useAppNavigation, useAppRoute } from '../../shared/hooks/useAppNavigation'
// ...
const navigation = useAppNavigation()
const { params } = useAppRoute<'PostNew'>()
const fixedTripId = params.tripId
// ...
navigation.setOptions({ gestureEnabled: step === startStep })
// ...
navigation.replace('PostDetail', { postId: post.id })
```

주의: `<Stack.Screen options={{...}} />`(expo-router의 선언적 옵션 설정)는 react-navigation에서
`navigation.setOptions({...})`(명령형 호출)로 바뀐다 — 렌더 중 호출해도 되는 React Navigation
표준 API이므로 `useEffect`로 감쌀 필요는 없다.

- [ ] **Step 2: `PlaceDetailScreen` API 치환 + `tab` params 정식화**

```tsx
// PlaceDetailScreen.tsx
// 변경 전:
// import { useRouter } from 'expo-router'
// import { useQueryParamState } from '../../shared/hooks/useQueryParamState'
// export function PlaceDetailScreen({ placeId }: { placeId: string }) {
//   const router = useRouter()
//   const [currentTab, selectTab] = useQueryParamState<PlaceDetailTab>('tab', {
//     defaultValue: 'info',
//     parse: parsePlaceDetailTab,
//   })

// 변경 후 (Task 8 이전이므로 tab은 임시 useState — Task 8에서 route params로 재교체):
import { useAppNavigation, useAppRoute } from '../../shared/hooks/useAppNavigation'
import { useState } from 'react'

export function PlaceDetailScreen() {
  const { params } = useAppRoute<'ExplorerDetail'>()
  const { placeId } = params
  const navigation = useAppNavigation()
  const [currentTab, selectTab] = useState<PlaceDetailTab>('info')
  // ...

// 변경 전: onPress={() => router.back()}
// 변경 후:
onPress={() => navigation.goBack()}

// PlaceFeedContent 내부, 변경 전: const router = useRouter(); onPress={() => router.push(`/post/${post.id}`)}
// 변경 후:
const navigation = useAppNavigation()
onPress={() => navigation.navigate('PostDetail', { postId: post.id })}
```

`placeId` prop을 없애고 route params에서 직접 읽도록 시그니처를 바꿨다 — Step 8에서
`RootNavigator`가 이 컴포넌트를 prop 없이 `component={PlaceDetailScreen}`으로 직접 등록한다.

- [ ] **Step 3: Explorer 랭킹/지도 컴포넌트 6개 API 치환**

`buildExplorerPlaceDetailPath` 헬퍼는 문자열 경로 생성용이라 더 이상 필요 없다 —
`explorer.utils.ts`에서 제거하고, 6개 소비처 모두 `navigate('ExplorerDetail', { placeId })`로
직접 바꾼다.

```tsx
// MostSavedPlacesSection.tsx, ExploredPlacesRankingSection.tsx,
// ExplorerRankingGrid.tsx, ExplorerMap.tsx — 공통 패턴
// 변경 전: const router = useRouter(); onPress={() => router.push(buildExplorerPlaceDetailPath(place.placeId))}
// 변경 후:
import { useAppNavigation } from '../../../shared/hooks/useAppNavigation'
const navigation = useAppNavigation()
onPress={() => navigation.navigate('ExplorerDetail', { placeId: place.placeId })}
```

```tsx
// MostSavedPlacesSection.tsx, 변경 전: onMore={() => router.push('/explorer/most-saved')}
// 변경 후:
onMore={() => navigation.navigate('ExplorerMostSaved', {})}

// ExploredPlacesRankingSection.tsx, 변경 전: onMore={() => router.push('/explorer/top-visited')}
// 변경 후:
onMore={() => navigation.navigate('ExplorerTopVisited', {})}
```

```tsx
// RecentHotPlacesSection.tsx, 변경 전:
// router.push(withQueryParams('/explorer/recent-hot', { category: category ?? '', location: location ?? '' }))
// 변경 후 (withQueryParams import 제거):
navigation.navigate('ExplorerRecentHot', { category, location })
```

```tsx
// ExplorerScreenHeader.tsx, 변경 전: const router = useRouter(); onPress={() => router.back()}
// 변경 후:
const navigation = useAppNavigation()
onPress={() => navigation.goBack()}
```

`explorer.utils.ts`에서 `buildExplorerPlaceDetailPath` 함수 전체를 삭제한다
(`ExplorerFilterVisibility`, `getExplorerFilterVisibility`는 네비게이션과 무관하므로 유지).

- [ ] **Step 4: `ExplorerCatalogScreen`의 죽은 import 제거**

```tsx
// 변경 전: import { useRouter } from 'expo-router'  ← 실제로 어디서도 쓰이지 않는다
// 변경 후: 이 import 줄 자체를 삭제
```

- [ ] **Step 5: `UserProfileScreen`, `ProfileFeedTab` API 치환**

```tsx
// UserProfileScreen.tsx
// 변경 전: const [currentTab, selectTab] = useQueryParamState<ProfileTab>('tab', { defaultValue: 'feed', parse: parseProfileTab })
// 변경 후 (Task 4에서 이미 임시로 useState로 바꿔둔 상태 — Task 8에서 route params로 정식 교체 예정,
// 이 태스크에서는 손대지 않는다)

// ProfileFeedTab.tsx
// 변경 전: const router = useRouter(); onPress={() => router.push(`/post/${post.postId}`)}
// 변경 후:
import { useAppNavigation } from '../../shared/hooks/useAppNavigation'
const navigation = useAppNavigation()
onPress={() => navigation.navigate('PostDetail', { postId: post.postId })}
```

- [ ] **Step 6: `TripCreateScreen`, `TripInviteScreen`, `TripLeaveButton` API 치환**

```tsx
// TripCreateScreen.tsx
// 변경 전: const router = useRouter(); const [step, setStep] = useQueryParamState<Step>('step', { defaultValue: 'destination' })
// 변경 후 (step 은 Task 8 이전이므로 임시 useState):
import { useAppNavigation } from '../../../shared/hooks/useAppNavigation'
import { useState } from 'react'
const navigation = useAppNavigation()
const [step, setStep] = useState<Step>('destination')

// 변경 전: onPress={() => router.back()}
// 변경 후:
onPress={() => navigation.goBack()}

// 변경 전: router.replace(`/trip/${trip.id}`)
// 변경 후:
navigation.replace('TripDetail', { tripId: trip.id })
```

```tsx
// TripInviteScreen.tsx
// 변경 전:
// import { useLocalSearchParams, useRouter } from 'expo-router'
// const router = useRouter()
// const { shareLink } = useLocalSearchParams<{ shareLink: string }>()
// ...
// router.replace(`/trip/${trip.id}`)

// 변경 후:
import { useAppNavigation, useAppRoute } from '../../../shared/hooks/useAppNavigation'
const navigation = useAppNavigation()
const { params } = useAppRoute<'TripInvite'>()
const { shareLink } = params
// ...
navigation.replace('TripDetail', { tripId: trip.id })
```

```tsx
// TripLeaveButton.tsx
// 변경 전: const router = useRouter(); ... router.replace('/')
// 변경 후:
import { useAppNavigation } from '../../../shared/hooks/useAppNavigation'
const navigation = useAppNavigation()
// ...
navigation.reset({ index: 0, routes: [{ name: 'Home' }] })
```

주의: 기존 `router.replace('/')`는 "루트로 완전히 교체"였다. `@react-navigation`의
`replace`는 스택 맨 위 화면 하나만 바꾸므로, 완전히 새 스택으로 만들려면 `reset`이 더
정확하다 — 여행을 나간 뒤 뒤로가기로 그 여행 화면에 다시 못 돌아가야 하는 의도와 일치한다.

- [ ] **Step 7: `PlaceDetailSheet`, `AppBar` API 치환**

```tsx
// PlaceDetailSheet.tsx, 변경 전: const router = useRouter(); router.push(`/explorer/${placeId}`)
// 변경 후:
import { useAppNavigation } from '../../../shared/hooks/useAppNavigation'
const navigation = useAppNavigation()
navigation.navigate('ExplorerDetail', { placeId })

// AppBar.tsx (공용 디자인시스템 컴포넌트), 변경 전: const router = useRouter(); onPress={() => router.back()}
// 변경 후:
import { useAppNavigation } from '../../hooks/useAppNavigation'
const navigation = useAppNavigation()
onPress={() => navigation.goBack()}
```

- [ ] **Step 8: 교통편 관련 3개 파일 API 치환**

```ts
// useTransportId.ts 는 삭제한다. 유일한 소비처(TransportDetailScreen)는 Task 5 Step 10에서
// 이미 useAppRoute<'TransportDetail'>().params.transportId 로 직접 읽도록 바뀌었으므로
// 이 파일 자체가 더 이상 필요 없다.
```

```tsx
// TransportCreationScreen.tsx
// 변경 전:
// import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
// const router = useRouter()
// const params = useLocalSearchParams<{ tripId?: string | string[] }>()
// ...
// router.replace(`/trip/${tripId}/transport/${created.id}`)

// 변경 후:
import { useAppNavigation, useAppRoute } from '../../../shared/hooks/useAppNavigation'
const navigation = useAppNavigation()
const { params } = useAppRoute<'TransportNew'>()
const { tripId } = params
// ...
navigation.replace('TransportDetail', { tripId, transportId: created.id })
```

```tsx
// TransportDetailMenu.tsx, 변경 전: const router = useRouter(); router.back()
// 변경 후:
import { useAppNavigation } from '../../../../shared/hooks/useAppNavigation'
const navigation = useAppNavigation()
navigation.goBack()
```

- [ ] **Step 9: `TripMemoDetailScreen`, `TripMemoEditScreen` 신규 작성**

```tsx
// apps/waylog-app/src/features/trip/trip-memo/TripMemoDetailScreen.tsx
// (기존 app/trip/[tripId]/memo/[memoId].tsx 를 옮기되 useLocalSearchParams/useRouter 를 교체)
import { MaterialIcons } from '@expo/vector-icons'
import { useTripMemo } from '@waylog/domains/modules/trip-memo'
import { formatDate } from 'date-fns'
import { Suspense } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { IconButton, Stack, Typography } from '~/shared/components/design-system'
import { useAppNavigation, useAppRoute } from '../../../shared/hooks/useAppNavigation'
import { OgPreviewCard } from '../../open-graph/OgPreviewCard'
import { PopMenu } from '../../../shared/components/PopMenu'
import { useConfirmDialog } from '../../../shared/components/confirm-dialog/useConfirmDialog'
import { extractUrls, renderTextWithLinks } from '../../../shared/utils/urls'

export function TripMemoDetailScreen() {
  return (
    <Suspense fallback={<ActivityIndicator style={styles.fill} />}>
      <Resolved />
    </Suspense>
  )
}

function Resolved() {
  const { params } = useAppRoute<'TripMemoDetail'>()
  const { tripId } = params
  const navigation = useAppNavigation()
  const confirm = useConfirmDialog()
  const { data: { memos }, togglePin, remove } = useTripMemo(tripId)
  const memo = memos.find((item) => item.id === params.memoId)

  if (!memo) {
    return <Typography style={styles.emptyMessage}>메모를 찾을 수 없어요</Typography>
  }

  const urls = extractUrls(memo.content)

  return (
    <SafeAreaView style={styles.fill}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" style={styles.header}>
        <IconButton onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} />
        </IconButton>

        {memo.isPinned && <MaterialIcons name="push-pin" size={18} color="#4C84FF" />}
        <Typography variant="subtitle1" numberOfLines={1} style={styles.title}>
          {memo.title || '메모'}
        </Typography>

        <PopMenu
          items={[
            <PopMenu.Item key="pin" onPress={() => togglePin(memo.id)}>
              {memo.isPinned ? '고정 해제' : '고정'}
            </PopMenu.Item>,
            <PopMenu.Item key="edit" onPress={() => navigation.navigate('TripMemoEdit', { tripId, memoId: memo.id })}>
              수정
            </PopMenu.Item>,
            <PopMenu.Item
              key="delete"
              color="error"
              onPress={async () => {
                if (!(await confirm('이 메모를 삭제하시겠습니까?'))) return
                await remove(memo.id)
                navigation.goBack()
              }}
            >
              삭제
            </PopMenu.Item>,
          ]}
        />
      </Stack>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Typography variant="caption" color="text.secondary">
          {formatDate(memo.createdAt, 'yyyy년 M월 d일 a h:mm')}
        </Typography>
        <Typography variant={memo.title ? 'body2' : 'body1'}>
          {renderTextWithLinks(memo.content)}
        </Typography>
        {urls.length > 0 && <OgPreviewCard url={urls[0]} />}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { flex: 1 },
  emptyMessage: { padding: 24, textAlign: 'center' },
  title: { flex: 1, paddingHorizontal: 8 },
  header: { padding: 8 },
  content: { padding: 20, gap: 8 },
})
```

```tsx
// apps/waylog-app/src/features/trip/trip-memo/TripMemoEditScreen.tsx
// (기존 app/trip/[tripId]/memo/[memoId]/edit.tsx 를 옮기되 useLocalSearchParams/useRouter 를 교체)
import { MaterialIcons } from '@expo/vector-icons'
import { useTripMemo } from '@waylog/domains/modules/trip-memo'
import { Suspense, useRef, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, IconButton, Stack, Typography } from '~/shared/components/design-system'
import { useAppNavigation, useAppRoute } from '../../../shared/hooks/useAppNavigation'
import { BottomArea } from '../../../shared/components/BottomArea'
import { TripMemoForm, type TripMemoFormRef } from './TripMemoForm'

export function TripMemoEditScreen() {
  return (
    <Suspense fallback={<ActivityIndicator style={styles.fill} />}>
      <Resolved />
    </Suspense>
  )
}

function Resolved() {
  const { params } = useAppRoute<'TripMemoEdit'>()
  const { tripId, memoId } = params
  const navigation = useAppNavigation()
  const { data: { memos }, update } = useTripMemo(tripId)
  const [isSaving, setIsSaving] = useState(false)
  const formRef = useRef<TripMemoFormRef>(null)
  const memo = memos.find((item) => item.id === memoId)

  if (!memo) return <Typography style={styles.emptyMessage}>메모를 찾을 수 없어요</Typography>

  return (
    <SafeAreaView style={styles.fill}>
      <Stack direction="row" alignItems="center" style={styles.header}>
        <IconButton onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} />
        </IconButton>
        <Typography variant="subtitle1" style={styles.title}>메모 수정</Typography>
      </Stack>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <TripMemoForm
          ref={formRef}
          defaultValues={{ title: memo.title ?? '', content: memo.content }}
          onSubmit={async ({ title, content }) => {
            setIsSaving(true)
            await update({ id: memo.id, title: title || null, content })
            navigation.goBack()
          }}
        />
      </ScrollView>
      <BottomArea position="static">
        <Button size="large" variant="contained" disabled={isSaving} onPress={() => formRef.current?.submit()} fullWidth >
          저장
        </Button>
      </BottomArea>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { flex: 1 },
  emptyMessage: { padding: 24, textAlign: 'center' },
  title: { paddingHorizontal: 8 },
  header: { padding: 8 },
  content: { padding: 16, paddingBottom: 24 },
})
```

- [ ] **Step 10: `RootNavigator.tsx`의 남은 플레이스홀더 전부 실제 스크린으로 교체**

```tsx
// 아래 매핑대로 RootStack.Screen 의 component 를 NotYetMigratedScreen 에서 교체하고,
// 해당 스크린 컴포넌트가 이제 prop 없이 route params 만으로 동작하는지 확인한다.
// (PostDetailScreen, PlaceDetailScreen 은 이 태스크 Step 1, 2 에서 이미 prop 없는 시그니처로 바꿨다)

TripDetailChecklist    → TripDetailChecklistScreen (Task 5에서 이미 연결)
TripMemoDetail         → TripMemoDetailScreen (이 태스크 Step 9)
TripMemoEdit           → TripMemoEditScreen (이 태스크 Step 9)
TripCreate             → TripCreateScreen
TripInvite             → TripInviteScreen
ExplorerDetail         → PlaceDetailScreen (prop 없는 시그니처로 등록: component={PlaceDetailScreen})
ExplorerTopVisited     → TopVisitedScreen
ExplorerRecentHot      → RecentHotScreen
ExplorerMostSaved      → MostSavedScreen
PostNew                → PostCreationScreen
PostDetail             → PostDetailScreen (prop 없는 시그니처로 등록)
UserProfile            → UserProfileDetailScreen (아래 참고 — Home 탭의 UserProfileScreen과는
                          다른 얇은 래퍼가 필요하다)
TransportNew           → TransportCreationScreen
TransportDetail        → TransportDetailScreen (Task 5에서 이미 연결)
```

`UserProfile`(RootStack, 남의 프로필 보기)은 `Home` 탭의 `Profile`(자기 프로필)과 컴포넌트가
같지만 `userId`를 얻는 방법이 다르다 — `Profile` 탭은 `useAuth().id`, `UserProfile` 스크린은
route params다. 얇은 래퍼를 하나 추가한다:

```tsx
// apps/waylog-app/src/features/user-profile/UserProfileDetailScreen.tsx
import { useAppRoute } from '../../shared/hooks/useAppNavigation'
import { UserProfileScreen } from './UserProfileScreen'

export function UserProfileDetailScreen() {
  const { params } = useAppRoute<'UserProfile'>()
  return <UserProfileScreen userId={params.userId} />
}
```

`RootNavigator.tsx`의 `UserProfile` 스크린은 `component={UserProfileDetailScreen}`으로 등록한다.

- [ ] **Step 11: 타입 검증**

Run: `cd apps/waylog-app && pnpm exec tsc --noEmit`
Expected: `apps/waylog-app/src/` 하위에 에러 없음. `RootStackParamList`의 모든 키가
`RootNavigator`에 실제 컴포넌트로 등록되어 있는지 타입이 검증한다(빠진 게 있으면 여기서
에러가 난다).

- [ ] **Step 12: 실기기/시뮬레이터 확인**

Run: `pnpm --filter waylog-app ios`
Expected: `NotYetMigratedScreen`이 더 이상 어디서도 보이지 않아야 한다. 아래 경로를 모두
왕복 확인한다:
- 피드 탭 → 포스트 작성(+) → 저장 → 포스트 상세로 replace → 뒤로가기로 피드 복귀
- 포스트 상세 → 작성자 프로필(`UserProfile`) → 뒤로가기
- 탐색 탭 → 장소 상세(`ExplorerDetail`) → 정보/피드 탭 전환 → 뒤로가기
- 탐색 탭 → "가장 많이 방문" 더보기(`ExplorerTopVisited`), "핫플레이스" 더보기
  (`ExplorerRecentHot`), "많이 저장됨" 더보기(`ExplorerMostSaved`) 각각 진입·뒤로가기
- 내 여행 탭 → 여행 만들기(`TripCreate`) 3단계 진행 → 완료 시 `TripDetail`로 이동
- 여행 상세 → 교통편 추가(`TransportNew`) → 저장 → 교통편 상세로 replace
- 여행 상세 → 메모 상세(`TripMemoDetail`) → 수정(`TripMemoEdit`) → 저장 → 상세로 복귀
- 여행 나가기(`TripLeaveButton`) → `Home`으로 리셋되어 뒤로가기로 나간 여행에 못 돌아가는지 확인

- [ ] **Step 13: Commit**

```bash
git add apps/waylog-app/src
git commit -m "$(cat <<'EOF'
feat(앱): 나머지 평면 라우트를 react-navigation으로 연결한다

RootStackParamList 의 모든 화면이 실제 스크린으로 연결되어
NotYetMigratedScreen 플레이스홀더가 더 이상 쓰이지 않는다.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: 딥링크 연결

**Files:**
- Modify: `apps/waylog-app/src/app/RootNavigator.tsx` (`linking` config 추가)

**Interfaces:**
- Consumes: `RootStackParamList` (Task 1)

**배경**: 여행 초대 링크(`trip/invite/:shareLink`)를 딥링크로 연결한다. 카카오 로그인 콜백
(`waylog://auth/callback`)은 화면 전환이 아니라 Supabase 인증 SDK(`@waylog/domains/clients`)가
자체적으로 처리하는 리스너이므로 `linking.config.screens`에 포함하지 않는다 — 이 부분은
`LoginScreen.tsx`의 `Linking.createURL('auth/callback')` 호출을 포함해 변경하지 않는다.

- [ ] **Step 1: `RootNavigator.tsx`에 `linking` config 추가**

```tsx
// apps/waylog-app/src/app/RootNavigator.tsx
import { NavigationContainer, type LinkingOptions } from '@react-navigation/native'
// ...

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['waylog://', 'https://waylog.me', 'https://www.waylog.me'],
  config: {
    screens: {
      TripInvite: 'trip/invite/:shareLink',
    },
  },
}

export function RootNavigator() {
  return (
    // ...
            <NavigationContainer linking={linking}>
    // ...
  )
}
```

- [ ] **Step 2: 타입 검증**

Run: `cd apps/waylog-app && pnpm exec tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 3: 딥링크 동작 확인**

Run (시뮬레이터가 실행 중인 상태에서):
```bash
xcrun simctl openurl booted "waylog://trip/invite/test-share-link"
```
Expected: 앱이 이미 떠 있으면 `TripInvite` 화면으로 즉시 전환된다(`shareLink` 파라미터로
"test-share-link"를 받아 `useInvitedTrip` 조회를 시도 — 존재하지 않는 링크라 에러 화면이
떠도 정상, 확인 대상은 화면 전환 자체다).

앱을 완전히 종료한 뒤(cold start) 같은 명령을 실행해 콜드 스타트에서도 `TripInvite`로 바로
진입되는지 추가로 확인한다:
```bash
xcrun simctl terminate booted me.waylog.app
xcrun simctl openurl booted "waylog://trip/invite/test-share-link"
```

카카오 로그인 버튼을 눌러 로그인 플로우가 기존과 동일하게 동작하는지도 확인한다(콜백 URL이
화면 전환을 일으키지 않고 세션만 갱신하는지).

- [ ] **Step 4: Commit**

```bash
git add apps/waylog-app/src/app/RootNavigator.tsx
git commit -m "$(cat <<'EOF'
feat(앱): 여행 초대 딥링크를 react-navigation linking으로 연결한다

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: `useQueryParamState` route params 기반 정식 재구현

**Files:**
- Modify: `apps/waylog-app/src/shared/hooks/useQueryParamState.ts` (전체 재작성)
- Modify: `apps/waylog-app/src/features/explorer/PlaceDetailScreen.tsx` (임시 `useState` → 정식 재교체)
- Modify: `apps/waylog-app/src/features/explorer/explorer-filters/useExplorerFilterParams.ts`
- Modify: `apps/waylog-app/src/features/explorer/explorer-view/useExplorerViewMode.ts`
- Modify: `apps/waylog-app/src/features/user-profile/UserProfileScreen.tsx` (임시 `useState` → 정식 재교체)
- Modify: `apps/waylog-app/src/features/trip/trip-route/useActiveTripDay.ts` (임시 `useState` → 정식 재교체)
- Modify: `apps/waylog-app/src/features/trip/trip-route/TripRoutesContent.tsx` (임시 `useState` → 정식 재교체)
- Modify: `apps/waylog-app/src/features/trip/trip-create/TripCreateScreen.tsx` (임시 `useState` → 정식 재교체)
- Modify: `apps/waylog-app/src/features/trip/trip-basic-info/TripBasicInfoContent.tsx` (임시 `useState` → 정식 재교체)

**Interfaces:**
- Consumes: `useAppNavigation`, `useAppRoute` (Task 2)
- Produces: `useQueryParamState<T>(key, options): [T, Dispatch<T>]` (시그니처 무변경, 9곳 호출부는
  이 태스크에서 손대지 않는다 — 단, Task 4~6에서 임시로 `useState`로 바꿔둔 8곳은 원래
  `useQueryParamState` 호출로 되돌린다)

**배경**: Task 4~6에서 앱이 계속 실행 가능한 상태를 유지하기 위해 9곳 중 8곳
(`TripBasicInfoContent`, `TripRoutesContent`, `useActiveTripDay`, `TripCreateScreen`,
`UserProfileScreen`, `PlaceDetailScreen`)을 임시로 `useState`로 바꿔뒀다(`useExplorerFilterParams`,
`useExplorerViewMode`는 아직 손대지 않음 — Task 6에서 명시적으로 건드리지 않았다). 이 태스크에서
`useQueryParamState` 자체를 route params 기반으로 정식 재구현하고, 임시로 바꿨던 곳을 전부
원래 훅 호출로 되돌린다.

- [ ] **Step 1: `useQueryParamState.ts`를 route params 기반으로 재작성**

```ts
// apps/waylog-app/src/shared/hooks/useQueryParamState.ts
import { useCallback, useEffect, useState } from 'react'
import { useAppNavigation, useAppRoute } from './useAppNavigation'

interface OptionWithDefault<T> {
  parse?: (value: string) => T
  defaultValue: T | (() => T)
}

interface Options<T> {
  parse?: (value?: string) => T
  defaultValue?: T | (() => T)
}

type Dispatch<A> = (value: A) => void

export function useQueryParamState<T>(key: string, options: OptionWithDefault<T>): [T, Dispatch<T>]
export function useQueryParamState<T>(
  key: string,
  options?: Options<T>,
): [T | undefined, Dispatch<T | undefined>]

export function useQueryParamState<T>(
  key: string,
  { defaultValue, parse }: Options<T> | OptionWithDefault<T> = {},
) {
  const navigation = useAppNavigation()
  const route = useAppRoute()

  const raw = (route.params as Record<string, unknown> | undefined)?.[key]
  const param = typeof raw === 'string' ? raw : undefined

  const resolvedFromParam = useMemo(() => {
    if (param == null) {
      return defaultValue instanceof Function ? defaultValue() : defaultValue
    }

    if (param === '') return undefined

    return parse != null ? parse(param) : param
  }, [param])

  // navigation.setParams 도 router.setParams 와 마찬가지로 다음 렌더에야 반영될 수 있다.
  // 그 사이 param 이 순간적으로 이전 값(또는 defaultValue)으로 읽히면 화면이 한 프레임
  // 초기화된 것처럼 깜빡인다. 요청 즉시 반영되는 로컬 값을 두고, params 가 실제로 그
  // 값에 수렴하면 그대로 유지한다.
  const [optimisticValue, setOptimisticValue] = useState(resolvedFromParam)

  useEffect(() => {
    setOptimisticValue(resolvedFromParam)
  }, [resolvedFromParam])

  const setValue = useCallback(
    (next: T) => {
      setOptimisticValue(next)
      navigation.setParams({ [key]: next == null ? '' : String(next) } as never)
    },
    [key, navigation],
  )

  return [optimisticValue, setValue]
}
```

`useMemo`를 새로 import해야 한다(`import { useCallback, useEffect, useMemo, useState } from 'react'`).

- [ ] **Step 2: 8곳의 임시 `useState`를 `useQueryParamState` 호출로 되돌림**

```tsx
// TripBasicInfoContent.tsx
// 변경 전(Task 5에서 임시): const [currentTab, setCurrentTab] = useState('default')
// 변경 후:
import { useQueryParamState } from '../../../shared/hooks/useQueryParamState'
const [currentTab, setCurrentTab] = useQueryParamState('info-tab', { defaultValue: 'default' })
```

```ts
// useActiveTripDay.ts
// 변경 전(Task 5에서 임시): const [value, update] = useState<string>(() => getDefaultTripDay(...))
// 변경 후:
import { useQueryParamState } from '../../../shared/hooks/useQueryParamState'
const [value, update] = useQueryParamState<string>('days', {
  defaultValue: () => getDefaultTripDay(trip, new Date().toISOString().split('T')[0]!),
})
```

```tsx
// TripRoutesContent.tsx
// 변경 전(Task 5에서 임시): const [selectedRouteId, setSelectedRouteId] = useState<string>(() => routes[0]?.id ?? '')
// 변경 후:
import { useQueryParamState } from '../../../shared/hooks/useQueryParamState'
const [selectedRouteId, setSelectedRouteId] = useQueryParamState<string>('route-id', {
  defaultValue: () => routes[0]?.id ?? '',
})
```

```tsx
// TripCreateScreen.tsx
// 변경 전(Task 6에서 임시): const [step, setStep] = useState<Step>('destination')
// 변경 후:
import { useQueryParamState } from '../../../shared/hooks/useQueryParamState'
const [step, setStep] = useQueryParamState<Step>('step', { defaultValue: 'destination' })
```

```tsx
// UserProfileScreen.tsx
// 변경 전(Task 4에서 임시): const [currentTab, selectTab] = useState<ProfileTab>('feed')
// 변경 후:
import { useQueryParamState } from '../../shared/hooks/useQueryParamState'
const [currentTab, selectTab] = useQueryParamState<ProfileTab>('tab', { defaultValue: 'feed', parse: parseProfileTab })
```

```tsx
// PlaceDetailScreen.tsx
// 변경 전(Task 6에서 임시): const [currentTab, selectTab] = useState<PlaceDetailTab>('info')
// 변경 후:
import { useQueryParamState } from '../../shared/hooks/useQueryParamState'
const [currentTab, selectTab] = useQueryParamState<PlaceDetailTab>('tab', {
  defaultValue: 'info',
  parse: parsePlaceDetailTab,
})
```

- [ ] **Step 3: `useExplorerFilterParams`, `useExplorerViewMode` 동작 확인**

이 두 훅은 Task 4~6에서 손대지 않았다 — `useQueryParamState`를 그대로 호출하고 있었으므로
Step 1의 재구현이 적용되면 자동으로 route params 기반으로 동작한다. 코드 변경 없이 동작만
확인한다.

- [ ] **Step 4: 타입 검증**

Run: `cd apps/waylog-app && pnpm exec tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 5: 실기기/시뮬레이터 확인 — Review Focus의 낙관적 업데이트 항목 집중 확인**

Run: `pnpm --filter waylog-app ios`

다음을 실기기에서 빠르게 반복해 깜빡임이나 이전 값으로의 역행이 없는지 확인한다:
- 여행 상세 "정보" 탭에서 기본정보/체크리스트/메모/교통편 탭을 빠르게 연속 전환
- 여행 상세 "계획" 탭에서 날짜와 경로를 빠르게 연속 전환
- 탐색 → 장소 상세에서 기본정보/피드 탭을 빠르게 연속 전환
- 프로필 화면에서 피드/기록 탭을 빠르게 연속 전환
- 여행 만들기 위저드에서 뒤로/앞으로 스텝 이동

Expected: 탭 전환 시 화면이 한 프레임 이전 상태로 돌아가거나 깜빡이지 않는다(Review Focus의
"낙관적 업데이트가 실제로 동작하는지" 항목).

- [ ] **Step 6: Commit**

```bash
git add apps/waylog-app/src/shared/hooks/useQueryParamState.ts apps/waylog-app/src/features/explorer/PlaceDetailScreen.tsx apps/waylog-app/src/features/user-profile/UserProfileScreen.tsx apps/waylog-app/src/features/trip/trip-route/useActiveTripDay.ts apps/waylog-app/src/features/trip/trip-route/TripRoutesContent.tsx apps/waylog-app/src/features/trip/trip-create/TripCreateScreen.tsx apps/waylog-app/src/features/trip/trip-basic-info/TripBasicInfoContent.tsx
git commit -m "$(cat <<'EOF'
feat(앱): useQueryParamState를 route params 기반으로 재구현한다

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: expo-router 제거, 폼 퍼널 검증, 최종 정리

**Files:**
- Delete: `apps/waylog-app/app/` (디렉토리 전체)
- Modify: `apps/waylog-app/package.json` (`expo-router` 의존성 제거)
- Modify: `apps/waylog-app/app.config.ts` (`expo-router` 플러그인 제거)
- Modify: `apps/waylog-app/src/app/NotYetMigratedScreen.tsx` (삭제 — 더 이상 쓰이지 않음)
- Modify: `apps/waylog-app/src/app/HomeTabs.tsx`, `RootNavigator.tsx` (`NotYetMigratedScreen`
  import·등록 제거)
- Modify: 실행 스크립트에서 `EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK` 제거(있다면)

**Interfaces:**
- Consumes: 없음(정리 태스크)

- [ ] **Step 1: `app/` 디렉토리 삭제**

```bash
rm -rf apps/waylog-app/app
```

- [ ] **Step 2: `NotYetMigratedScreen` 제거**

`apps/waylog-app/src/app/NotYetMigratedScreen.tsx` 파일을 삭제하고,
`RootNavigator.tsx`에서 이 컴포넌트를 참조하는 `RootStack.Screen` 등록이 이제 하나도 없는지
확인한다(Task 6 Step 10에서 전부 실제 스크린으로 교체했으므로 이미 없어야 정상 — 남아있다면
빠뜨린 라우트다).

```bash
rm apps/waylog-app/src/app/NotYetMigratedScreen.tsx
```

- [ ] **Step 3: `expo-router` 의존성과 플러그인 제거**

`apps/waylog-app/package.json`에서 `dependencies.expo-router` 줄을 삭제한다.

`apps/waylog-app/app.config.ts`에서 `plugins` 배열의 `"expo-router"` 항목을 삭제한다:

```ts
// 변경 전:
// plugins: [
//   "expo-router",
//   "expo-web-browser",
//   ...
// ]
// 변경 후:
plugins: [
  "expo-web-browser",
  // ...
]
```

- [ ] **Step 4: 의존성 재설치**

Run: `cd apps/waylog-app && pnpm install`
Expected: `expo-router`와 그 하위 의존성이 제거된 채로 설치 완료.

- [ ] **Step 5: 네이티브 프로젝트 재생성**

`expo-router`는 config plugin으로 네이티브 설정을 건드리므로, 제거 후 반드시 prebuild를
다시 돌린다.

Run:
```bash
cd apps/waylog-app
rm -rf ios android
pnpm exec expo prebuild --platform ios
```

- [ ] **Step 6: 타입 검증**

Run: `cd apps/waylog-app && pnpm exec tsc --noEmit`
Expected: 에러 없음. `expo-router` 관련 타입 참조가 전부 사라졌으므로 어딘가 남아있었다면
여기서 "Cannot find module 'expo-router'" 에러로 드러난다.

- [ ] **Step 7: 폼 퍼널 동작 확인 (이번 전환의 원래 동기)**

Run: `pnpm --filter waylog-app ios --device` (또는 시뮬레이터)
Expected: `PostFormFunnel`(포스트 작성 3단계)과 `TransportFormFunnel`(교통편 작성 폼)이
`EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK` 없이도 정상 동작한다 — 더 이상 그 환경변수 자체가
필요 없다(expo-router가 프로젝트에서 완전히 빠졌으므로 애초에 그 검사 코드가 실행되지 않는다).
Xcode 27 Device Hub에서 앱이 정상적으로 빌드·설치·실행되는지도 함께 확인한다(SDK 57 업그레이드의
원래 목표).

- [ ] **Step 8: 전체 경로 회귀 확인**

Task 4~7의 "실기기/시뮬레이터 확인" 스텝에서 확인했던 모든 경로(4개 탭, TripDetail 5개 탭,
평면 라우트 전체, 딥링크)를 한 번 더 빠르게 훑어 빠진 게 없는지 최종 확인한다.

- [ ] **Step 9: 유닛 테스트 실행**

Run: `cd apps/waylog-app && pnpm test`
Expected: 기존 122개 테스트가 모두 통과한다(SDK 업그레이드 커밋 시점과 동일 — 이번 전환은
UI 컴포넌트만 건드렸으므로 순수 로직 테스트에는 영향이 없어야 한다).

- [ ] **Step 10: `docs/codebase.md` 갱신**

`docs/codebase.md`의 "앱 (`apps/waylog-app`)" 기술 스택 표에서 `Routing` 항목을
`Expo Router 6 (파일 기반)`에서 `@react-navigation 7 (코드 기반 트리, src/app/routes.ts)`로
수정한다. `## 디렉토리 구조`의 `app/` 관련 설명도 삭제하고 `src/app/`(routes.ts,
RootNavigator.tsx, HomeTabs.tsx) 설명으로 교체한다.

- [ ] **Step 11: Commit**

```bash
git add -A apps/waylog-app docs/codebase.md
git commit -m "$(cat <<'EOF'
chore(앱): expo-router를 제거하고 react-navigation 전환을 마무리한다

app/ 디렉토리, expo-router 의존성·플러그인을 제거하고 네이티브
프로젝트를 재생성한다. 폼 퍼널이 EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK
없이 정상 동작하는 것으로 이번 전환의 원래 동기가 해소됐음을 확인했다.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```
```
