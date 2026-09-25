# 웹-앱 AppRoute 통합 & 라우트 파라미터 co-location 설계

## 배경

`react-navigation` 전환(`feat/expo-sdk-upgrade` → `feat/monorepo-react-native` 병합 완료) 이후,
앱의 라우트 파라미터 타입은 `apps/waylog-app/src/app/routes.ts`에 `RootStackParamList`로 중앙
집중 관리되고 있다. 이 구조에는 두 가지 문제가 있다.

1. **파라미터 타입이 화면 코드와 물리적으로 분리되어 있다.** `TripDetailScreen.tsx`가 실제로
   무엇을 쓰는지는 그 파일을 봐야 알지만, 타입 자체는 전혀 다른 파일(`routes.ts`)에 손으로
   적혀 있다. 화면이 추가/변경될 때마다 두 파일을 오가며 맞춰야 하고, 화면 파일만 보고는 이
   화면이 어떤 파라미터를 받는지 알 수 없다.
2. **웹(`AppRoute`, URL 경로 문자열)과 앱(`RootStackParamList`, 파라미터 타입)이 같은 화면을
   완전히 따로 정의한다.** "여행 상세 화면은 tripId를 받는다"는 사실 하나를 웹에서 한 번, 앱에서
   한 번 손으로 적고 있고, 둘이 어긋나도(오타 등) 타입 체커가 잡아주지 못한다.

토스 기술 블로그의 [Granite 프레임워크 글](https://toss.tech/article/rn-toss-bedrock)이 제시하는
"각 화면이 자기 라우트 파라미터 타입을 소유하고 declaration merging으로 중앙에 자동 등록"
패턴을 참고하되, 그 글의 파일 기반 라우팅 + 번들러 플러그인 부분은 차용하지 않는다(이번 세션
직전에 `expo-router`를 걷어내고 `@react-navigation`으로 전환한 것과 정반대 방향이라 채택하지
않기로 확정함).

## 목표

- 웹의 `AppRoute`(경로 문자열 상수)를 웹/앱 공유 패키지로 옮겨 URL 경로 문자열의 단일 소스로 삼는다.
- 앱의 화면 파일이 자기 파라미터 타입을 선언하면 `RootStackParamList`에 자동으로 반영되게 한다
  (co-location). `routes.ts`에 손으로 타입을 나열하는 방식을 없앤다.
- react-navigation 스크린 이름에 `AppRoute`의 콜론 기반 경로 문자열(`"trip/:tripId"`)을 그대로
  쓸 때 발생할 수 있는 파서 충돌을 안전하게 회피한다.

## 비목표

- 웹-앱 네비게이션 로직 자체의 통합(React Router의 URL 매칭과 react-navigation의 스택 기반
  네비게이션은 이질적인 두 시스템이며, 이번 작업은 "경로 문자열과 파라미터 타입의 단일 소스화"
  까지만 다룬다).
- 런타임 파라미터 검증(zod 등) 도입. 검증 없이 타입 선언만 하되, 나중에 검증 함수를 끼워 넣을
  여지가 있는 구조로만 만든다(현재는 그 여지를 쓰지 않는다).
- react-navigation 스크린 이름을 경로 문자열 그 자체로 바꾸는 것(조사 결과 위험 — 아래 "왜
  스크린 이름을 그대로 못 쓰는가" 참고). 대신 콜론만 치환한 앱 전용 별도 상수를 쓴다.

## 조사 결과: 왜 스크린 이름을 경로 문자열 그대로 못 쓰는가

react-navigation의 path 파서(`getPatternParts`, `@react-navigation/core`)는 문자열 중간에
콜론(`:`)이 나오면 path 파라미터 문법으로 해석한다. 스크린 이름 자체를 `"trip/:tripId"`처럼
콜론이 든 문자열로 쓰면:

- 슬래시(`/`)만 있는 경우는 안전하다 — `getStateFromPath`/`getPathFromState`는 스크린 이름을
  정확한 문자열 프로퍼티 lookup(`route.name in currentOptions`, `configsByScreen[c.screen]`)
  으로만 다루고, 이름을 `/`로 split하거나 정규식으로 재분해하지 않는다.
- 콜론(`:`)은 위험하다 — `getPatternParts`가 세그먼트 중간의 `:`를 파라미터 시작으로 해석하다가
  규칙을 벗어나면 `Encountered ':' in the middle of a segment` 예외를 던진다. 스크린 이름
  자체는 보통 이 파서를 거치지 않지만, "이름=경로 패턴"이라는 이중 역할을 주는 순간 이름 lookup
  경로와 path 정규식 생성 경로가 뒤섞일 여지가 커진다(alias, 중첩 `screens` 조합 등).
- 공식 문서에 스크린 이름의 문자 제약이 명시되어 있지는 않지만, 검증된 패턴도 아니다.

**결론**: 스크린 이름과 URL path 문자열을 완전히 동일시하지 않는다. 대신 콜론만 안전한 문자로
치환한 앱 전용 상수를 만들어 스크린 이름으로 쓰고, `linking.config`에는 원본(콜론 있는) 값을
그대로 남겨 실제 URL 매칭이 깨지지 않게 한다.

## 설계

### 1. 공유 패키지 `@waylog/routes`

새 워크스페이스 패키지. 지금 `apps/waylog-web/src/app/routes.ts`에 있는 `AppRoute` 상수를
그대로 옮긴다 — 한글 키, 콜론 기반 경로 문자열 값 모두 변경 없음.

```ts
// packages/routes/src/appRoute.ts
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

웹/앱 둘 다 이 패키지에 의존한다.

### 2. 웹 쪽 변경

`import { AppRoute } from '../app/routes'` → `import { AppRoute } from '@waylog/routes'`로
import 경로만 바뀐다. `route()`, `generatePath()`, `useParams()` 등 기존 사용 방식은 전부
그대로 유지한다. 웹 쪽 `routes.ts`는 라우트 트리 정의(`export default [...]`)만 남기고
`AppRoute` 상수 선언은 제거한다.

### 3. 앱 쪽 — 콜론 치환

`apps/waylog-app/src/app/AppRoute.ts` (신규):

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

앱의 네비게이션 관련 코드(`RootStack.Screen`, `navigation.navigate/reset/replace`,
`linking.config`)는 전부 이 로컬 `AppRoute`(치환된 값)만 참조한다. 원본
`@waylog/routes`의 `AppRoute`를 직접 import하는 곳은 이 파일 하나뿐이다.

`toScreenName`은 멱등이다(`replaceAll(':', '_')`은 콜론이 없으면 원본을 그대로 반환) —
그래서 `useAppRoute()`가 돌려주는 `route.name`(이미 치환된 값)을 다시 `navigate()`에 넘겨도
안전하다(예: `auth-redirect.tsx`의 로그인 후 원래 화면 복귀 로직). 역변환 함수는 필요 없다.

### 4. `registerLinkingScreens` — linking.config.screens 생성

```ts
// apps/waylog-app/src/app/registerLinkingScreens.ts
import { AppRoute as BaseAppRoute } from '@waylog/routes'
import { toScreenName } from './AppRoute'

export function registerLinkingScreens(paths: readonly string[]) {
  return Object.fromEntries(paths.map((path) => [toScreenName(path), path]))
}
```

사용 예:

```ts
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['waylog://', 'https://waylog.me', 'https://www.waylog.me'],
  config: {
    initialRouteName: toScreenName(BaseAppRoute.메인),
    screens: registerLinkingScreens([BaseAppRoute.메인, BaseAppRoute.여행_초대]),
  },
}
```

`screens`의 키(치환된 스크린 이름)는 `RootStack.Screen name={...}`에 등록한 것과 정확히
일치해야 하고, 값(원본 콜론 경로)은 실제 들어오는 URL과 매칭하는 정규식 생성에 쓰이므로
원본 그대로 둔다.

### 5. 라우트 파라미터 co-location

각 화면 파일이 자기 파라미터 타입을 선언하고 export하며, declaration merging으로
`RootStackParamList`에 자동 등록한다. 등록 키는 별도로 지어내지 않고 **`@waylog/routes`의
`AppRoute` 경로 문자열을 그대로 쓴다** — 화면 이름이라는 별도 이름 체계를 만들지 않기 위함이다.
이렇게 하면 `RootStackParamList`의 키가 곧 `AppRoute`의 값이 되어, 경로 문자열 하나가 URL 겸
스크린 식별자 겸 파라미터 레지스트리 키로 통일된다.

```ts
// apps/waylog-app/src/features/trip/TripDetailScreen.tsx
import { AppRoute } from '@waylog/routes'

export type TripDetailParams = { tripId: string }

declare module '../../app/routes' {
  interface RouteParamsRegistry {
    [AppRoute.여행_상세]: TripDetailParams   // "/trip/:tripId"를 키로 병합
  }
}
```

```ts
// apps/waylog-app/src/app/routes.ts
export interface RouteParamsRegistry {}
export type RootStackParamList = RouteParamsRegistry
```

`RootStack.Screen name`에는 이 원본 경로 문자열이 아니라 앱 로컬(치환된) `AppRoute`
(`apps/waylog-app/src/app/AppRoute.ts`)의 값을 쓴다. `useAppRoute<T>()` 같은 훅의 타입 파라미터
`T`는 `RootStackParamList`의 키(=원본 `AppRoute` 값, 콜론 있는 문자열)를 그대로 받는다 —
런타임 스크린 이름(치환본)과 타입 조회 키(원본)가 다른 문자열이지만, 이는 `RootStackParamList`
가 타입 전용이고 실제 `useRoute()`는 제네릭으로만 타입을 좁힐 뿐 키 문자열로 런타임 조회를
하지 않으므로 문제되지 않는다.

**declaration merging 누락 문제가 실질적으로 없는 이유**: `RootNavigator.tsx`는 `RootStack.Screen`
등록을 위해 이미 모든 화면 컴포넌트를 import하고 있다. 화면 컴포넌트를 import하는 시점에 그
파일의 `declare module` 부수효과도 함께 로드되므로, "화면 파일이 import되지 않으면 타입이
누락된다"는 declaration merging의 일반적 리스크가 이 구조에서는 발생하지 않는다.

쿼리성 파라미터(예: `TripCreate.step`, `ExplorerDetail.tab`)는 경로 문자열에 나타나지 않으므로
화면이 선언하는 타입에 그대로 포함시킨다(path/query를 구분하는 별도 장치는 두지 않는다 — 화면
파일이 "이 화면이 받는 파라미터 전체"를 하나의 타입으로 선언하면 충분하다).

## 영향 범위

- 새 패키지: `packages/routes/`
- 웹: `apps/waylog-web/src/app/routes.ts`에서 `AppRoute` 상수 제거, 23곳의 `AppRoute.` 참조
  import 경로 변경
- 앱: `apps/waylog-app/src/app/routes.ts`(`RootStackParamList` 수동 나열 제거,
  `RouteParamsRegistry` 인터페이스로 교체), `AppRoute.ts`(신규), `registerLinkingScreens.ts`(신규),
  `RootNavigator.tsx`(스크린 이름·linking 설정 교체), 화면 파일 각각(파라미터 타입 co-location)

## Review Focus

- **역변환 없이 안전한지**: `route.name`을 저장했다가 나중에 `navigate()`에 재사용하는 지점
  (`auth-redirect.tsx`)에서 `toScreenName`의 멱등성이 실제로 보장되는지 테스트로 확인한다.
- **linking.config 키/값 불일치**: `registerLinkingScreens`가 만드는 키(치환본)와
  `RootStack.Screen name`에 등록된 값이 어긋나면 딥링크가 조용히 실패한다 — 두 값의 출처가
  같은 로컬 `AppRoute` 상수인지 확인하는 테스트가 필요하다.
- **declaration merging 누락**: 화면 파일이 `RootNavigator.tsx`에서 import되지 않는 예외
  케이스(예: 조건부 렌더링되는 화면, 지연 로딩되는 화면)가 있는지 전수 확인한다.
- **웹 23곳 마이그레이션 누락**: `AppRoute` import 경로 변경 시 전수 조사로 놓치는 파일이
  없는지 확인한다(이전 react-navigation 전환 때 4곳을 놓쳤던 전례가 있다).
- **런타임 스크린 이름(치환본)과 타입 조회 키(원본)가 다른 문자열이라는 점**: `RootStack.Screen
  name`에는 앱 로컬(치환된) `AppRoute` 값을, `RootStackParamList`/`RouteParamsRegistry`에는
  원본(`@waylog/routes`) `AppRoute` 값을 쓴다 — 두 값이 다른 문자열이지만 타입 조회와 런타임
  등록이 분리되어 있어 문제되지 않는다는 전제가 실제로 깨지지 않는지, 즉 `useAppRoute<T>()`가
  런타임에 키 문자열로 무언가를 조회하는 코드가 없는지 전수 확인한다.
