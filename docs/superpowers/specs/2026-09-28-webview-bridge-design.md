# App ↔ WebView Bridge 기반 설계

## 목적

설정 화면을 웹으로 제공할 때, 웹뷰 안의 웹 코드가 네이티브 기능을 타입 안전하게
요청할 수 있는 기반을 만든다. 첫 배포에서는 웹뷰 닫기와 네이티브 React Query 재조회만
지원한다.

## 범위

- `@waylog/bridge` 워크스페이스 패키지를 추가한다.
- App과 Web이 함께 사용하는 정적 protocol contract를 제공한다.
- Native host의 동적 handler stack과 React lifecycle hook을 제공한다.
- Web client의 RPC, capability handshake, timeout, 타입 안전한 API를 제공한다.
- 첫 capability인 `closeWebView`, `refetchQueries`와 관련 단위 테스트를 제공한다.

설정 페이지 UI, WebView 화면 연결, 사진 선택 등 후속 capability는 포함하지 않는다.

## 책임과 경계

| 영역 | 책임 | 소유하지 않는 것 |
| --- | --- | --- |
| `contract` | App ↔ Web protocol의 method와 DTO 정의 | WebView transport, handler lifecycle, feature 구현 |
| `host` | 요청을 활성 Native handler로 전달하고 응답을 보냄 | 화면별 기능 수행 정책 |
| `client` | Web에서 자연스러운 RPC API와 capability 확인 제공 | Native 구현과 handler 등록 |
| App feature | 화면 상태에 맞는 capability 구현을 등록 | protocol 정의, RPC serialization |

`@waylog/bridge`는 도메인 모델과 React Query 타입에 의존하지 않는다. `refetchQueries`
요청은 JSON 호환 primitive로 구성된 query key DTO만 전달한다. 실제 query client를
사용하는 방법은 App feature 또는 App infrastructure handler가 소유한다.

## 공개 계약

```ts
export interface BridgeContract {
  closeWebView: (params: CloseWebViewParams) => Promise<void>
  refetchQueries: (params: RefetchQueriesParams) => Promise<void>
}

export interface CloseWebViewParams {}

export interface RefetchQueriesParams {
  queryKeys: BridgeQueryKey[]
}

export type BridgeQueryKey = BridgeQueryKeyPart[]

export type BridgeQueryKeyPart = string | number | boolean | null
```

모든 method는 단일 object parameter를 사용하고 property function syntax로 선언한다.
`BridgeQueryKey`는 직렬화 안정성이 필요한 bridge 경계 DTO이며 TanStack Query의 광범위한
`QueryKey`를 노출하지 않는다. 복합 object segment가 필요해질 때는 새로운 직렬화 DTO를
additive하게 추가한다.

외부 API는 다음처럼 사용한다.

```ts
await bridgeClient.closeWebView({})
await bridgeClient.refetchQueries({ queryKeys: [['user', userId]] })

if (bridgeClient.supports('refetchQueries')) {
  await bridgeClient.refetchQueries({ queryKeys })
}
```

## Protocol과 lifecycle

`host`는 transport 구현을 소유하지 않는다. Host 생성자는 WebView에 맞춘 작은 adapter를
받는다. App integration은 `react-native-webview`의 `onMessage`와 ref의 `postMessage`를 이
adapter로 감싸고, Web integration은 `window`의 message event와
`window.ReactNativeWebView.postMessage`를 감싼다. JSON parse/serialize와 inbound event
normalization은 adapter가 아닌 `host` 및 `client` runtime이 소유한다.

`BridgeTransport`는 contract와 함께 독립된 공용 경계에 둔다. host와 client는 모두 이
interface를 소비하지만 서로 import하지 않는다.

```ts
export interface BridgeTransport {
  send: (message: string) => void
  subscribe: (listener: (message: string) => void) => () => void
}
```

모든 wire message는 아래 envelope만 사용한다.

```ts
type BridgeRequest = {
  type: 'bridge-request'
  requestId: string
  method: BridgeMethod
  params: object
}

type BridgeResponse = {
  type: 'bridge-response'
  requestId: string
  ok: true
  result: unknown
} | {
  type: 'bridge-response'
  requestId: string
  ok: false
  error: { code: BridgeErrorCode; message: string }
}

type BridgeInfoMessage = {
  type: 'bridge-info'
  info: BridgeInfo
}

type BridgeInitMessage = {
  type: 'bridge-init'
}
```

`BridgeMethod`는 `Extract<keyof BridgeContract, string>`이다. Interface는 runtime에 존재하지
않으므로 contract는 아래처럼 runtime method 목록도 export한다.

```ts
export const bridgeMethods = ['closeWebView', 'refetchQueries'] as const
  satisfies readonly BridgeMethod[]
export const bridgeVersion = 1
```

Runtime은 이 목록으로 request method를 검사하고, unknown method나 malformed envelope은
`BridgeProtocolError` response로 끝낸다. Runtime validator는 handler 호출 전에 method별 params를
검사한다. `closeWebView`는 plain object만, `refetchQueries`는 primitive(`string`, finite `number`,
`boolean`, `null`) segment로만 구성된 query key 배열만 허용한다. 검증에 실패한 params는 handler에
전달하지 않는다. handler가 던진 값은 Error 여부와 관계없이 code와 안전한 message를 가진
serializable error로 normalise한다. Client는 응답을 해당 error class로
복원하며, 모르는·중복된 request ID response는 무시한다. dispose 또는 page navigation 시 pending
request를 `BridgeUnavailableError`로 끝내고 timeout을 정리한다.

`bridgeVersion`은 contract가 export하는 major integer다. App build version은 host 생성 시
`createBridgeHost(transport, { appVersion })`로 주입한다. Client만 연결 후 `bridge-init` message를
보낸다. Host는 이를 받으면 아래 정보를 포함한 `bridge-info`를 재전송한다. Host가 생성 때 보내는
초기 `bridge-info`를 WebView listener가 놓쳐도 Client init이 capability 정보를 다시 요청하므로 info
유실이 없다.

```ts
interface BridgeInfo {
  bridgeVersion: number
  appVersion: string
  methods: BridgeMethod[]
}
```

Client는 `BridgeInfo`를 캐시해 `supports(method)`를 동기적으로 판단한다. 지원 capability의
목록은 현재 등록된 handler stack의 최상단 상태가 아니라, 해당 Native build가 protocol상
알고 있는 capability 집합이다. 따라서 `supports()`가 참이더라도 화면 lifecycle 때문에
handler가 없으면 호출은 `BridgeUnavailableError`로 실패할 수 있다.

handshake 전 `supports()`는 `false`를 반환한다. Native message transport가 존재하면
`bridgeClient.ready()`는 bridge info를 받으면 resolve되고, 호출자는 초기 화면에서 필요하면 이를
기다린 뒤 capability를 판정한다. Native transport가 없는 일반 브라우저에서는 `ready()`가 즉시
`BridgeUnavailableError`로 reject한다. `bridgeVersion` major가 Client가 지원하는 범위를 벗어나면
`ready()`는 `BridgeUnsupportedError`로 reject되고 모든 method 호출을 차단한다.

Host의 `register(method, handler)`는 method별 stack에 entry를 push하고, 같은 entry만 제거하는
cleanup 함수를 반환한다. 가장 마지막 등록이 요청을 처리한다. unmount 순서가 LIFO가 아니어도
중간 entry를 제거해 남은 override가 유지되어야 한다.

`useBridgeHandler(method, handler)`는 React effect로 위 등록과 cleanup을 연결한다. Hook은
handler를 소유하지 않고 feature lifecycle만 host에 반영한다.

## 오류와 호환성

- `BridgeUnsupportedError`: 연결된 Native build가 method를 모른다.
- `BridgeUnavailableError`: contract에는 있으나 활성 handler가 없다.
- `BridgeTimeoutError`: 정해진 시간 안에 response를 받지 못했다.
- `BridgeProtocolError`: 유효하지 않은 request 또는 response를 받았다.
- `BridgeHandlerError`: 검증된 요청을 처리한 Native handler가 실패했다.

Contract 변경은 method와 optional field 추가만 허용한다. 기존 method의 제거·rename·required
parameter 추가·의미 변경은 허용하지 않는다. 의미가 달라지는 기능은 새 method로 추가하고
웹은 `supports()`로 fallback을 선택한다.

## Client 구현 세부사항

Client는 Contract method를 Proxy로 노출할 수 있지만 `then`, symbol property, 내부 속성은 RPC
method로 전달하지 않는다. 따라서 client 객체는 thenable로 오인되지 않는다. request ID,
`postMessage`, pending request map, serialization은 모두 client 내부에 숨긴다.

## `refetchQueries` 처리 정책

App의 handler는 전달받은 각 query key에 대해
`queryClient.refetchQueries({ queryKey, exact: true, type: 'all' })`를 수행하고 모든 요청이 완료될 때
resolve한다. 동일 key는 한 번만 호출한다. 하나라도 실패하면
성공 여부를 숨기지 않고 해당 오류를 response로 반환한다. 이 capability는 active 여부와 무관하게
명시된 key의 native cache를 즉시 다시 조회한다. stale 표시만 필요한 후속 사용 사례는 의미가 다른
`invalidateQueries` capability를 별도로 추가한다.

## 검증

- contract 밖 method의 register 및 invoke가 TypeScript에서 거부된다.
- 마지막 handler가 우선되고, top 또는 중간 handler 해제 후 올바른 handler가 남는다.
- handler가 없으면 `BridgeUnavailableError`가 반환된다.
- handshake의 methods에 따라 `supports()`가 동기적으로 동작한다.
- WebView reload 뒤 init handshake가 bridge info를 다시 전달하며, pre-ready `supports()`는 false다.
- malformed message와 unknown method는 serializable protocol error로, handler throw는 `BridgeHandlerError`로 반환된다.
- timeout과 protocol 오류가 구분된다.
- Proxy client가 `then`을 노출하지 않는다.
- React handler unmount가 자신의 registration만 해제한다.

## 작업 방식

- 파이프라인: 단일 기능 구현 + 구현 후 단위 테스트
- 브랜치: `codex/bridge-infrastructure`
- TDD 전략: A (구현 후 단위 테스트 작성)
- E2E 테스트: 불필요 — WebView 화면 연결은 이번 범위 밖
