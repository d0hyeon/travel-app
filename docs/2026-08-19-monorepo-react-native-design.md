# 모노레포 전환 및 React Native 도입 설계

작성일: 2026-08-19

---

## 배경

현재 서비스는 React 19 + React Router 7 기반 CSR 웹앱(PWA)이다.
여기에 React Native 앱을 추가한다.

### 동기

1. **앱 전용 기능 활용** — 백그라운드 위치 추적처럼 웹으로는 불가능한 기능.
   구체적으로는 자동 동선 기록, 방문 장소 자동 감지, 지오펜싱 알림을 염두에 둔다.
   다만 **이번 작업에서 트래킹을 구현하지 않는다.** 방향만 확정한다.
2. **학습** — RN 생태계를 직접 경험한다. 이 동기 때문에 "웹뷰 셸"은 선택지가 아니다.

### 목표 범위

웹 기능 전체 또는 핵심 플로우 대부분을 네이티브로 제공한다.
따라서 플랫폼 비의존 계층을 공유 패키지로 분리하는 것이 전제가 된다.

---

## 실측: 현재 코드베이스의 이식 가능성

설계 판단은 추측이 아니라 아래 실측에 근거한다.

| 항목 | 수치 |
| --- | --- |
| `src` 전체 TS/TSX 파일 | 525 |
| `.tsx` (컴포넌트) | 277 |
| 그 중 MUI를 import | 219 |
| `use*.ts` 훅 | 105 |
| 그 중 플랫폼 의존 흔적 있음 | 19 (18%) |
| `.api.ts` / `.utils.ts` / `.model.ts` / `.types.ts` | 57 |
| 그 중 플랫폼 의존 흔적 있음 | 2 |

**핵심 관찰:** 훅 105개 중 86개가 플랫폼 무관하고, `.api.ts` 57개는 사실상 전부 깨끗하다.
공유 가능성이 높다.

### 플랫폼 의존 훅 19개의 성격

| 성격 | 파일 | 처리 |
| --- | --- | --- |
| 애니메이션·제스처·바텀시트 | `useAnimation`, `useDriver`, `useSheetDrag`, `useKeyboardStatus`, `useDismissCallback`, `useScrollRestore`, `useSkipBackNavigationTransition`, `useActivationSignal`, `useIsBFCacheRestored` | 공유 안 함 |
| 라우팅 | `useTripId`, `usePlaceId`, `useQueryParam` | 공유 안 함 |
| 반응형 | `useIsMobile` (MUI) | 공유 안 함 |
| 스토리지 | `useStorageStore`, `useStorageState`, `useUnreadChatCount` | 공유 안 함 |
| 디바이스 권한 | `useCurrentCoordinate`, `useWebPushSubscription`, `useChatActivation` | 공유 안 함 |

19개 전부 공유 대상이 아니다. 즉 **훅 때문에 해야 할 리팩터링은 없다.**

---

## 경계 기준

> **UI 상태·기기 상태는 플랫폼별, 서버 데이터·도메인 규칙은 공유.**

스토리지 훅이 이 기준의 대표 사례다.
`useStorageState`는 `storage` 옵션과 `ExpandStorage` 타입으로 이미 추상화돼 있어
주입 방식으로 공유할 수도 있었다. 그러나 실제 용도가 스크롤 위치·시트 열림·읽음 표시 같은
**UI 상태 보존**이므로 공유하지 않는다. 추상화 가능 여부가 아니라 **책임의 성격**이 기준이다.

같은 이유로 `useUnreadChatCount`의 "마지막 읽은 시각"도 기기 로컬 상태이지 도메인 데이터가 아니다.

---

## 패키지 구조

```
apps/
  waylog-web/          # 현재 src/ 전체 + vite / playwright / vercel 설정
  waylog-app/          # Expo
packages/
  domains/             # @waylog/domains — 서브트리 export
  react/               # @waylog/react — 플랫폼 무관 순수 훅
```

### `@waylog/domains`

feature 단위로 서브트리를 노출한다.

```ts
import { getTrips, useTrip } from '@waylog/domains/trips'
```

포함:
- `.api.ts` — Supabase 쿼리 함수
- `.utils.ts` / `.model.ts` / `.types.ts` — 순수 로직
- 도메인 React Query 훅 (`useAuth` 포함)
- `api` 서브트리 — supabase client 팩토리, `_database.types.ts`, `tables.types.ts`

제외:
- 컴포넌트(`.tsx`) 전부 — `waylog-web`에 남는다

**`api`를 별도 패키지로 분리하지 않는 이유:** `.api.ts` 57개가 전부 supabase client를 물고,
`_database.types.ts`는 도메인 타입의 원천이다. 항상 함께 쓰이므로 나눌 근거가 없다.
필요해지면 나중에 뺀다(합치는 것보다 빼는 것이 쉽다).

### `@waylog/react`

플랫폼 무관 순수 훅. `domains`를 모른다.

별도 패키지로 두는 이유는 **의존 방향이 반대**이기 때문이다.
`domains`가 `react`를 사용하고, 그 역은 없다. supabase에도 의존하지 않아 실제로 독립적이다.

---

## 해결해야 할 기술 문제

### 1. `import.meta.env` (Vite 전용)

`src/api/client.ts`와 `src/app/env.ts`가 `import.meta.env`를 모듈 최상위에서 읽는다.
Metro는 이 문법을 모르므로 공유 패키지에 들어가는 즉시 깨진다.

**해결: 공유 패키지는 환경변수를 읽지 않는다. 각 앱이 읽어서 주입한다.**

- `waylog-web` — `import.meta.env.VITE_*`
- `waylog-app` — `app.config.ts`의 `extra` → `Constants.expoConfig.extra`

### 2. supabase client 초기화

주입 방식으로 바꾸면 client 인스턴스를 언제 만드느냐는 문제가 생긴다.
`.api.ts` 57개가 `import { supabase }`로 모듈 스코프 인스턴스를 쓰고 있어,
함수 인자로 client를 넘기는 방식은 57개 파일과 모든 호출부를 바꾼다.

**해결: Proxy 지연 초기화.**

```ts
let instance: SupabaseClient<Database> | null = null

export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_, prop) {
    if (!instance) throw new Error('initApi()를 먼저 호출해야 합니다')
    return Reflect.get(instance, prop)
  }
})

export function initApi(config: ApiConfig) {
  instance = createClient<Database>(config.url, config.anonKey, { auth: config.auth })
}
```

효과:
- `.api.ts` 57개 **수정 없음** — `import { supabase }` 그대로
- `supabase`가 `const`라 재할당 불가
- 초기화 전 접근 시 명확한 에러 (`undefined.from is not a function`이 아니라)
- 타입은 정상 `SupabaseClient<Database>`

앱별 초기화:

```ts
// waylog-web
initApi({ url: import.meta.env.VITE_SUPABASE_URL, anonKey: ... })

// waylog-app
initApi({
  url: Constants.expoConfig.extra.supabaseUrl,
  anonKey: ...,
  auth: { storage: AsyncStorage, detectSessionInUrl: false },
})
```

RN의 supabase auth storage는 **비동기 인터페이스를 허용**하므로 `AsyncStorage`를 그대로 넘긴다.
동기 스토리지(MMKV 등)가 필요 없다.

**구현 시 확인할 점:** `Reflect.get(instance, prop)`은 메서드의 `this` 바인딩이 끊길 수 있다.
`.bind(instance)`가 필요한지 검증한다.

### 3. `auth.api.ts`의 `window.location.origin`

```ts
signInWithKakao({ redirectTo = window.location.origin })
```

이미 파라미터로 열려 있고 기본값만 `window`를 참조한다.
**기본값을 제거하고 호출부가 주입한다.** 시그니처는 그대로다.

- 웹 — `window.location.origin`
- 앱 — 딥링크 스킴

### 4. `placeSearch.api.ts`의 `import.meta.env`

1번과 동일하게 주입으로 전환한다.

### 5. Metro와 pnpm

Metro는 현재 심볼릭 링크와 `exports` 필드를 기본 지원한다(`unstable_enableSymlinks`,
`unstable_enablePackageExports`가 기본 활성화). pnpm 워크스페이스는 정상 경로다.

남는 마찰 두 가지:

**(a) `watchFolders`** — Metro는 기본적으로 자기 프로젝트 폴더 아래만 본다.
모노레포에서는 명시해야 한다.

```js
config.watchFolders = [monorepoRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
]
```

**(b) 네이티브 의존성 해석** — RN 패키지는 JS(`lib/`)와 네이티브 코드(`ios/`, `android/`)를
한 패키지에 함께 담고, 각각을 Metro / CocoaPods(iOS) / Gradle(Android)이 따로 가져간다.
CocoaPods와 Gradle은 pnpm을 모르는 외부 도구라 중첩 심링크에서 경로 해석이 깨지는 사례가 있다.

**대응: 루트 `.npmrc`에 RN 관련 패키지만 호이스팅한다.**

```
public-hoist-pattern[]=*react-native*
public-hoist-pattern[]=*expo*
```

전역 `node-linker=hoisted` 대신 이 방식을 쓴다. pnpm의 격리를 나머지 의존성에 대해
유지하면서 네이티브 빌드가 기대하는 구조만 맞춘다.
그래도 깨지면 그때 `node-linker=hoisted`로 넓힌다.

공유 패키지를 순수 TS로 유지하면 (b)는 애초에 발생하지 않는다.
`@waylog/domains`와 `@waylog/react`에는 podspec이 없어 CocoaPods가 볼 일이 없다.
문제가 생긴다면 서드파티 RN 라이브러리 때문이다.
이는 "플랫폼 비의존 계층만 공유"라는 방향이 아키텍처뿐 아니라 툴체인 관점에서도
유리하다는 뜻이다.

---

## 결정 사항

| 항목 | 결정 | 근거 |
| --- | --- | --- |
| Expo vs RN CLI | **Expo** | 학습 동기 기준 앱 전용 기능까지 도달 거리가 짧다. 필요 시 prebuild로 네이티브를 연다 |
| 워크스페이스 도구 | pnpm workspace만 | 현 규모에 Turborepo는 과하다 |
| 앱 디렉토리 | `apps/waylog-web`, `apps/waylog-app` | |
| 공유 패키지 | `@waylog/domains`, `@waylog/react` | |
| 공유 방식 | feature에서 컴포넌트만 제외, 서브트리 export | |
| 생성 타입 | `domains/api`. `gen-types` 스크립트도 해당 패키지로 | |
| 테스트 | 패키지 단위 분리 | |
| Vercel | Root Directory = `apps/waylog-web` | `vercel.ts`는 경로가 전부 URL 기준이라 내용 변경 불필요 |
| 환경변수 | 앱이 읽어 `initApi()`로 주입 | |
| client 초기화 | Proxy 지연 초기화 | |
| node-linker | 기본(심링크) 유지 + `public-hoist-pattern`으로 RN/Expo만 호이스팅. 그래도 깨지면 전역 `hoisted` | 격리를 최대한 유지한다 |

### 코드 변경 목록

웹 동작에 영향을 주지 않는 변경만 포함한다.

1. `api/client.ts` — `import.meta.env` 제거, Proxy + `initApi()` 도입
2. `app/env.ts` — 동일
3. `features/auth/auth.api.ts` — `redirectTo` 기본값 제거
4. `features/place/place-search/placeSearch.api.ts` — `import.meta.env` 제거

나머지는 전부 **파일 이동**이다.

---

## 작업 순서

CLAUDE.md의 "브랜치당 500줄 이하" 규칙은 이번 작업에 적용하지 않는다.
파일 이동만으로 수백 개 파일이 움직이기 때문이다.
대신 아래 세 단계를 순차 워킹 브랜치로 분리한다.

### [1] 모노레포 전환

pnpm 워크스페이스를 만들고 현재 `src/`와 설정 파일들을 `apps/waylog-web`으로 옮긴다.
아직 공유 패키지를 만들지 않는다.

- 빈 `api/` 디렉토리 삭제
- `.github/workflows/ci.yml` 경로 수정
- Vercel Root Directory 설정

**완료 기준:** 웹 앱이 기존과 동일하게 빌드·테스트·배포된다.

### [2] Metro 셋업

Expo로 `apps/waylog-app`을 스캐폴딩하고 Metro를 모노레포에 맞게 설정한다.

이 단계에서 앱은 **공유 코드가 없는 빈 껍데기**다.
빌드 파이프라인이 도는지만 먼저 검증해 원인 분리를 쉽게 한다.

**완료 기준:** iOS/Android에서 앱이 실행되고 Fast Refresh가 동작한다.

### [3] 패키지 이전

`@waylog/domains`와 `@waylog/react`를 추출하고 위 코드 변경 4건을 적용한다.
앱에 로그인과 여행 목록 화면을 붙인다.

**완료 기준:** RN 앱에서 로그인 → 여행 목록 조회가 동작한다.
공유 계층이 실제로 양쪽에서 도는 것을 증명하는 최소 관통선이다.

---

## 이후 단계로 미루는 것

| 항목 | 시점 |
| --- | --- |
| 네비게이션 라이브러리 (Expo Router vs React Navigation) | 화면을 만들 때 |
| UI 라이브러리 (MUI 대체) | 화면을 만들 때 |
| push subscription 함수 3개 일반화 | 푸시를 붙일 때 |
| 스토리지 훅의 RN 구현 | 해당 화면이 생길 때 |
| 백그라운드 트래킹 (동선 기록 / 장소 감지 / 지오펜싱) | 이후 |
| CI/CD, EAS Build | 배포할 때 |

`auth.api.ts`의 `addPushSubscription` / `removePushSubscription` / `findPushSubscription`은
웹 표준 `PushSubscription` 타입을 받는다. RN 푸시는 토큰 기반이라 형태가 다르므로
지금은 공유 계층에서 제외하거나 그대로 두고, 푸시를 붙일 때 일반화한다.
