# WebView Bridge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 설정 웹뷰가 `closeWebView`와 `refetchQueries` capability를 타입 안전하게 호출할 수 있는 App ↔ Web bridge 기반을 만든다.

**Architecture:** `@waylog/bridge`가 contract, Native host runtime, Web client runtime을 subpath로 분리한다. Host는 WebView 라이브러리에 의존하지 않는 transport adapter와 method별 handler stack을 소유하고, Client는 browser message transport와 handshake cache를 숨긴 타입 안전한 API를 제공한다.

**Tech Stack:** TypeScript 5.9, React 19, React Native/Expo, TanStack React Query 5

**Spec:** `docs/superpowers/specs/2026-09-28-webview-bridge-design.md`

## Global Constraints

- `contract`는 host, client, App, Web, React Query에 의존하지 않는다.
- Public method는 property function syntax와 단일 object parameter를 사용한다.
- JSON wire envelope과 runtime validation을 거친 parameter만 handler에 전달한다.
- handler cleanup은 registration ID로 해당 entry만 제거한다.
- 사용자 요청에 따라 새 자동화 테스트와 E2E 테스트를 작성하지 않는다.
- 완료 검증은 TypeScript 검사, lint, web build, WebView 수동 점검으로 한다.

## Review Focus

- 지원 capability지만 현재 handler가 없을 때 `supports()`는 true이고 호출은 `BridgeUnavailableError`여야 한다.
- malformed message와 잘못된 DTO는 handler에 전달되면 안 된다.
- WebView reload 후 init handshake는 capability info를 다시 받아야 한다.
- dispose와 timeout은 pending request timer를 모두 해제해야 한다.
- `refetchQueries`는 inactive query도 다시 조회해야 한다.

---

## File Structure

- Create: `packages/bridge/package.json` — public export map, peer/dev dependency, ts-check script.
- Create: `packages/bridge/tsconfig.json` — strict package type-check config.
- Create: `packages/bridge/src/contract.ts` — capability DTO, method type, runtime method 목록.
- Create: `packages/bridge/src/protocol.ts` — wire envelopes, shared transport boundary, runtime guards.
- Create: `packages/bridge/src/errors.ts` — serializable protocol errors와 client errors.
- Create: `packages/bridge/src/host.ts` — handler stack, host dispatch, React adapter.
- Create: `packages/bridge/src/client.ts` — browser transport, handshake, typed RPC client.
- Create: `packages/bridge/src/index.ts` — shared public type re-export.
- Create: `apps/waylog-app/src/shared/bridge/refetchQueriesHandler.ts` — app QueryClient adapter.
- Modify: `apps/waylog-app/package.json`, `apps/waylog-web/package.json` — workspace dependency.
- Modify: `docs/codebase.md` — bridge boundary 및 lifecycle ownership.

### Task 1: Contract와 protocol을 만든다

**Files:**
- Create: `packages/bridge/package.json`
- Create: `packages/bridge/tsconfig.json`
- Create: `packages/bridge/src/contract.ts`
- Create: `packages/bridge/src/protocol.ts`
- Create: `packages/bridge/src/errors.ts`
- Create: `packages/bridge/src/index.ts`

**Interfaces:**
- Produces: `BridgeContract`, `BridgeMethod`, `bridgeMethods`, `bridgeVersion`, `BridgeInfo`, `BridgeTransport`, request/response/init/info envelope, `validateBridgeParams`, bridge error classes.

- [ ] **Step 1: Add package exports for root, `./contract`, `./host`, and `./client`; add the `ts-check` script, strict tsconfig, `react >=19` peer dependency, and `@types/react` development dependency.**

- [ ] **Step 2: Define the complete initial contract.**

```ts
export interface BridgeContract {
  closeWebView: (params: CloseWebViewParams) => Promise<void>
  refetchQueries: (params: RefetchQueriesParams) => Promise<void>
}
export type BridgeMethod = Extract<keyof BridgeContract, string>
export const bridgeMethods = ['closeWebView', 'refetchQueries'] as const
  satisfies readonly BridgeMethod[]
export const bridgeVersion = 1
export type BridgeQueryKeyPart = string | number | boolean | null
export type BridgeQueryKey = BridgeQueryKeyPart[]
```

- [ ] **Step 3: Use `bridgeMethods` as the single runtime source for unknown-method validation, then add JSON envelope runtime guards.**

```ts
export function validateBridgeParams(
  method: BridgeMethod,
  params: unknown,
): params is Parameters<BridgeContract[BridgeMethod]>[0]
```

Accept only an empty plain object for `closeWebView`; accept `queryKeys` arrays whose segments are strings, finite numbers, booleans, or null for `refetchQueries`.

- [ ] **Step 4: Define `unsupported`, `unavailable`, `timeout`, `protocol`, and `handler` error codes; serialize only code/message; reconstruct `handler` as public `BridgeHandlerError`.**

- [ ] **Step 5: Verify static exports.**

Run: `pnpm --filter @waylog/bridge ts-check`

Expected: package and every subpath resolve without a TypeScript error.

- [ ] **Step 6: Commit the contract.**

```bash
git add packages/bridge
git commit -m "feat(bridge): 웹뷰 브리지 계약을 추가한다"
```

### Task 2: Native host와 lifecycle registration을 구현한다

**Files:**
- Create: `packages/bridge/src/host.ts`

**Interfaces:**
- Consumes: Task 1 protocol, contract, errors, shared `BridgeTransport`.
- Produces: `BridgeHost`, `createBridgeHost`, `useBridgeHandler`.

- [ ] **Step 1: Consume Task 1's shared `BridgeTransport`; do not import client code or any WebView library.**

- [ ] **Step 2: Add a typed stack registration API.**

```ts
register: <Method extends BridgeMethod>(
  method: Method,
  handler: BridgeContract[Method],
) => () => void
dispose: () => void
```

Assign each registration a Symbol ID; cleanup removes exactly that entry, never a simple stack pop.

- [ ] **Step 3: Dispatch validated requests to the latest handler, return unavailable when no handler exists, normalize throws, and ignore malformed inbound messages after emitting a protocol response where correlation is available. `dispose()` unsubscribes its transport listener, clears every handler stack, and ignores later inbound messages.**

- [ ] **Step 4: Create the host as `createBridgeHost(transport, { appVersion })`. Send `bridge-info` with Task 1's `bridgeVersion`, injected App version, and `bridgeMethods` on creation and every client-originated valid `bridge-init`. Its method list never comes from the current handler stack.**

- [ ] **Step 5: Add `useBridgeHandler(host, method, handler)` using `useEffect` and exact unregister cleanup.**

- [ ] **Step 6: Manually exercise an in-memory transport: valid request, malformed JSON, unknown method, missing handler, top removal, and middle-stack removal.**

- [ ] **Step 7: Run `pnpm --filter @waylog/bridge ts-check && pnpm lint`, then commit.**

```bash
git add packages/bridge/src/host.ts
git commit -m "feat(bridge): 네이티브 핸들러 호스트를 추가한다"
```

### Task 3: Web client와 browser transport를 구현한다

**Files:**
- Create: `packages/bridge/src/client.ts`

**Interfaces:**
- Consumes: Task 1 protocol and errors.
- Produces: `BridgeClient`, `createBridgeClient`, `bridgeClient`.

- [ ] **Step 1: Expose the typed client surface.**

```ts
export interface BridgeClient {
  ready: () => Promise<void>
  supports: <Method extends BridgeMethod>(method: Method) => boolean
  closeWebView: BridgeContract['closeWebView']
  refetchQueries: BridgeContract['refetchQueries']
  dispose: () => void
}
```

- [ ] **Step 2: Make `createBridgeClient(transport)` accept Task 1's shared `BridgeTransport`; the browser singleton supplies its own adapter. Own request IDs, timeout timers, correlation, and settlement internally. Unknown/duplicate responses do nothing; `dispose()` rejects pending calls as unavailable, clears timers, and unsubscribes its listener.**

- [ ] **Step 3: Send `bridge-init` on client start; cache a compatible `bridge-info`. Before it arrives `supports()` is false. In an ordinary browser with no native transport, reject `ready()` immediately as unavailable; incompatible major versions reject it as unsupported.**

- [ ] **Step 4: Adapt `window.ReactNativeWebView.postMessage` and browser message events without importing host code. On an ordinary browser, preserve the client surface but leave it unsupported. Do not expose a thenable or forward symbols.**

- [ ] **Step 5: Manually loop a client and host transport, checking delayed info, re-init after simulated reload, timeout, and disposal.**

- [ ] **Step 6: Run `pnpm --filter @waylog/bridge ts-check && pnpm --filter waylog-web ts-check && pnpm build`, then commit.**

```bash
git add packages/bridge/src/client.ts
git commit -m "feat(bridge): 웹 브리지 클라이언트를 추가한다"
```

### Task 4: App query adapter와 workspace integration을 추가한다

**Files:**
- Create: `apps/waylog-app/src/shared/bridge/refetchQueriesHandler.ts`
- Modify: `apps/waylog-app/package.json`
- Modify: `apps/waylog-web/package.json`
- Modify: `docs/codebase.md`

**Interfaces:**
- Consumes: `RefetchQueriesParams`, app `queryClient`.
- Produces: `refetchBridgeQueries`, a handler passed later to `host.register('refetchQueries', handler)`.

- [ ] **Step 1: Add `@waylog/bridge: workspace:*` to both applications. Do not add `react-native-webview`: a concrete setting screen and its ref adapter are outside this infrastructure-only change.**

- [ ] **Step 2: Implement the app-owned query handler.**

```ts
export async function refetchBridgeQueries({
  queryKeys,
}: RefetchQueriesParams): Promise<void> {
  const uniqueQueryKeys = Array.from(
    new Map(queryKeys.map((queryKey) => [JSON.stringify(queryKey), queryKey])).values(),
  )
  await Promise.all(
    uniqueQueryKeys.map((queryKey) =>
      queryClient.refetchQueries({ queryKey, exact: true, type: 'all' }),
    ),
  )
}
```

The primitive-only DTO permits stable JSON-key deduplication. `exact: true` means one bridge key refetches only the same native query key, never a prefix family. Keep `closeWebView` unregistered until the setting screen owns its close/navigation action.

- [ ] **Step 3: Document bridge ownership in `docs/codebase.md`: the package owns protocol/runtime; each feature owns handler lifecycle; unsupported and unavailable are distinct states.**

- [ ] **Step 4: Run final static checks.**

Run: `pnpm --filter @waylog/bridge ts-check && pnpm --filter waylog-app ts-check && pnpm --filter waylog-web ts-check && pnpm lint && pnpm build`

Expected: all checks pass; no test command is run by request.

- [ ] **Step 5: When the setting WebView is introduced, manually verify its `onMessage` and ref `postMessage` adapter. Until then, document device smoke testing as intentionally deferred.**

- [ ] **Step 6: Commit integration and documentation.**

```bash
git add apps/waylog-app/src/shared/bridge apps/waylog-app/package.json apps/waylog-web/package.json docs/codebase.md
git commit -m "feat(bridge): 앱 쿼리 브리지 어댑터를 추가한다"
```
