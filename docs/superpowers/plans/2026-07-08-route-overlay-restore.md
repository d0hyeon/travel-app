# RouteOverlay 라우트 전환 후 복원 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `useRouteOverlay`로 연 오버레이가 라우트 전환 뒤 뒤로가기로 돌아왔을 때 다시 뜨도록, 렌더링 책임을 호출 컴포넌트에서 root의 전역 렌더러로 옮긴다.

**Architecture:** renderer를 라우터/React 트리와 무관한 전역 store에 등록한다(A 언마운트로 삭제하지 않음). root에 상주하는 `RouteOverlayRenderer`가 `location.state.routeOverlays` 스택을 읽어 각 항목을 store의 renderer로 그린다. `useRouteOverlay`는 상태·네비게이션 제어와 store 등록만 담당하고, 반환 인터페이스(`isOpen`/`open`/`close`/`Link`)는 변경하지 않는다.

**Tech Stack:** React 19, React Router 7 (framework mode), TypeScript, Vitest 3 + happy-dom + @testing-library/react.

## Global Constraints

- 사용처 6곳(`usePostOverlay`, `useExplorerPlaceModal/SidePannel`, `PostScreen`, `MostSavedSection`, `RecentHotSection`, `TopVisitedPage.mobile`)의 `useRouteOverlay` 호출 시그니처와 반환 인터페이스는 **변경하지 않는다.**
- renderer 계약: **open 시점 클로저 스냅샷으로 동작**한다. 반응성이 필요하면 오버레이를 컴포넌트로 정의해 내부에서 훅을 호출한다. (재확인용 — 리팩터 대상 아님)
- store는 A 언마운트로 renderer를 **삭제하지 않는다.** 별도 정리 로직도 두지 않는다(YAGNI).
- 기존 파일 `src/shared/hooks/extends/useRouteOverlay.tsx` 는 `src/shared/hooks/extends/route-overlay/useRouteOverlay.tsx` 로 이동한다. import 경로(`~shared/hooks/extends/useRouteOverlay`)를 쓰는 모든 사용처를 함께 갱신한다.
- 테스트 실행: `pnpm test`. 파일 위치 관습: 대상과 같은 디렉토리의 `__tests__/`.
- 커밋 메시지 말미: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`

---

## File Structure

```
src/shared/hooks/extends/route-overlay/
  ├── routeOverlayStore.ts              (신규) id → renderer Map + 구독. 순수 store
  ├── __tests__/routeOverlayStore.test.ts (신규) store 계약 검증
  ├── RouteOverlayRenderer.tsx           (신규) root 상주 렌더러 + RouteOverlaySlot
  └── useRouteOverlay.tsx                (이동) 상태·네비 제어 + store 등록, 렌더 로직 제거

src/app/root.tsx                         (수정) OverlayProvider 안에 <RouteOverlayRenderer /> 추가
```

기존 `src/shared/hooks/extends/useRouteOverlay.tsx` 삭제(이동). 사용처 import 경로 갱신.

---

### Task 1: routeOverlayStore — renderer 보관소

**Files:**
- Create: `src/shared/hooks/extends/route-overlay/routeOverlayStore.ts`
- Test: `src/shared/hooks/extends/route-overlay/__tests__/routeOverlayStore.test.ts`

**Interfaces:**
- Consumes: 없음 (순수 모듈)
- Produces:
  - `type RouteOverlayRenderer = (props: { isOpen: boolean; close: () => void; onClose: () => void; data: unknown }) => ReactNode`
  - `registerRouteOverlay(id: string, renderer: RouteOverlayRenderer): void`
  - `getRouteOverlay(id: string): RouteOverlayRenderer | undefined`
  - `subscribeRouteOverlay(listener: () => void): () => void`

이 store는 라우터/React 트리와 독립이다. `register`는 open 시점 renderer로 덮어쓴다. **어떤 경로로도 삭제하지 않는다** — 복원의 핵심 계약이다. `subscribe`는 register 발생 시 리스너에 통지한다(복원 직후 renderer가 늦게 등록되는 경우 슬롯이 재렌더하도록).

- [ ] **Step 1: Write the failing test**

```ts
// src/shared/hooks/extends/route-overlay/__tests__/routeOverlayStore.test.ts
import { describe, it, expect, vi } from 'vitest'
import {
  registerRouteOverlay,
  getRouteOverlay,
  subscribeRouteOverlay,
} from '../routeOverlayStore'

describe('routeOverlayStore', () => {
  it('등록한 renderer를 id로 조회할 수 있다', () => {
    const renderer = () => null
    registerRouteOverlay('overlay-a', renderer)

    expect(getRouteOverlay('overlay-a')).toBe(renderer)
  })

  it('같은 id로 다시 등록하면 최신 renderer로 덮어쓴다', () => {
    const first = () => null
    const second = () => null
    registerRouteOverlay('overlay-b', first)
    registerRouteOverlay('overlay-b', second)

    expect(getRouteOverlay('overlay-b')).toBe(second)
  })

  it('등록되지 않은 id는 undefined를 반환한다', () => {
    expect(getRouteOverlay('never-registered')).toBeUndefined()
  })

  it('register가 발생하면 구독자에게 통지한다', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeRouteOverlay(listener)

    registerRouteOverlay('overlay-c', () => null)

    expect(listener).toHaveBeenCalledTimes(1)
    unsubscribe()
  })

  it('unsubscribe 후에는 통지하지 않는다', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeRouteOverlay(listener)
    unsubscribe()

    registerRouteOverlay('overlay-d', () => null)

    expect(listener).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/shared/hooks/extends/route-overlay/__tests__/routeOverlayStore.test.ts`
Expected: FAIL — `../routeOverlayStore` 모듈 없음 (Cannot find module)

- [ ] **Step 3: Write minimal implementation**

```ts
// src/shared/hooks/extends/route-overlay/routeOverlayStore.ts
import type { ReactNode } from 'react'

export type RouteOverlayRenderProps = {
  isOpen: boolean
  close: () => void
  onClose: () => void
  data: unknown
}

export type RouteOverlayRenderer = (props: RouteOverlayRenderProps) => ReactNode

const renderers = new Map<string, RouteOverlayRenderer>()
const listeners = new Set<() => void>()

export function registerRouteOverlay(id: string, renderer: RouteOverlayRenderer) {
  renderers.set(id, renderer)
  listeners.forEach((listener) => listener())
}

export function getRouteOverlay(id: string): RouteOverlayRenderer | undefined {
  return renderers.get(id)
}

export function subscribeRouteOverlay(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/shared/hooks/extends/route-overlay/__tests__/routeOverlayStore.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/shared/hooks/extends/route-overlay/routeOverlayStore.ts src/shared/hooks/extends/route-overlay/__tests__/routeOverlayStore.test.ts
git commit -m "feat: route overlay renderer 전역 store 추가

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: useRouteOverlay 이동 + 렌더 로직 제거 + store 등록

**Files:**
- Create: `src/shared/hooks/extends/route-overlay/useRouteOverlay.tsx` (기존 파일 이동)
- Delete: `src/shared/hooks/extends/useRouteOverlay.tsx`
- Modify (import 경로): 사용처 6곳
  - `src/features/post/usePostOverlay.tsx`
  - `src/features/post/PostScreen.tsx`
  - `src/features/explorer/useExplorerPlaceOverlay.tsx`
  - `src/features/explorer/explorer-saved/MostSavedSection.tsx`
  - `src/features/explorer/explorer-recent/RecentHotSection.tsx`
  - `src/features/explorer/explorer-ranking/TopVisitedPage.mobile.tsx`

**Interfaces:**
- Consumes: `registerRouteOverlay` (Task 1)
- Produces:
  - `useRouteOverlay<Data>(path, renderer)` → `{ isOpen, open, close, Link }` (**시그니처·반환 불변**)
  - `RouteOverlayRenderProps<Data>` export 유지 (기존과 동일)
  - `useRouteId()` — 내부 헬퍼, export 하지 않음 (기존과 동일). Task 3에서 별도로 복제하지 않고, id 계산이 필요하면 이 파일에서 named export로 노출한다 → 아래 Step에서 `export function useRouteId()` 로 변경.

이 태스크는 **동작 변경이 아니라 구조 이전**이다. 렌더링을 담당하던 `useEffect`(overlay.open ...)를 삭제하고, 그 자리를 `registerRouteOverlay(id, renderer)` 등록으로 대체한다. 실제 렌더는 Task 3의 `RouteOverlayRenderer`가 맡는다. 이 태스크 완료 시점엔 오버레이가 화면에 안 뜨는 게 정상이다(Task 3에서 복구). 따라서 이 태스크는 Task 3와 한 묶음으로 검증한다 — 커밋은 분리하되 수동 확인은 Task 3 이후.

- [ ] **Step 1: 새 위치로 파일 복사 후 렌더 로직 제거**

`src/shared/hooks/extends/route-overlay/useRouteOverlay.tsx` 를 아래 내용으로 생성한다. (기존 파일에서 `useEffect` 렌더 블록과 `useOverlay`/`useIsMobile`/`usePreservedValue`/`usePreservedCallback(renderer)` 관련 렌더 의존을 제거하고, `renderElement` 대신 `registerRouteOverlay` 등록으로 대체.)

```tsx
// src/shared/hooks/extends/route-overlay/useRouteOverlay.tsx
import { useCallback, useMemo, useRef, type ReactNode } from "react";
import { Link, useLocation, useNavigate, type LinkProps } from "react-router";
import { registerRouteOverlay } from "./routeOverlayStore";

export interface RouteOverlayRenderProps<Data = never> {
  isOpen: boolean;
  close: () => void;
  onClose: () => void;
  data: Data;
}

export function useRouteOverlay<Data = never>(
  path: string | ((params: Data) => string),
  renderer: (props: RouteOverlayRenderProps<Data>) => ReactNode
) {
  const id = useRouteId();
  const { pathname, state } = useLocation();
  const { routeOverlays = [] } = state ?? {};

  const currentOverlay = routeOverlays.find((x: { id: string }) => x.id === id);
  const isOpen = !!currentOverlay;

  // 렌더 주체는 root의 RouteOverlayRenderer. 여기서는 등록만 한다.
  registerRouteOverlay(id, renderer as (props: RouteOverlayRenderProps) => ReactNode);

  const getPath = usePreservedCallback(
    (data: Data) => (path instanceof Function ? path(data) : path)
  );

  const navigate = useNavigate();

  const open = useCallback((data: Data) => {
    const maskPath = getPath(data);
    const nextState = { routeOverlays: [...routeOverlays, { id, data }] };
    return navigate({ pathname, hash: id }, { mask: maskPath, state: nextState });
  }, [routeOverlays, id]);

  const close = useCallback(() => {
    if (isOpen) navigate(-1);
  }, [isOpen]);

  return useMemo(() => ({
    isOpen,
    close,
    open,
    Link: (props: Omit<LinkProps, 'to' | 'mask' | 'state'> & { data: Data }) => (
      <Link
        {...props}
        mask={getPath(props.data)}
        to={{ pathname, hash: id }}
        state={{ routeOverlays: [...routeOverlays, { id, data: props.data }] }}
      />
    )
  }), [id, close, open]);
}

export function useRouteId() {
  const location = useLocation();
  const { pathname, search, mask, hash } = location;

  return useRef(mask != null
    ? `${mask.pathname}?${mask.search.toString()}#${hash}`
    : `${pathname}?${search.toString()}#${hash}`
  ).current;
}
```

> 주의: `usePreservedCallback` import가 필요하다. 기존 파일과 동일하게 `import { usePreservedCallback } from "../usePreservedCallback";` 를 추가한다 (경로는 `route-overlay/` 기준 한 단계 상위 `../usePreservedCallback`). `usePreservedValue`, `useIsMobile`, `useOverlay` import는 제거한다.

- [ ] **Step 2: 기존 파일 삭제**

```bash
git rm src/shared/hooks/extends/useRouteOverlay.tsx
```

- [ ] **Step 3: 사용처 6곳 import 경로 갱신**

각 파일에서 아래를 치환한다:

```
- from "~shared/hooks/extends/useRouteOverlay"
+ from "~shared/hooks/extends/route-overlay/useRouteOverlay"
```

대상: `usePostOverlay.tsx`, `PostScreen.tsx`, `useExplorerPlaceOverlay.tsx`, `MostSavedSection.tsx`, `RecentHotSection.tsx`, `TopVisitedPage.mobile.tsx`.

확인 명령:
```bash
grep -rn "extends/useRouteOverlay" src
```
Expected: `route-overlay/useRouteOverlay` 로 끝나는 라인만 남고, 옛 경로는 0건.

- [ ] **Step 4: 타입체크로 이전 검증**

Run: `pnpm exec tsc --noEmit`
Expected: `useRouteOverlay` 관련 에러 없음. (다른 무관한 기존 에러가 있으면 무시하되, 이 태스크가 만든 에러가 없는지 확인.)

- [ ] **Step 5: Commit**

```bash
git add src/shared/hooks/extends/route-overlay/useRouteOverlay.tsx src/features
git commit -m "refactor: useRouteOverlay 렌더 책임 분리 — store 등록만 담당하고 route-overlay/로 이동

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: RouteOverlayRenderer — root 상주 전역 렌더러

**Files:**
- Create: `src/shared/hooks/extends/route-overlay/RouteOverlayRenderer.tsx`
- Modify: `src/app/root.tsx` (OverlayProvider 안에 `<RouteOverlayRenderer />` 추가)

**Interfaces:**
- Consumes: `getRouteOverlay`, `subscribeRouteOverlay` (Task 1); `useOverlay` from `~shared/hooks/useOverlay`; `useIsMobile` from `~shared/hooks/env/useIsMobile`
- Produces: `RouteOverlayRenderer` (default 아님, named export) — props 없음

`RouteOverlayRenderer`는 `location.state.routeOverlays` 배열을 읽어 각 `{ id, data }`를 `RouteOverlaySlot`으로 렌더한다. 각 슬롯은 자기 `useOverlay` 인스턴스를 소유하고, 기존 `useRouteOverlay`가 갖던 마운트/cleanup effect(모바일 unmount vs 데스크톱 close)를 그대로 갖는다. store에 renderer가 아직 없으면(복원 직후 타이밍) `subscribeRouteOverlay`로 재렌더를 유도한다.

- [ ] **Step 1: RouteOverlayRenderer 작성**

```tsx
// src/shared/hooks/extends/route-overlay/RouteOverlayRenderer.tsx
import { useEffect, useSyncExternalStore } from "react";
import { useLocation, useNavigate } from "react-router";
import { useOverlay } from "~shared/hooks/useOverlay";
import { useIsMobile } from "~shared/hooks/env/useIsMobile";
import {
  getRouteOverlay,
  subscribeRouteOverlay,
} from "./routeOverlayStore";

interface RouteOverlayEntry {
  id: string;
  data: unknown;
}

export function RouteOverlayRenderer() {
  const { state } = useLocation();
  const { routeOverlays = [] } = (state ?? {}) as { routeOverlays?: RouteOverlayEntry[] };

  return (
    <>
      {routeOverlays.map((entry) => (
        <RouteOverlaySlot key={entry.id} id={entry.id} data={entry.data} />
      ))}
    </>
  );
}

function RouteOverlaySlot({ id, data }: RouteOverlayEntry) {
  const overlay = useOverlay();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // store에 renderer가 늦게 등록되는 경우(복원 직후)를 대비해 구독한다.
  const renderer = useSyncExternalStore(
    subscribeRouteOverlay,
    () => getRouteOverlay(id)
  );

  useEffect(() => {
    if (!renderer) return;

    const handleClose = () => navigate(-1);
    overlay.open((props) =>
      renderer({ ...props, close: handleClose, data })
    );

    return () => {
      // 모바일은 뒤로가기 제스처 모션과 충돌할 수 있어 즉시 unmount 한다.
      if (isMobile) overlay.unmount();
      else overlay.close(); // (close: 상태변경(모션) 후 unmount)
    };
  }, [renderer, isMobile]);

  return null;
}
```

> 설계 노트: 기존 코드의 `getIsOpen`/`usePreservedValue` 가드는 "이 훅이 열림 상태일 때만 navigate(-1)"을 위한 것이었다. 여기서는 슬롯이 `routeOverlays`에 존재할 때만 렌더되므로, 슬롯이 살아있는 동안은 항상 열림 상태다 → `handleClose`는 단순히 `navigate(-1)`. 슬롯이 언마운트되면(뒤로가기로 배열에서 빠지면) cleanup이 돌아 오버레이가 닫힌다.

- [ ] **Step 2: root.tsx에 렌더러 추가**

`src/app/root.tsx` 의 `OverlayProvider` 자식으로 `<RouteOverlayRenderer />` 를 추가한다. `ToastRenderer` 옆에 둔다.

```tsx
// import 추가
import { RouteOverlayRenderer } from '~shared/hooks/extends/route-overlay/RouteOverlayRenderer'
```

```tsx
            <OverlayProvider>
              <SearchParamProvider>
                <Suspense fallback={<SplashScreen />}>
                  <AuthErrorBoundary>
                    <Outlet />
                  </AuthErrorBoundary>
                </Suspense>
              </SearchParamProvider>

              <AppInitializer />
              <ToastRenderer />
              <RouteOverlayRenderer />
            </OverlayProvider>
```

- [ ] **Step 3: 타입체크**

Run: `pnpm exec tsc --noEmit`
Expected: route-overlay 관련 에러 없음.

- [ ] **Step 4: 전체 테스트 통과 확인**

Run: `pnpm test`
Expected: 기존 테스트 + Task 1 store 테스트 모두 PASS. 회귀 없음.

- [ ] **Step 5: Commit**

```bash
git add src/shared/hooks/extends/route-overlay/RouteOverlayRenderer.tsx src/app/root.tsx
git commit -m "feat: RouteOverlayRenderer를 root에 상주시켜 라우트 전환 후 오버레이 복원

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: 수동 검증 (E2E 시나리오 수동 확인)

**Files:** 없음 (실행 검증만)

이 기능의 핵심 회귀는 브라우저 히스토리·언마운트 타이밍에 걸려 단위 테스트로 재현이 어렵다. 아래를 실제 앱에서 확인한다. (자동화가 필요하면 별도 MSW E2E 스펙으로 추가 — 이 계획 범위 밖.)

- [ ] **Step 1: dev 서버 실행**

Run: `pnpm dev`

- [ ] **Step 2: 복원 시나리오 확인 (핵심 버그)**

1. 피드(`/feed`)에서 포스트 오버레이를 연다 → 오버레이 안에서 장소를 눌러 장소 오버레이를 연다 (오버레이 위 오버레이 or 라우트 전환).
2. 오버레이가 열린 상태에서 다른 라우트로 이동(예: 탐색 탭 등 라우트 변경).
3. 브라우저 뒤로가기.

Expected: **이전 오버레이가 다시 뜬다.** (수정 전에는 뜨지 않았음.)

- [ ] **Step 3: 기존 동작 회귀 확인**

- `열기 → 뒤로가기`: 오버레이가 닫히고 배경 라우트로 돌아온다.
- 모바일 뷰포트: 뒤로가기 제스처 시 즉시 unmount(모션 충돌 없음).
- 데스크톱 뷰포트: 닫기 시 close 애니메이션(약 300ms) 후 사라진다.
- 중첩 오버레이: 여러 개가 순서대로 쌓이고, 뒤로가기로 하나씩 닫힌다.
- 사용처 6곳 각각(post 상세, place 모달/사이드패널, explorer 카드/지도) 오버레이가 정상 표시된다.

- [ ] **Step 4: 결과 기록**

확인된 시나리오와 이상 유무를 커밋 없이 사용자에게 보고한다. 이상이 있으면 해당 Task로 돌아가 수정한다.

---

## Self-Review

**Spec coverage:**
- 근본 원인(렌더 책임이 A에 묶임) → Task 2가 렌더 로직 제거, Task 3가 전역 렌더러로 이전. ✓
- store가 A 언마운트로 삭제 안 함 → Task 1 store에 삭제 API 없음 + 계약 테스트. ✓
- renderer 클로저 스냅샷 계약 → 리팩터 없음(Global Constraints에 재확인). ✓
- 사용처 인터페이스 불변 → Task 2가 반환 shape 유지, import만 갱신. ✓
- root 상주 렌더러 → Task 3 root.tsx 수정. ✓
- 중첩 스택 → Task 3가 `routeOverlays.map`. ✓
- 모바일/데스크톱 cleanup → Task 3 slot effect에 이관. ✓
- store 정리 로직 없음(YAGNI) → Task 1에 미포함. ✓

**Placeholder scan:** 코드 스텝 모두 실제 코드 포함. "적절히 처리" 류 없음. ✓

**Type consistency:** `registerRouteOverlay`/`getRouteOverlay`/`subscribeRouteOverlay`/`RouteOverlayRenderer`/`RouteOverlayRenderProps`/`useRouteId` 이름이 Task 1~3에서 일관. `useRouteOverlay` 반환 shape가 기존과 동일. ✓
