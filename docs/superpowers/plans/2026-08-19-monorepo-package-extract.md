# [3] 패키지 이전 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 플랫폼 비의존 도메인·데이터 계층을 `@waylog/domains`와 `@waylog/react`로 추출하고, RN 앱에서 로그인 → 여행 목록 조회가 동작하는 것을 확인한다.

**Architecture:** 환경변수 주입과 Proxy 지연 초기화로 `api` 계층의 Vite 의존을 끊는 것이 선행 조건이다. 그 다음 feature를 하나씩 옮기며 매번 웹 빌드와 RN 번들링을 검증한다. 컴포넌트(`.tsx`)는 옮기지 않는다.

**Tech Stack:** pnpm workspace, TypeScript 5.9, Supabase JS, TanStack Query 5, Expo SDK 54 (RN 0.81.5)

**Spec:** `docs/2026-08-19-monorepo-react-native-design.md`

## Global Constraints

- 패키지명은 `@waylog/domains`, `@waylog/react`
- `@waylog/domains`는 **서브트리 export**를 제공한다: `import { getTrips } from '@waylog/domains/trips'`
- 공유 패키지는 **환경변수를 직접 읽지 않는다.** `import.meta.env` / `process.env` 사용 금지
- 공유 패키지에 **컴포넌트(`.tsx`)를 넣지 않는다**
- 공유 패키지는 **MUI / react-router / DOM API에 의존하지 않는다**
- `@waylog/react`는 `@waylog/domains`를 import하지 않는다 (의존 방향은 domains → react)
- 웹 앱의 동작은 이전과 동일해야 한다. 각 태스크마다 `pnpm build`와 `pnpm test`로 확인한다
- 커밋 메시지는 한글, 스코프 활용

## 현황 실측

| 항목 | 수치 |
| --- | --- |
| `features/` 디렉토리 | 17 |
| `.api.ts` | 23 |
| `.utils.ts` / `.model.ts` / `.types.ts` | 37 |
| `use*.ts` 훅 (features) | 64 |
| `use*.ts` 훅 (shared) | 41 |
| 플랫폼 의존 훅 | 19 (공유 안 함) |

**컴포넌트가 0개인 feature (통째로 이전 가능):** `expense`(7), `marine-activity`(8), `route`(6), `tourism-trend`(10), `photo`(3), `tracking`(1)

**컴포넌트 비중이 큰 feature:** `trip`(170 중 110), `explorer`(41 중 30), `post`(26 중 15), `place`(25 중 14)

**제외 대상:**
- `photo.api.ts` — `heic-to`, `react-image-file-resizer` 사용. Canvas/FileReader 의존이라 RN에서 동작하지 않는다
- `auth.api.ts`의 push subscription 함수 3개 — 웹 표준 `PushSubscription` 타입을 받는다
- `useTripId`, `usePlaceId` — react-router 의존

---

### Task 1: 공유 패키지 골격 생성

두 패키지의 빈 껍데기를 만든다. 아직 코드를 옮기지 않는다.
`@waylog/react`를 별도 패키지로 두는 이유는 의존 방향이 반대이기 때문이다 —
`domains`가 `react`를 사용하고 그 역은 없다.

**Files:**
- Create: `packages/domains/package.json`
- Create: `packages/domains/tsconfig.json`
- Create: `packages/react/package.json`
- Create: `packages/react/tsconfig.json`

**Interfaces:**
- Consumes: 없음
- Produces: `@waylog/domains`, `@waylog/react` 패키지. Task 2 이후가 여기에 코드를 채운다

- [ ] **Step 1: `packages/react/package.json` 생성**

빌드 없이 소스를 그대로 노출한다. Metro와 Vite 모두 TS를 직접 처리할 수 있어
빌드 단계를 넣으면 개발 중 변경이 즉시 반영되지 않는다.

```json
{
  "name": "@waylog/react",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./*": "./src/*.ts"
  },
  "peerDependencies": {
    "react": ">=19"
  }
}
```

- [ ] **Step 2: `packages/domains/package.json` 생성**

서브트리 export를 위해 `./*` 패턴을 쓴다. `@waylog/domains/trips`가
`packages/domains/src/trips/index.ts`로 해석된다.

```json
{
  "name": "@waylog/domains",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./*": "./src/*/index.ts"
  },
  "dependencies": {
    "@waylog/react": "workspace:*"
  },
  "peerDependencies": {
    "@supabase/supabase-js": ">=2",
    "@tanstack/react-query": ">=5",
    "react": ">=19"
  }
}
```

- [ ] **Step 3: 두 패키지의 `tsconfig.json` 생성**

각 패키지에 동일한 내용으로 만든다. `noEmit`인 이유는 빌드 산출물 없이
소스를 그대로 쓰기 때문이다.

```json
{
  "compilerOptions": {
    "target": "esnext",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "skipLibCheck": true,
    "erasableSyntaxOnly": true
  },
  "include": ["src"]
}
```

- [ ] **Step 4: 설치 및 인식 확인**

```bash
CI=true pnpm install --no-frozen-lockfile
pnpm ls -r --depth -1
```

Expected: `@waylog/domains`와 `@waylog/react`가 워크스페이스 패키지로 나열된다.

- [ ] **Step 5: 커밋**

```bash
git add packages/ pnpm-lock.yaml
git commit -m "chore(packages): 공유 패키지 골격 추가"
```

---

### Task 2: api 계층 이전 및 환경변수 주입 전환

이 태스크가 [3]단계 전체의 선행 조건이다. `.api.ts` 23개가 전부 `~api/client`를
물고 있어, 여기가 풀리지 않으면 어떤 feature도 옮길 수 없다.

**Files:**
- Create: `packages/domains/src/api/index.ts`
- Create: `packages/domains/src/api/client.ts`
- Move: `apps/waylog-web/src/api/_database.types.ts` → `packages/domains/src/api/`
- Move: `apps/waylog-web/src/api/tables.types.ts` → `packages/domains/src/api/`
- Move: `apps/waylog-web/src/api/governmentApi.ts` → `packages/domains/src/api/`
- Move: `apps/waylog-web/src/shared/libs/createHttpClient.ts` → `packages/domains/src/api/`
- Modify: `apps/waylog-web/src/app/root.tsx` (초기화 호출 추가)
- Delete: `apps/waylog-web/src/api/client.ts` (패키지로 대체)

**Interfaces:**
- Consumes: Task 1의 패키지 골격
- Produces:
  - `initApi(config: ApiConfig): void` — 앱 진입점에서 한 번 호출
  - `supabase: SupabaseClient<Database>` — Proxy. 초기화 전 접근 시 throw
  - `apiClient` — 기존 `createHttpClient` 인스턴스
  - `type ApiConfig = { url: string; anonKey: string; auth?: SupabaseAuthConfig }`
  - `type Database`, `DataRaw<T>`, `CreateDataType<T>`, `Json` (기존 타입 그대로)

- [ ] **Step 1: 파일 이동**

```bash
mkdir -p packages/domains/src/api
git mv apps/waylog-web/src/api/_database.types.ts packages/domains/src/api/
git mv apps/waylog-web/src/api/tables.types.ts packages/domains/src/api/
git mv apps/waylog-web/src/api/governmentApi.ts packages/domains/src/api/
git mv apps/waylog-web/src/shared/libs/createHttpClient.ts packages/domains/src/api/
```

- [ ] **Step 2: `packages/domains/src/api/client.ts` 작성**

Proxy를 쓰는 이유는 `.api.ts` 23개가 `import { supabase }`로 모듈 스코프
인스턴스를 쓰고 있어서다. 함수 인자로 client를 넘기면 23개 파일과 모든
호출부가 바뀐다.

```ts
import { createClient, type SupabaseClient, type SupabaseClientOptions } from '@supabase/supabase-js'
import { createHttpClient } from './createHttpClient'
import type { Database } from './_database.types'

export type ApiConfig = {
  url: string
  anonKey: string
  auth?: SupabaseClientOptions<'public'>['auth']
}

let instance: SupabaseClient<Database> | null = null
let httpClient: ReturnType<typeof createHttpClient> | null = null

function required<T>(value: T | null, name: string): T {
  if (value == null) {
    throw new Error(`${name}에 접근하기 전에 initApi()를 호출해야 합니다.`)
  }
  return value
}

export function initApi({ url, anonKey, auth }: ApiConfig) {
  instance = createClient<Database>(url, anonKey, auth ? { auth } : undefined)
  httpClient = createHttpClient({
    baseUrl: url,
    beforeRequest: (request) => {
      request.headers.set('Authorization', `Bearer ${anonKey}`)
      return request
    },
  })
}

export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_, prop, receiver) {
    const target = required(instance, 'supabase')
    const value = Reflect.get(target, prop, receiver)
    return typeof value === 'function' ? value.bind(target) : value
  },
})

export const apiClient = new Proxy({} as ReturnType<typeof createHttpClient>, {
  get(_, prop, receiver) {
    const target = required(httpClient, 'apiClient')
    const value = Reflect.get(target, prop, receiver)
    return typeof value === 'function' ? value.bind(target) : value
  },
})
```

`typeof value === 'function' ? value.bind(target) : value` 부분이 중요하다.
`Reflect.get`만 쓰면 메서드의 `this` 바인딩이 끊겨 `supabase.from(...)` 호출이
깨진다.

- [ ] **Step 3: `packages/domains/src/api/index.ts` 작성**

```ts
export { initApi, supabase, apiClient, type ApiConfig } from './client'
export type { Database } from './_database.types'
export type { DataRaw, CreateDataType, Json } from './tables.types'
export * from './governmentApi'
```

- [ ] **Step 4: 웹 앱이 새 패키지를 쓰도록 의존성 추가**

```bash
cd apps/waylog-web
```

`package.json`의 `dependencies`에 추가:

```json
"@waylog/domains": "workspace:*"
```

- [ ] **Step 5: 웹 앱의 import 경로 일괄 치환**

`~api/client` → `@waylog/domains/api` 형태로 바꾼다.

```bash
cd apps/waylog-web
grep -rl "~api/client\|~api/tables.types\|~api/_database.types\|~api/governmentApi\|~shared/libs/createHttpClient" src | \
  xargs sed -i '' \
    -e "s|from '~api/client'|from '@waylog/domains/api'|g" \
    -e "s|from '~api/tables.types'|from '@waylog/domains/api'|g" \
    -e "s|from '~api/_database.types'|from '@waylog/domains/api'|g" \
    -e "s|from '~api/governmentApi'|from '@waylog/domains/api'|g" \
    -e "s|from '~shared/libs/createHttpClient'|from '@waylog/domains/api'|g"
```

- [ ] **Step 6: 웹 앱 진입점에서 `initApi` 호출**

`apps/waylog-web/src/app/root.tsx`의 최상단 import 직후에 추가한다.
모듈 로드 시점에 실행되어야 `.api.ts`가 `supabase`에 접근하기 전에 초기화된다.

```ts
import { initApi } from '@waylog/domains/api'

initApi({
  url: import.meta.env.VITE_SUPABASE_URL,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
})
```

- [ ] **Step 7: 타입 체크로 검증**

Run: `pnpm ts-check`
Expected: PASS. 남은 `~api/` 참조가 있으면 여기서 드러난다.

- [ ] **Step 8: 테스트 및 빌드 검증**

Run: `pnpm test`
Expected: 177개 통과 (이전과 동일)

Run: `pnpm build`
Expected: PASS

테스트가 깨지면 mock이 `~api/client`를 참조하고 있을 가능성이 높다.
`apps/waylog-web/src/mocks/` 아래를 확인한다.

- [ ] **Step 9: dev 서버로 실제 동작 확인**

```bash
pnpm dev
```

브라우저에서 앱을 열고 **로그인 화면이 뜨는지** 확인한다.
Proxy 초기화가 실패하면 콘솔에 "initApi()를 호출해야 합니다" 에러가 뜬다.
확인 후 서버를 종료한다.

- [ ] **Step 10: 커밋**

```bash
git add -A ':!apps/waylog-web/public/push.sw.js'
git commit -m "refactor(api): api 계층을 공유 패키지로 이전하고 환경변수 주입으로 전환"
```

---

### Task 3: 순수 훅을 @waylog/react로 이전

`shared/hooks/` 아래 41개 훅 중 플랫폼 비의존인 것만 옮긴다.
Task 4 이후의 도메인 훅이 이들을 사용하므로 먼저 옮긴다.

**Files:**
- Create: `packages/react/src/index.ts`
- Move: `apps/waylog-web/src/shared/hooks/**` 중 플랫폼 비의존 훅
- Modify: 이동한 훅을 참조하는 웹 앱 파일들의 import 경로

**Interfaces:**
- Consumes: Task 1의 패키지 골격
- Produces: `@waylog/react`에서 export되는 순수 훅들. Task 4 이후 도메인 훅이 사용

- [ ] **Step 1: 이전 대상 확정**

아래 훅은 **옮기지 않는다** (플랫폼 의존):

```
shared/hooks/useStorageStore.ts          localStorage
shared/hooks/useStorageState.ts          localStorage
shared/hooks/animation/useAnimation.ts   document
shared/hooks/animation/useDriver.ts      document, window
shared/hooks/env/useCurrentCoordinate.ts navigator
shared/hooks/env/useIsMobile.ts          @mui/material
shared/hooks/urls/useQueryParam.ts       react-router
shared/hooks/dom/useIsBFCacheRestored.ts window
shared/hooks/interaction/useActivationSignal.ts          window
shared/hooks/interaction/useDismissCallback.ts           document
shared/hooks/interaction/useScrollRestore.ts             document, react-router, sessionStorage
shared/hooks/interaction/useSkipBackNavigationTransition.ts document, window
shared/components/bottom-sheet/useKeyboardStatus.ts      window
shared/components/bottom-sheet/useSheetDrag.ts           document
```

나머지를 옮긴다. 대상을 확정하려면 다음을 실행한다.

```bash
cd apps/waylog-web
for f in $(find src/shared/hooks -name "use*.ts" ! -name "*.test.ts"); do
  hits=$(grep -o "@mui/[a-z-]*\|react-router\|\bwindow\.\|\bdocument\.\|localStorage\|sessionStorage\|navigator\.\|sonner" "$f" | sort -u | tr '\n' ',')
  [ -z "$hits" ] && echo "이전대상: $f"
done
```

- [ ] **Step 2: 파일 이동**

Step 1이 출력한 파일들을 `packages/react/src/`로 옮긴다.
디렉토리 구조(`extends/`, `env/` 등)는 유지한다.

```bash
mkdir -p packages/react/src
# Step 1의 출력 목록을 기준으로 git mv 실행
```

- [ ] **Step 3: `packages/react/src/index.ts` 작성**

옮긴 훅을 전부 re-export한다. 실제 파일 목록에 맞춰 작성한다.

```ts
export * from './extends/useSuspenseQuery'
// ... Step 2에서 옮긴 나머지
```

- [ ] **Step 4: 웹 앱 의존성 추가 및 import 치환**

`apps/waylog-web/package.json`에 추가:

```json
"@waylog/react": "workspace:*"
```

import 경로를 `~shared/hooks/...` → `@waylog/react`로 바꾼다.

- [ ] **Step 5: 검증**

Run: `pnpm ts-check`
Expected: PASS

Run: `pnpm test`
Expected: 177개 통과

Run: `pnpm build`
Expected: PASS

- [ ] **Step 6: 커밋**

```bash
git add -A ':!apps/waylog-web/public/push.sw.js'
git commit -m "refactor(react): 플랫폼 비의존 훅을 공유 패키지로 이전"
```

---

### Task 4: 컴포넌트 없는 feature 이전

컴포넌트가 0개인 feature를 먼저 옮긴다. import 경로만 바뀌고 파일이 찢어지지
않아 위험이 가장 낮다.

대상: `expense`(7), `marine-activity`(8), `route`(6), `tourism-trend`(10)

`photo`(3)와 `tracking`(1)은 제외한다 — `photo.api.ts`는 브라우저 전용
라이브러리를 쓰고, `tracking`은 타입 파일 하나뿐이라 옮길 실익이 없다.

**Files:**
- Move: `apps/waylog-web/src/features/{expense,marine-activity,route,tourism-trend}/**` → `packages/domains/src/`
- Create: 각 feature의 `index.ts` (서브트리 진입점)
- Modify: 위 feature를 참조하는 웹 앱 파일들의 import 경로

**Interfaces:**
- Consumes: Task 2의 `@waylog/domains/api`, Task 3의 `@waylog/react`
- Produces: `@waylog/domains/expense`, `/marine-activity`, `/route`, `/tourism-trend`

- [ ] **Step 1: expense 하나만 먼저 옮긴다**

한 번에 넷을 옮기면 실패 시 원인 분리가 어렵다. 하나로 경로와 패턴을 확정한다.

```bash
git mv apps/waylog-web/src/features/expense packages/domains/src/expense
```

- [ ] **Step 2: `packages/domains/src/expense/index.ts` 작성**

```ts
export * from './expense.api'
export * from './expense.types'
export * from './expense.utils'
export * from './currency'
export * from './useExpenses'
```

실제 파일 목록에 맞춰 조정한다.

- [ ] **Step 3: 옮긴 파일 내부의 import 경로 수정**

`~api/...` → `@waylog/domains/api`, `~shared/...` → `@waylog/react` 등으로
바꾼다. 같은 feature 내부의 상대경로(`./expense.types`)는 그대로 둔다.

- [ ] **Step 4: 웹 앱의 참조 치환**

```bash
cd apps/waylog-web
grep -rl "~features/expense" src | \
  xargs sed -i '' "s|from '~features/expense[^']*'|from '@waylog/domains/expense'|g"
```

- [ ] **Step 5: expense 검증**

Run: `pnpm ts-check`
Expected: PASS

Run: `pnpm test`
Expected: 177개 통과. `expense.utils.test.ts`가 포함되므로 테스트 파일도
함께 옮겨졌는지 확인한다.

- [ ] **Step 6: 커밋**

```bash
git add -A ':!apps/waylog-web/public/push.sw.js'
git commit -m "refactor(expense): 지출 도메인을 공유 패키지로 이전"
```

- [ ] **Step 7: 나머지 셋을 같은 방식으로 이전**

`marine-activity`, `route`, `tourism-trend`를 Step 1~6과 동일한 절차로
하나씩 옮긴다. 각각 개별 커밋으로 남긴다.

각 feature 이전 후 반드시 `pnpm ts-check`와 `pnpm test`를 실행한다.

- [ ] **Step 8: 웹 빌드 최종 확인**

Run: `pnpm build`
Expected: PASS

---

### Task 5: auth 도메인 이전

RN 앱의 로그인에 필요한 최소 단위다. 컴포넌트가 3개 있어 분리가 필요하다.

**Files:**
- Move: `apps/waylog-web/src/features/auth/auth.api.ts` → `packages/domains/src/auth/`
- Move: `apps/waylog-web/src/features/auth/useAuth.ts` → `packages/domains/src/auth/`
- Move: `apps/waylog-web/src/features/auth/AuthError.ts` → `packages/domains/src/auth/`
- Create: `packages/domains/src/auth/index.ts`
- Keep: `LoginPage.tsx`, `AuthNavigate.tsx`, `useWebPushSubscription.ts` (웹에 남김)
- Modify: `auth.api.ts`의 `signInWithKakao` 시그니처

**Interfaces:**
- Consumes: Task 2의 `@waylog/domains/api`
- Produces:
  - `signInWithKakao(options: { redirectTo: string }): Promise<void>` — 기본값 제거, 필수 인자
  - `signInWithEmail`, `signOut`, `getCurrentUser`, `updateProfile`
  - `useAuth(options?)`, `getAuth()`, `AuthStateSync`
  - `type Auth = User & { profile: UserProfile }`

- [ ] **Step 1: `signInWithKakao`의 `window` 의존 제거**

현재 기본값이 `window.location.origin`이다. 이미 파라미터로 열려 있으므로
기본값만 제거하면 된다.

변경 전:
```ts
export async function signInWithKakao({ redirectTo = window.location.origin }: SignInWIthKakaoOptions = {}) {
```

변경 후:
```ts
interface SignInWithKakaoOptions {
  redirectTo: string;
}
export async function signInWithKakao({ redirectTo }: SignInWithKakaoOptions) {
```

- [ ] **Step 2: 웹 호출부 수정**

`signInWithKakao`를 호출하는 곳에서 `window.location.origin`을 명시적으로 넘긴다.

```bash
cd apps/waylog-web
grep -rn "signInWithKakao" src
```

호출부를 다음과 같이 바꾼다:

```ts
signInWithKakao({ redirectTo: window.location.origin })
```

- [ ] **Step 3: push subscription 함수 3개를 웹에 남긴다**

`addPushSubscription`, `removePushSubscription`, `findPushSubscription`은
웹 표준 `PushSubscription` 타입을 받는다. RN 푸시는 토큰 기반이라 형태가 다르다.

이 3개를 `apps/waylog-web/src/features/auth/pushSubscription.api.ts`로 분리한다.
`useWebPushSubscription.ts`가 이들을 참조하므로 import 경로를 함께 고친다.

- [ ] **Step 4: 파일 이동 및 index 작성**

```bash
mkdir -p packages/domains/src/auth
git mv apps/waylog-web/src/features/auth/auth.api.ts packages/domains/src/auth/
git mv apps/waylog-web/src/features/auth/useAuth.ts packages/domains/src/auth/
git mv apps/waylog-web/src/features/auth/AuthError.ts packages/domains/src/auth/
```

`packages/domains/src/auth/index.ts`:

```ts
export * from './auth.api'
export * from './useAuth'
export * from './AuthError'
```

- [ ] **Step 5: `useAuth.ts`의 의존성 정리**

`useAuth.ts`는 `~app/query-client`와 `~features/user-profile/user-profile.api`를
import한다. 두 가지를 처리해야 한다.

- `queryClient` — `getAuth()`가 모듈 스코프 queryClient를 쓴다. 앱마다 인스턴스가
  다르므로 주입이 필요하다. `setQueryClient(client)` 형태로 노출하고 각 앱
  진입점에서 호출한다.
- `getUserProfileById` — `user-profile` feature가 아직 안 옮겨졌다.
  이 태스크에서 `user-profile.api.ts`와 `user-profile.type.ts`만 함께 옮긴다.
- `assert` (`~shared/utils/types`) — 순수 유틸이므로 `packages/domains/src/utils/`로
  함께 옮긴다. 웹 앱의 다른 참조도 경로를 고쳐야 하므로 다음으로 확인한다.

```bash
cd apps/waylog-web && grep -rln "~shared/utils/types" src | wc -l
```

- [ ] **Step 6: 검증**

Run: `pnpm ts-check`
Expected: PASS

Run: `pnpm test`
Expected: 177개 통과

Run: `pnpm build`
Expected: PASS

- [ ] **Step 7: dev 서버로 로그인 동작 확인**

```bash
pnpm dev
```

브라우저에서 **실제로 로그인이 되는지** 확인한다. 타입 체크만으로는
`redirectTo` 변경이 올바른지 알 수 없다.

- [ ] **Step 8: 커밋**

```bash
git add -A ':!apps/waylog-web/public/push.sw.js'
git commit -m "refactor(auth): 인증 도메인을 공유 패키지로 이전"
```

---

### Task 6: trip 도메인의 공유 가능 부분 이전

RN 앱의 "여행 목록 조회"에 필요한 최소 단위만 옮긴다.
`trip`은 170개 파일 중 110개가 컴포넌트라 전체 이전은 범위를 벗어난다.

**Files:**
- Move: `apps/waylog-web/src/features/trip/trip.api.ts`, `trip.types.ts`,
  `useTrips.ts` 등 목록 조회에 필요한 파일
- Create: `packages/domains/src/trip/index.ts`
- Keep: 컴포넌트 전부, `useTripId.ts` (react-router 의존)

**Interfaces:**
- Consumes: Task 2·3·5의 산출물
- Produces: `@waylog/domains/trip` — 여행 목록 조회에 필요한 API와 훅

- [ ] **Step 1: 이전 대상 확정**

여행 목록 조회 경로를 역추적한다.

```bash
cd apps/waylog-web
grep -rn "useTrips\|getTrips" src/features/trip/*.ts | head
```

목록 조회에 직접 필요한 파일만 고른다. 상세 화면 관련은 이 태스크에서 제외한다.

- [ ] **Step 2: 파일 이동 및 index 작성**

Step 1에서 확정한 파일을 `packages/domains/src/trip/`으로 옮기고
`index.ts`에서 re-export한다.

- [ ] **Step 3: 웹 앱 참조 치환**

```bash
cd apps/waylog-web
grep -rl "~features/trip/trip.api\|~features/trip/trip.types" src | \
  xargs sed -i '' "s|from '~features/trip/trip\.\(api\|types\)'|from '@waylog/domains/trip'|g"
```

- [ ] **Step 4: 검증**

Run: `pnpm ts-check` / `pnpm test` / `pnpm build`
Expected: 전부 PASS, 테스트 177개 통과

- [ ] **Step 5: 커밋**

```bash
git add -A ':!apps/waylog-web/public/push.sw.js'
git commit -m "refactor(trip): 여행 목록 조회 계층을 공유 패키지로 이전"
```

---

### Task 7: RN 앱에서 공유 계층 연결

[3]단계의 완료 기준이다. RN 앱이 공유 패키지를 실제로 사용해
로그인하고 여행 목록을 조회한다.

**Files:**
- Modify: `apps/waylog-app/package.json` (의존성 추가)
- Create: `apps/waylog-app/src/api-config.ts`
- Modify: `apps/waylog-app/App.tsx`
- Modify: `apps/waylog-app/app.json` (환경변수 주입)

**Interfaces:**
- Consumes: Task 2의 `initApi`, Task 5의 `useAuth`, Task 6의 여행 목록 훅
- Produces: 없음 (최종 산출물)

- [ ] **Step 1: 의존성 추가**

`apps/waylog-app/package.json`:

```json
"dependencies": {
  "@waylog/domains": "workspace:*",
  "@waylog/react": "workspace:*",
  "@supabase/supabase-js": "^2.97.0",
  "@tanstack/react-query": "^5.90.21",
  "@react-native-async-storage/async-storage": "2.2.0",
  "react-native-url-polyfill": "^2.0.0"
}
```

버전은 `npx expo install`로 SDK 54에 맞는 것을 설치한다.

- [ ] **Step 2: 환경변수를 `app.json`에 추가**

```json
{
  "expo": {
    "extra": {
      "supabaseUrl": "...",
      "supabaseAnonKey": "..."
    }
  }
}
```

값은 `apps/waylog-web/.env`의 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`와
동일하다. anon key는 공개되어도 되는 값이라 커밋 가능하다.

- [ ] **Step 3: `apps/waylog-app/src/api-config.ts` 작성**

```ts
import Constants from 'expo-constants'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { initApi } from '@waylog/domains/api'

const extra = Constants.expoConfig?.extra

export function setupApi() {
  initApi({
    url: extra?.supabaseUrl,
    anonKey: extra?.supabaseAnonKey,
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  })
}
```

`detectSessionInUrl: false`가 필요한 이유는 RN에 URL 콜백이 없기 때문이다.
`AsyncStorage`는 비동기지만 supabase-js의 auth storage는 비동기 인터페이스를
허용하므로 그대로 넘길 수 있다.

- [ ] **Step 4: `App.tsx`에서 초기화 및 화면 구성**

```tsx
import 'react-native-url-polyfill/auto'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StatusBar } from 'expo-status-bar'
import { StyleSheet, Text, View } from 'react-native'
import { setupApi } from './src/api-config'

setupApi()

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <View style={styles.container}>
        <Text>waylog</Text>
        <StatusBar style="auto" />
      </View>
    </QueryClientProvider>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
})
```

`react-native-url-polyfill/auto`가 필요한 이유는 supabase-js가 `URL` API를
쓰는데 RN의 구현이 불완전하기 때문이다.

- [ ] **Step 5: 번들링 검증**

```bash
cd apps/waylog-app
npx expo export --platform ios --output-dir /tmp/rn-export
```

Expected: 성공. 공유 패키지가 번들에 포함된다.

실패하면 Metro가 워크스페이스 패키지를 해석하지 못하는 것이다.
`metro.config.js`의 `watchFolders`를 확인한다.

- [ ] **Step 6: 로그인 화면 구현 및 실기기 확인**

이메일 로그인 폼과 여행 목록을 최소한으로 구현한다.
UI는 스타일 없이 동작 확인용으로만 만든다.

```bash
cd apps/waylog-app
npx expo start
```

Expo Go로 접속해 **로그인 → 여행 목록 조회**가 동작하는지 확인한다.

- [ ] **Step 7: 커밋**

```bash
git add -A ':!apps/waylog-web/public/push.sw.js'
git commit -m "feat(app): 공유 계층으로 로그인과 여행 목록 조회 연결"
```

---

### Task 8: 문서 갱신

**Files:**
- Modify: `docs/codebase.md`

- [ ] **Step 1: 워크스페이스 레이아웃에 packages 반영**

```
packages/
├── domains/                    # @waylog/domains — 도메인·데이터 계층
│   └── src/
│       ├── api/                # supabase client (initApi 주입), 생성 타입
│       ├── auth/
│       ├── expense/
│       └── ...                 # feature별 서브트리
└── react/                      # @waylog/react — 플랫폼 비의존 훅
```

- [ ] **Step 2: 공유 경계 기준 명시**

```
## 공유 경계

UI 상태·기기 상태는 플랫폼별, 서버 데이터·도메인 규칙은 공유.

- `@waylog/domains` — Supabase 쿼리, 도메인 로직, 도메인 훅
- `@waylog/react` — 플랫폼 비의존 훅
- 앱별 — 컴포넌트, 라우팅, 애니메이션, 스토리지, 디바이스 권한

공유 패키지는 환경변수를 직접 읽지 않는다. 각 앱이 `initApi()`로 주입한다.
```

- [ ] **Step 3: 커밋**

```bash
git add docs/codebase.md
git commit -m "docs: 공유 패키지 구조를 코드베이스 문서에 반영"
```

---

## 완료 기준

- `pnpm ts-check` 통과
- `pnpm test` 177개 통과
- `pnpm build` 성공
- 웹 dev 서버에서 로그인 동작
- `npx expo export` 성공 (공유 패키지 포함)
- **RN 앱에서 로그인 → 여행 목록 조회 동작**
- 공유 패키지에 `.tsx`, `import.meta.env`, MUI, react-router 참조 0건

검증 명령:

```bash
grep -rn "import.meta.env\|@mui/\|react-router" packages/ && echo "(!) 금지된 의존성" || echo "OK"
find packages -name "*.tsx" | head && echo "(!) 컴포넌트 발견" || echo "OK"
```

## 이 단계에서 하지 않는 것

- `photo` 도메인 이전 — `heic-to`, `react-image-file-resizer`가 브라우저 전용
- push subscription 함수 3개 — 웹 표준 타입 의존. RN 푸시 붙일 때 일반화
- `explorer`, `post`, `place`, `statistics`, `weather` 이전 — 컴포넌트 비중이 크다
- `trip`의 상세 화면 계층 — 목록 조회만 옮긴다
- RN 앱의 실제 UI 구현 — 동작 확인용 최소 화면만
- 네비게이션 라이브러리 도입
