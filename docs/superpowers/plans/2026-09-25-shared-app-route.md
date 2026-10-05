# 웹-앱 AppRoute 통합 & 라우트 파라미터 co-location Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 웹의 `AppRoute`(경로 문자열 상수)를 웹/앱 공유 패키지로 옮겨 URL 경로 문자열의 단일 소스로 삼고, 앱의 라우트 파라미터 타입을 화면 파일이 직접 선언하는 co-location 구조로 바꾼다.

**Architecture:** 새 패키지 `@waylog/routes`에 `AppRoute`(한글 키, 콜론 기반 경로 문자열)를 둔다. 웹은 그대로 참조한다. 앱은 콜론이 react-navigation 스크린 이름과 충돌하는 문제를 로컬 치환 상수(`AppRoute.ts`)로 흡수하고, 화면 파일이 `declare module '~app/routes'`로 자기 파라미터 타입을 `RouteParamsRegistry`에 등록해 `RootStackParamList`를 자동 합성한다.

**Tech Stack:** TypeScript declaration merging, pnpm workspace, react-navigation v7, React Router v7

**Spec:** `docs/superpowers/specs/2026-09-25-shared-app-route-design.md`

## Global Constraints

- `AppRoute`의 한글 키와 콜론 기반 경로 문자열 값은 그대로 유지한다 — 변경 대상은 "어디 있는가"이지 "값이 무엇인가"가 아니다.
- react-navigation 스크린 이름에는 절대 콜론이 든 원본 `AppRoute` 값을 직접 쓰지 않는다. 반드시 앱 로컬 `AppRoute.ts`가 `toScreenName`으로 치환한 값을 쓴다.
- `declare module`의 대상은 상대경로가 아니라 tsconfig `paths` 별칭 `~app/routes`를 쓴다.
- `RouteParamsRegistry`의 등록 키는 화면 파일이 임의로 짓지 않고 `@waylog/routes`의 `AppRoute` 값을 그대로 쓴다.
- 웹 사용부의 `AppRoute` 참조 방식(`route()`, `generatePath()`, `navigate()`, `<Link>` 등)은 이번 작업에서 변경하지 않는다 — import 출처만 바뀐다.
- 앱의 41곳 네비게이션 호출부(`navigation.navigate/reset/replace`)는 이번 작업에서 손대지 않는다 — `useAppNavigation()` 내부에서 흡수한다.
- `TripDetailChecklist`는 이미 죽은 코드로 확인되어 별도 커밋(`7082d9ac`)으로 제거됐다 — 이 계획의 co-location 대상에서 제외한다.

## Review Focus

- **`toScreenName`의 멱등성**: `route.name`(이미 치환된 값)을 저장했다가 `navigate()`에 재사용하는 `auth-redirect.tsx`의 왕복 케이스가 실제로 안전한지 테스트로 확인한다. 가장 먼저 깨질 수 있는 지점이며 스펙이 명시적으로 지목한 리스크다.
- **linking.config 키/값 불일치**: `registerLinkingScreens`가 만드는 키(치환본)와 `RootStack.Screen name`에 등록된 값이 다른 소스에서 나오면 딥링크가 조용히 실패한다. 두 값이 항상 같은 로컬 `AppRoute` 상수에서 나오는지 확인하는 테스트가 필요하다.
- **declaration merging 누락**: 화면 파일이 `RootNavigator.tsx`에서 import되지 않는 예외 케이스(조건부 렌더링, 지연 로딩)가 있으면 `RouteParamsRegistry`에 그 화면의 타입이 비어 타입 에러 없이 조용히 `unknown`/`never`로 좁아질 수 있다. 16개 화면 전부가 실제로 import되는지 확인한다.
- **`~app/routes` 별칭이 에디터와 CI 양쪽에서 동일하게 해석되는지**: tsconfig `paths` 별칭을 통한 `declare module` 대상 해석이 `tsc --noEmit`(CI)과 에디터의 TS 서버에서 다르게 동작하면, 로컬에서는 타입이 보이는데 CI에서만 깨지는 식의 불일치가 생긴다.
- **웹 23개 파일의 import 전환 누락**: 51회 참조 중 하나라도 옛 경로(`~app/routes`)를 그대로 남기면 타입은 통과해도 런타임에 두 개의 서로 다른 `AppRoute` 객체가 존재하게 된다(웹 자체 `routes.ts`에 남은 것 vs `@waylog/routes`). import 전환은 전수 확인 대상이다.

---

## 현재 상태 (조사 결과 요약)

- 웹 `AppRoute`: 21개 키, `apps/waylog-web/src/app/routes.ts:8-30`. 이미 `~app/routes`(tsconfig `~*` 별칭)로 23개 파일, 51회 참조됨.
- 앱 `RootStackParamList`: 16개 키(`TripDetailChecklist` 제거 후), `apps/waylog-app/src/app/routes.ts:9-26`.
- 웹-앱 대응 관계 (완전 대응 9개, 이름은 다르나 매핑 가능 7개, 웹 전용 5개 — `여행_채팅`/`피드`/`탐색`/`통계`/`어드민_여행_목록`):

| 웹 `AppRoute` 키 | 웹 경로 | 앱 `RootStackParamList` 키 |
|---|---|---|
| `메인` | `/` | `Home` |
| `로그인` | `/login` | `Login` |
| `여행_상세` | `/trip/:tripId` | `TripDetail` |
| `여행_메모_상세` | `/trip/:tripId/memo/:memoId` | `TripMemoDetail` |
| `여행_메모_편집` | `/trip/:tripId/memo/:memoId/edit` | `TripMemoEdit` |
| `여행_생성` | `/trip/new` | `TripCreate` |
| `여행_교통편_추가` | `/trip/:tripId/transport/new` | `TransportNew` |
| `여행_교통편_상세` | `/trip/:tripId/transport/:transportId` | `TransportDetail` |
| `여행_초대` | `/trip/invite/:shareLink` | `TripInvite` |
| `장소_상세` | `/place/:placeId` | `ExplorerDetail` |
| `유저_프로필` | `/u/:userId` | `UserProfile` |
| `포스트_생성` | `/post/new` | `PostNew` |
| `포스트_상세` | `/post/:postId` | `PostDetail` |
| `장소_최다방문순` | `/explorer/top-visited` | `ExplorerTopVisited` |
| `장소_급상승` | `/explorer/recent-hot` | `ExplorerRecentHot` |
| `장소_저장순` | `/explorer/most-saved` | `ExplorerMostSaved` |

- `useAppRoute<T>()` 직접 호출: 13곳. `ExplorerTopVisited`/`ExplorerRecentHot`/`ExplorerMostSaved`/`TripCreate`/`Home`은 다른 방식(`useQueryParamState` 등)으로 파라미터를 읽는 것으로 추정 — Task 3에서 실제로 확인한다.
- `TripDetailHeader.tsx`는 스크린 파일이 아니지만 `'TripDetail'` 타입을 재사용 — 자기 타입을 새로 선언하지 않고 `TripDetailScreen.tsx`가 등록한 것에 얹혀간다.
- `apps/waylog-app/tsconfig.json`은 현재 `~/shared/components/design-system` 항목만 있고 `~*` 와일드카드가 없다 — `~app/routes` 항목을 개별로 추가한다.

---

### Task 1: `@waylog/routes` 패키지 생성 및 웹 이전

**Files:**
- Create: `packages/routes/package.json`
- Create: `packages/routes/src/appRoute.ts`
- Create: `packages/routes/src/index.ts`
- Modify: `apps/waylog-web/src/app/routes.ts:1-30` (AppRoute 상수 제거, import로 교체)
- Modify: `apps/waylog-web/package.json` (의존성 추가)

**Interfaces:**
- Produces: `AppRoute` — `@waylog/routes`가 export하는 상수. 타입은 현재 `apps/waylog-web/src/app/routes.ts:8-30`과 정확히 동일한 리터럴 객체 타입(`as const`).

- [ ] **Step 1: 패키지 스캐폴딩**

`packages/routes/package.json`:

```json
{
  "name": "@waylog/routes",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  }
}
```

- [ ] **Step 2: AppRoute 상수 이전**

`packages/routes/src/appRoute.ts` (내용은 `apps/waylog-web/src/app/routes.ts:8-30`을 그대로 복사):

```ts
export const AppRoute = {
  메인: "/",
  통계: "/statistics",
  탐색: "/explorer",
  여행_상세: "/trip/:tripId",
  여행_채팅: "/trip/:tripId/chat",
  여행_메모_상세: "/trip/:tripId/memo/:memoId",
  여행_메모_편집: "/trip/:tripId/memo/:memoId/edit",
  여행_생성: "/trip/new",
  여행_교통편_추가: "/trip/:tripId/transport/new",
  여행_교통편_상세: "/trip/:tripId/transport/:transportId",
  여행_초대: "/trip/invite/:shareLink",
  로그인: "/login",
  피드: "/feed",
  장소_상세: "/place/:placeId",
  유저_프로필: "/u/:userId",
  포스트_생성: "/post/new",
  포스트_상세: "/post/:postId",
  어드민_여행_목록: "/admin/trips",
  장소_최다방문순: "/explorer/top-visited",
  장소_급상승: "/explorer/recent-hot",
  장소_저장순: "/explorer/most-saved",
} as const
```

`packages/routes/src/index.ts`:

```ts
export { AppRoute } from './appRoute'
```

- [ ] **Step 3: 웹 routes.ts에서 AppRoute 제거하고 import로 교체**

`apps/waylog-web/src/app/routes.ts`의 1~30행(현재 `import { ... } from "@react-router/dev/routes"`와 `export const AppRoute = {...}`)을 다음으로 교체:

```ts
import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";
import { AppRoute } from "@waylog/routes";

export { AppRoute };
```

(라우트 트리 정의 `export default [...]`는 그대로 둔다 — `AppRoute.X` 참조는 그대로 동작한다.)

- [ ] **Step 4: 웹 package.json에 의존성 추가**

```bash
cd apps/waylog-web
pnpm add "@waylog/routes@workspace:*"
```

- [ ] **Step 5: 웹 23개 파일의 import 경로 전환**

`apps/waylog-web/src` 전체에서 `from '~app/routes'` 또는 `from "~app/routes"`를 검색해, `AppRoute`만 import하는 곳은 `@waylog/routes`로, 라우트 트리(`export default`)를 함께 import하는 곳(있다면)은 그대로 둔다.

```bash
grep -rl "from '~app/routes'" apps/waylog-web/src --include="*.tsx" --include="*.ts"
grep -rl 'from "~app/routes"' apps/waylog-web/src --include="*.tsx" --include="*.ts"
```

나온 23개 파일 각각에서 `import { AppRoute } from '~app/routes'` → `import { AppRoute } from '@waylog/routes'`로 치환한다(따옴표 스타일은 파일 기존 스타일 유지).

- [ ] **Step 6: 타입 체크로 검증**

Run: `cd apps/waylog-web && pnpm exec tsc --noEmit`
Expected: 에러 0건. `AppRoute` 관련 타입 에러가 하나라도 있으면 Step 5의 전환 누락.

- [ ] **Step 7: 웹 테스트 실행**

Run: `cd apps/waylog-web && pnpm test`
Expected: 기존 통과하던 테스트 전부 통과 (AppRoute 값 자체는 안 바뀌었으므로 실패해선 안 됨).

- [ ] **Step 8: 커밋**

```bash
git add packages/routes apps/waylog-web/src/app/routes.ts apps/waylog-web/package.json pnpm-lock.yaml
# Step 5에서 수정한 23개 파일도 추가
git commit -m "feat(라우팅): AppRoute를 @waylog/routes 패키지로 옮긴다"
```

---

### Task 2: 앱 로컬 AppRoute (콜론 치환) 및 tsconfig 별칭

**Files:**
- Create: `apps/waylog-app/src/app/AppRoute.ts`
- Create: `apps/waylog-app/src/app/registerLinkingScreens.ts`
- Modify: `apps/waylog-app/tsconfig.json`
- Modify: `apps/waylog-app/package.json` (의존성 추가)
- Test: `apps/waylog-app/src/app/AppRoute.test.ts`
- Test: `apps/waylog-app/src/app/registerLinkingScreens.test.ts`

**Interfaces:**
- Consumes: `AppRoute`(`@waylog/routes`, Task 1에서 생성)
- Produces: `toScreenName(path: string): string`, `AppRoute`(앱 로컬, 치환된 값, `typeof BaseAppRoute`와 동일한 키 구조), `registerLinkingScreens(paths: readonly string[]): Record<string, string>`

- [ ] **Step 1: 앱 package.json에 의존성 추가**

```bash
cd apps/waylog-app
pnpm add "@waylog/routes@workspace:*"
```

- [ ] **Step 2: toScreenName 실패하는 테스트 작성**

`apps/waylog-app/src/app/AppRoute.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { toScreenName } from './AppRoute'

describe('toScreenName', () => {
  it('콜론을 언더스코어로 치환한다', () => {
    expect(toScreenName('/trip/:tripId')).toBe('/trip/_tripId')
  })

  it('콜론이 여러 개면 전부 치환한다', () => {
    expect(toScreenName('/trip/:tripId/memo/:memoId')).toBe('/trip/_tripId/memo/_memoId')
  })

  it('콜론이 없으면 그대로 반환한다(멱등성)', () => {
    expect(toScreenName('/trip/_tripId')).toBe('/trip/_tripId')
  })
})
```

- [ ] **Step 3: 테스트 실패 확인**

Run: `cd apps/waylog-app && pnpm exec vitest run src/app/AppRoute.test.ts`
Expected: FAIL — `Cannot find module './AppRoute'`

- [ ] **Step 4: AppRoute.ts 구현**

`apps/waylog-app/src/app/AppRoute.ts`:

```ts
// react-navigation 스크린 이름에 콜론(:)이 들어가면 getPatternParts가
// path 파라미터 문법으로 오인해 예외를 던질 수 있다(alias·중첩 조합 시).
// 그래서 앱은 원본 AppRoute 대신 콜론을 치환한 이 버전만 스크린 이름으로 쓴다.
import { AppRoute as BaseAppRoute } from '@waylog/routes'

export function toScreenName(path: string): string {
  return path.replaceAll(':', '_')
}

export const AppRoute = Object.fromEntries(
  Object.entries(BaseAppRoute).map(([key, value]) => [key, toScreenName(value)]),
) as typeof BaseAppRoute
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `cd apps/waylog-app && pnpm exec vitest run src/app/AppRoute.test.ts`
Expected: PASS 3/3

- [ ] **Step 6: registerLinkingScreens 실패하는 테스트 작성**

`apps/waylog-app/src/app/registerLinkingScreens.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { registerLinkingScreens } from './registerLinkingScreens'

describe('registerLinkingScreens', () => {
  it('치환된 이름을 키로, 원본 경로를 값으로 매핑한다', () => {
    expect(registerLinkingScreens(['/trip/invite/:shareLink'])).toEqual({
      '/trip/invite/_shareLink': '/trip/invite/:shareLink',
    })
  })

  it('여러 경로를 한 번에 등록한다', () => {
    expect(registerLinkingScreens(['/', '/trip/invite/:shareLink'])).toEqual({
      '/': '/',
      '/trip/invite/_shareLink': '/trip/invite/:shareLink',
    })
  })
})
```

- [ ] **Step 7: 테스트 실패 확인**

Run: `cd apps/waylog-app && pnpm exec vitest run src/app/registerLinkingScreens.test.ts`
Expected: FAIL — `Cannot find module './registerLinkingScreens'`

- [ ] **Step 8: registerLinkingScreens.ts 구현**

`apps/waylog-app/src/app/registerLinkingScreens.ts`:

```ts
import { toScreenName } from './AppRoute'

export function registerLinkingScreens(paths: readonly string[]): Record<string, string> {
  return Object.fromEntries(paths.map((path) => [toScreenName(path), path]))
}
```

- [ ] **Step 9: 테스트 통과 확인**

Run: `cd apps/waylog-app && pnpm exec vitest run src/app/registerLinkingScreens.test.ts`
Expected: PASS 2/2

- [ ] **Step 10: tsconfig에 `~app/routes` 별칭 추가**

`apps/waylog-app/tsconfig.json`의 `paths`에 추가:

```json
{
  "compilerOptions": {
    "paths": {
      "~/shared/components/design-system": ["./src/shared/components/design-system/index.ts"],
      "~/shared/components/design-system/*": ["./src/shared/components/design-system/*"],
      "~app/routes": ["./src/app/routes.ts"]
    }
  }
}
```

- [ ] **Step 11: 전체 테스트 실행**

Run: `cd apps/waylog-app && pnpm test`
Expected: 기존 테스트 전부 통과 + 새로 추가한 5개 테스트 통과.

- [ ] **Step 12: 커밋**

```bash
git add apps/waylog-app/src/app/AppRoute.ts apps/waylog-app/src/app/AppRoute.test.ts \
  apps/waylog-app/src/app/registerLinkingScreens.ts apps/waylog-app/src/app/registerLinkingScreens.test.ts \
  apps/waylog-app/tsconfig.json apps/waylog-app/package.json pnpm-lock.yaml
git commit -m "feat(앱): 콜론 충돌을 피하는 로컬 AppRoute와 linking 등록 헬퍼를 추가한다"
```

---

### Task 3: RootStackParamList를 RouteParamsRegistry declaration merging으로 교체

**Files:**
- Modify: `apps/waylog-app/src/app/routes.ts`
- Modify: 화면 파일 16개 (아래 목록)
- Modify: `apps/waylog-app/src/app/RootNavigator.tsx` (스크린 이름·linking 교체)
- Modify: `apps/waylog-app/src/shared/hooks/useAppNavigation.ts` (import 경로만)
- Modify: `apps/waylog-app/src/features/auth/auth-redirect.tsx` (import 경로만)
- Modify: `apps/waylog-app/src/features/trip/components/TripDetailHeader.tsx` (타입만 재사용, 자체 declare 없음)

**Interfaces:**
- Consumes: `AppRoute`(`@waylog/routes`, path 값), `AppRoute`(앱 로컬, `apps/waylog-app/src/app/AppRoute.ts`, 스크린 이름 값)
- Produces: `RootStackParamList`(`RouteParamsRegistry`의 재수출, 기존과 동일한 키·값 형태를 유지해 소비 코드 무변경)

**주의**: 이 태스크는 16개 화면 파일을 전부 바꿔야 하므로 파일 단위로 나눠 진행한다. 각 화면 파일은 독립적으로 수정 가능하지만(서로 다른 파일이므로), `routes.ts`(RouteParamsRegistry 인터페이스 선언)는 모든 화면이 공유하는 파일이라 먼저 바꿔야 한다.

- [ ] **Step 1: routes.ts를 RouteParamsRegistry 방식으로 교체**

`apps/waylog-app/src/app/routes.ts` 전체를 다음으로 교체:

```ts
export interface RouteParamsRegistry {}

export type RootStackParamList = RouteParamsRegistry

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

(`HomeTabParamList`, `TripDetailTabParamList`는 스펙 범위 밖이므로 그대로 유지. `ExplorerFilterParams`는 각 탐색 화면의 declare module 블록 안으로 옮기거나, 여러 화면이 공유하므로 `@waylog/routes`에 타입으로 옮기는 것도 고려할 수 있으나 — 이 계획에서는 각 화면 파일에서 개별적으로 동일한 구조를 선언하는 것으로 단순화한다.)

- [ ] **Step 2: 컴파일 확인 (의도적으로 깨지는 상태)**

Run: `cd apps/waylog-app && pnpm exec tsc --noEmit 2>&1 | wc -l`
Expected: 다수의 에러(모든 `useAppRoute<'TripDetail'>()` 등 호출부가 `RootStackParamList`에 해당 키가 없다고 실패). 이 에러 개수를 기록해두고, 화면을 하나씩 옮길 때마다 줄어드는지 확인한다.

- [ ] **Step 3: TripDetail 화면 co-location**

`apps/waylog-app/src/features/trip/TripDetailScreen.tsx` 상단에 추가:

```ts
import { AppRoute } from '@waylog/routes'

export type TripDetailParams = { tripId: string }

declare module '~app/routes' {
  interface RouteParamsRegistry {
    [AppRoute.여행_상세]: TripDetailParams
  }
}
```

기존 `useAppRoute<'TripDetail'>()` 호출을 `useAppRoute<typeof AppRoute.여행_상세>()`로 변경.

- [ ] **Step 4: TripDetailHeader.tsx는 새로 선언하지 않고 같은 키 참조로 교체**

`apps/waylog-app/src/features/trip/components/TripDetailHeader.tsx:32`의 `useAppRoute<'TripDetail'>()`를:

```ts
import { AppRoute } from '@waylog/routes'
// ...
useAppRoute<typeof AppRoute.여행_상세>()
```

로 변경(자체 `declare module` 블록은 추가하지 않는다 — Step 3에서 이미 등록됨).

- [ ] **Step 5: 나머지 co-location 대상 화면 13개를 Step 3~4와 같은 패턴으로 반복**

각 화면 파일에서 `export type XxxParams = {...}`(기존 `RootStackParamList`의 해당 값 그대로), `declare module '~app/routes' { interface RouteParamsRegistry { [AppRoute.웹키]: XxxParams } }`, 호출부의 `useAppRoute<'Xxx'>()` → `useAppRoute<typeof AppRoute.웹키>()` 교체.

| 화면 파일 | 기존 RootStackParamList 키 | 대응 웹 AppRoute 키 |
|---|---|---|
| `apps/waylog-app/src/features/auth/LoginRoute.tsx` | `Login` | `로그인` |
| `apps/waylog-app/src/app/HomeTabs.tsx` (Home 자체는 `undefined`이므로 타입 선언 생략 가능 — Step 6에서 별도 확인) | `Home` | `메인` |
| `apps/waylog-app/src/features/trip/trip-memo/TripMemoDetailScreen.tsx` | `TripMemoDetail` | `여행_메모_상세` |
| `apps/waylog-app/src/features/trip/trip-memo/TripMemoEditScreen.tsx` | `TripMemoEdit` | `여행_메모_편집` |
| `apps/waylog-app/src/features/trip/trip-create/TripCreateScreen.tsx` | `TripCreate` | `여행_생성` |
| `apps/waylog-app/src/features/trip/trip-invite/TripInviteScreen.tsx` | `TripInvite` | `여행_초대` |
| `apps/waylog-app/src/features/explorer/PlaceDetailScreen.tsx` | `ExplorerDetail` | `장소_상세` |
| `apps/waylog-app/src/features/explorer/explorer-ranking/TopVisitedScreen.tsx` | `ExplorerTopVisited` | `장소_최다방문순` |
| `apps/waylog-app/src/features/explorer/explorer-recent/RecentHotScreen.tsx` | `ExplorerRecentHot` | `장소_급상승` |
| `apps/waylog-app/src/features/explorer/explorer-saved/MostSavedScreen.tsx` | `ExplorerMostSaved` | `장소_저장순` |
| `apps/waylog-app/src/features/post/PostCreationScreen.tsx` | `PostNew` | `포스트_생성` |
| `apps/waylog-app/src/features/post/PostDetailScreen.tsx` | `PostDetail` | `포스트_상세` |
| `apps/waylog-app/src/features/user-profile/UserProfileDetailScreen.tsx` | `UserProfile` | `유저_프로필` |
| `apps/waylog-app/src/features/trip/trip-transport/TransportCreationScreen.tsx` | `TransportNew` | `여행_교통편_추가` |
| `apps/waylog-app/src/features/trip/trip-transport/transport-detail/TransportDetailScreen.tsx` | `TransportDetail` | `여행_교통편_상세` |

각 화면의 파라미터 타입은 현재 `apps/waylog-app/src/app/routes.ts`(Task 3 Step 1 실행 전 버전, git에서 확인 가능)의 해당 키 값을 그대로 옮긴다. 예: `ExplorerTopVisited`/`ExplorerRecentHot`/`ExplorerMostSaved`는 `ExplorerFilterParams`(`location?/category?/'explorer-view-mode'?`)를 공유하므로, 이 세 화면 파일 각각에 동일한 타입을 반복 선언하거나 공용 타입 파일(`apps/waylog-app/src/features/explorer/explorerFilterParams.ts`)로 뽑아 셋이 import한다(권장: 후자 — 중복 방지).

- [ ] **Step 6: Home/HomeTabs 처리**

`Home: undefined`는 파라미터가 없으므로 `RouteParamsRegistry`에 등록하지 않으면 `RootStackParamList['Home']`이 `never`가 되어 `RootStack.Screen name={AppRoute.메인}` 등록 시 타입 에러가 날 수 있다. `apps/waylog-app/src/app/HomeTabs.tsx` 또는 `RootNavigator.tsx` 상단에:

```ts
import { AppRoute } from '@waylog/routes'

declare module '~app/routes' {
  interface RouteParamsRegistry {
    [AppRoute.메인]: undefined
    [AppRoute.로그인]: { returnTo?: { screen: keyof RootStackParamList; params?: Record<string, unknown> } }
  }
}
```

(`Login`의 원래 타입은 자기 자신인 `RootStackParamList`를 참조하는 재귀 타입이므로 `RootNavigator.tsx`처럼 두 화면을 다 아는 위치에 두는 것이 자연스럽다 — `LoginRoute.tsx`에 두면 `RootStackParamList`를 import해야 하는 순환 참조가 생길 수 있어 주의.)

- [ ] **Step 7: RootNavigator.tsx의 스크린 이름과 linking 설정 교체**

`apps/waylog-app/src/app/RootNavigator.tsx`:

```ts
import { AppRoute } from './AppRoute'
import { AppRoute as BaseAppRoute } from '@waylog/routes'
import { registerLinkingScreens } from './registerLinkingScreens'
// ...

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['waylog://', 'https://waylog.me', 'https://www.waylog.me'],
  config: {
    initialRouteName: AppRoute.메인,
    screens: registerLinkingScreens([BaseAppRoute.메인, BaseAppRoute.여행_초대]),
  },
}
```

그리고 각 `<RootStack.Screen name="TripDetail" .../>` 형태를 `<RootStack.Screen name={AppRoute.여행_상세} .../>`(로컬 치환 AppRoute 사용)로 전부 교체한다(16개 스크린 등록 전부).

`getId={({ params }) => params.tripId}`처럼 컴포넌트 내부에서 `RootStackParamList` 타입에 의존하는 부분은 스크린 이름이 바뀌어도 타입 자체는 `RouteParamsRegistry[AppRoute.여행_상세]`로 동일하게 해석되므로 변경 불필요.

- [ ] **Step 8: useAppNavigation.ts, auth-redirect.tsx의 import 경로 갱신**

`apps/waylog-app/src/shared/hooks/useAppNavigation.ts:3`:

```ts
import type { RootStackParamList, TripDetailTabParamList } from '~app/routes'
```

`apps/waylog-app/src/features/auth/auth-redirect.tsx:3`도 동일하게 `'../../app/routes'` → `'~app/routes'`로 변경.

- [ ] **Step 9: 전체 타입 체크**

Run: `cd apps/waylog-app && pnpm exec tsc --noEmit`
Expected: 에러 0건.

- [ ] **Step 10: 전체 테스트**

Run: `cd apps/waylog-app && pnpm test`
Expected: 기존 테스트 전부 통과.

- [ ] **Step 11: 커밋**

```bash
git add apps/waylog-app/src
git commit -m "feat(앱): RootStackParamList를 화면별 declare module 병합으로 교체한다"
```

---

### Task 4: 앱 실기기/시뮬레이터 동작 검증

**Files:** 없음(검증 전용 태스크)

**Interfaces:** 없음

- [ ] **Step 1: Metro 재시작 후 딥링크 동작 확인**

`pnpm ios`(또는 기존 dev client)로 앱을 실행하고, `xcrun simctl openurl booted "waylog://trip/invite/test-share-link"`(또는 실기기에서 해당 URL 클릭)로 `TripInvite` 화면이 정상적으로 뜨는지 확인한다.

Expected: 크래시 없이 `TripInviteScreen`이 `shareLink: 'test-share-link'`를 받아 렌더링됨. `getPatternParts` 관련 예외(스펙에서 조사한 그 위험)가 발생하지 않아야 한다.

- [ ] **Step 2: 로그인 리다이렉트 왕복 확인 (toScreenName 멱등성 실증)**

세션 만료 상태를 재현해(또는 인증이 필요한 화면에 로그아웃 상태로 진입) `RequireAuthRedirect`가 로그인 화면으로 보내고, 로그인 성공 후 원래 화면(예: `TripDetail`)으로 정확히 돌아오는지 확인한다.

Expected: 로그인 후 원래 보고 있던 여행 상세 화면으로 정확히 복귀. 화면 이름 불일치로 인한 크래시나 빈 화면이 없어야 한다.

- [ ] **Step 3: 여행 상세, 탐색 상세, 여행 초대 등 주요 화면 수동 순회**

Task 3의 대응표에 있는 16개 화면 중 최소 여행 상세/여행 초대/탐색 상세/포스트 상세 4개를 실제로 navigate해서 파라미터가 정상적으로 전달되는지 확인한다.

Expected: 크래시 없음, 각 화면이 올바른 tripId/placeId/postId 등을 받아 렌더링됨.

- [ ] **Step 4: 결과 기록**

문제 없으면 다음 커밋 없이 계획 완료로 표시. 문제 발견 시 systematic-debugging으로 원인 파악 후 해당 Task로 돌아가 수정.
