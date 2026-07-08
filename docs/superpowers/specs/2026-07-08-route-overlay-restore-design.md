# RouteOverlay 라우트 전환 후 복원 설계

## 문제

`useRouteOverlay`로 연 오버레이가, 오버레이 위에서 라우트가 바뀐 뒤 뒤로가기로 돌아오면 복원되지 않는다.

시나리오:

```
A ─ [overlay open] ─ B ─ [route change] ─ C ─ [뒤로가기] ─ B
```

`A(피드) → B(장소 오버레이) → C(다른 라우트)`로 이동하면, C로 갈 때 오버레이를 연 컴포넌트(A)의 트리가 언마운트된다. 뒤로가기로 B에 돌아오면 히스토리 state에는 오버레이 정보가 살아있지만, 그 오버레이를 그릴 주체(A)가 트리에 없어 오버레이가 뜨지 않는다.

## 근본 원인

`useRouteOverlay`는 두 책임을 한 훅에 뭉쳐 갖고 있다.

1. **상태·네비게이션 제어** — `open` / `close` / `Link` / `isOpen` (히스토리 state 조작)
2. **렌더링** — `useEffect` + `overlay.open`으로 실제 DOM 마운트

버그는 책임 2가 **호출 컴포넌트(A)의 생명주기에 묶여 있기 때문**이다. "오버레이를 열어야 한다"는 사실은 라우터 히스토리 state(`location.state.routeOverlays`)에 남지만, "그것을 어떻게 그릴지"(renderer)와 "그리는 주체"(A)는 라우트에 묶여 있다. A가 죽으면 renderer를 실행할 effect가 사라져 복원이 불가능하다.

프레임워크 모드(config 기반 라우팅, `src/app/routes.ts`)라 React Router의 `<Routes location={background}>` 이중 렌더 관용구는 사용할 수 없다. 이미 `mask`로 "URL 위장 + 배경 라우트 유지"는 올바르게 구현되어 있으므로, 남은 문제는 **렌더 주체가 A라는 것 하나뿐**이다.

## 해결 방향

렌더링 책임을 A에서 떼어내 **root에 사는 단일 전역 렌더러**로 옮긴다. renderer를 전역 store에 등록하고, **A가 언마운트되어도 store 엔트리를 지우지 않는다.** 전역 렌더러는 root에 항상 살아있으므로, 뒤로가기로 B에 돌아오면 히스토리 state와 store만으로 오버레이를 복원한다.

상태·네비게이션 제어(`open`/`close`/`Link`/`isOpen`)는 A가 소비하는 인터페이스이므로 `useRouteOverlay`에 그대로 남는다. **사용처 인터페이스는 변경되지 않는다.**

### 검토했으나 버린 대안

- **route-as-overlay (React Router `background` 관용구)** — 프레임워크 모드에서 App이 소유하는 `<Routes>`가 없어 불가능. 탈락.
- **keep-alive (A를 언마운트하지 않음)** — 라우팅 정상 동작을 거스르는 트릭. 상태 누수·중복 렌더 위험. 비채택.
- **path → lazy component 매핑** — renderer를 두 군데(인라인 + lazy 테이블) 정의해야 해 이중 정의. 비채택.

## renderer 계약 (중요)

**renderer는 open 시점의 클로저 스냅샷으로 동작한다.**

A가 언마운트된 뒤 복원될 때, renderer가 캡처한 컴포넌트 로컬 변수는 open 시점의 값으로 굳는다. 반응성이 필요하면 renderer 함수 안에서 클로저로 캡처하는 대신 **오버레이를 컴포넌트로 정의**하고 그 컴포넌트 내부에서 훅(`useIsMobile` 등)을 호출한다. 그러면 렌더 주체가 전역이든 A든 항상 최신 상태에 반응한다.

현재 사용처 조사 결과, renderer가 `data` 외에 캡처하는 값은 3곳의 `isMobile`뿐이다(`PostScreen`, `MostSavedSection`, `RecentHotSection`). 오버레이가 열린 짧은 시간 동안 뷰포트가 바뀔 일은 사실상 없으므로 스냅샷으로 굳어도 무해하다. 이 계약을 수용하면 사용처 리팩터가 불필요하다.

## 구조

```
src/shared/hooks/extends/route-overlay/
  ├── routeOverlayStore.ts       전역 store: id → renderer Map + 구독
  ├── RouteOverlayRenderer.tsx    root에 마운트, store + location.state 읽어 렌더
  └── useRouteOverlay.tsx         open/close/Link/isOpen + store 등록 (렌더링 없음)
```

기존 `src/shared/hooks/extends/useRouteOverlay.tsx` 는 위 디렉토리로 이동한다. 3개 파일이 서로만 의존하는 하나의 기능이므로 한 디렉토리로 응집한다.

### `routeOverlayStore.ts`

라우터/React 트리와 무관한 순수 store. renderer 보관소.

```ts
type RouteOverlayRenderer = (props: RouteOverlayRenderProps<unknown>) => ReactNode

register(id: string, renderer: RouteOverlayRenderer): void  // open 시점 renderer 등록
get(id: string): RouteOverlayRenderer | undefined
subscribe(listener: () => void): () => void                  // 등록 변화 통지
```

정책:

- **A 언마운트로는 절대 delete 하지 않는다.** 이것이 복원의 핵심.
- store 정리 로직은 두지 않는다(YAGNI). `id`는 `path?search#hash`라 라우트 종류만큼만 존재하고, 같은 오버레이 재오픈 시 덮어써지므로 무한 증가하지 않는다.

### `RouteOverlayRenderer.tsx`

root.tsx의 `OverlayProvider` 안에 단 하나 마운트된다. `location.state.routeOverlays` 스택을 읽어 각 항목을 슬롯 컴포넌트로 렌더한다. A와 무관하게 root에 상주하므로 항상 복원 가능하다.

```tsx
function RouteOverlayRenderer() {
  const { state } = useLocation()
  const { routeOverlays = [] } = state ?? {}

  return routeOverlays.map(({ id, data }) => (
    <RouteOverlaySlot key={id} id={id} data={data} />
  ))
}
```

`RouteOverlaySlot`은 각자 `useOverlay` 인스턴스를 소유하고, 기존 `useRouteOverlay`의 `useEffect`(마운트/모바일·데스크톱 cleanup 분기)를 그대로 갖는다. `store.subscribe`로 등록 변화를 구독해 renderer가 늦게 등록되는 경우(복원 직후)에도 재렌더한다.

- 모바일: cleanup 시 `overlay.unmount()` (뒤로가기 제스처 모션 충돌 방지)
- 데스크톱: cleanup 시 `overlay.close()` (모션 후 unmount)
- 닫기 콜백: `navigate(-1)`

### `useRouteOverlay.tsx`

렌더링을 하지 않는다. 상태·네비게이션 제어 + store 등록만.

```ts
export function useRouteOverlay<Data>(path, renderer) {
  const id = useRouteId()
  register(id, renderer)   // 렌더 주체가 아니라 등록만. useEffect(overlay.open) 삭제

  // open / close / Link / isOpen — 기존 로직 그대로
}
```

반환 인터페이스(`isOpen`, `open`, `close`, `Link`)는 변경하지 않는다.

## 데이터 흐름

```
[A 살아있을 때]
  useRouteOverlay(renderer) → store.register(id, renderer)
  open(data) → navigate(mask, state.routeOverlays += {id,data})
                                    ↓
  RouteOverlayRenderer(root) ← location.state.routeOverlays
                                    ↓  각 {id,data} → RouteOverlaySlot
  store.get(id) → renderer({...props, data}) → overlay.open → 포탈 마운트

[A 죽은 뒤 뒤로가기로 B 복원]
  A 언마운트 → store 엔트리 유지 (핵심)
  navigate(-1) → location.state.routeOverlays 에 {id,data} 부활
                                    ↓
  RouteOverlayRenderer (root에 상주) → store.get(id) 여전히 존재 → 복원 ✅
```

## 영향 범위

- `src/app/root.tsx` — `OverlayProvider` 안에 `<RouteOverlayRenderer />` 추가
- `src/shared/hooks/extends/useRouteOverlay.tsx` — `route-overlay/` 디렉토리로 이동 + 렌더 로직 제거, import 경로 갱신
- 사용처 6곳 — **변경 없음** (인터페이스 불변)

## 검증

- `A → B(overlay) → C → 뒤로가기 → B`: 오버레이가 다시 뜬다.
- `A → B(overlay) → 뒤로가기 → A`: 기존 동작(닫힘) 유지.
- 중첩 오버레이(스택): `routeOverlays` 배열의 각 항목이 순서대로 렌더된다.
- 모바일/데스크톱 close 애니메이션 동작 유지.
- 기존 사용처 6곳(post/place/explorer) 회귀 없음.

---

## 개정 (2026-07-09) — id 모델 결함 수정

초기 구현 후 두 런타임 버그가 발견됐다. 둘 다 **id 모델**에서 비롯한다.

### 증상 1: 오버레이 열고 뒤로가기 시 수 초간 렌더 멈춤 (렌더 폭풍)

`useRouteOverlay`가 렌더될 때마다 `registerRouteOverlay(id, renderer)`로 **새 클로저 renderer를 store에 덮어쓰고**, `register`가 모든 구독자에게 통지한다. `RouteOverlaySlot`의 `useSyncExternalStore` getSnapshot이 매번 다른 renderer 참조를 반환해 재렌더 → 재등록 → 재통지 루프가 돈다.

### 증상 2: 오버레이 위에 오버레이를 또 열면 새 게 안 뜨고 기존 게 닫힘 (id 중복)

`useRouteId`가 renderer 종류를 구분하지 않고 배경 location만으로 id를 만든다. 같은 배경(예: `/feed`)에서 오버레이를 두 번 열면 **같은 id**가 스택에 중복 → `key` 충돌 + store 덮어쓰기.

### 근본 원인

id를 **"훅 인스턴스"** 에 묶으려 했으나, 두 요구가 상충한다.

1. **결정론** — 복원 시 히스토리 state의 id와 매칭돼야 함 → `useId()` 불가
2. **유니크** — 같은 배경에서 여러 오버레이를 쌓으면 서로 달라야 함 → `useRouteId()`(현재) 불가

`useRouteId`는 1만 만족하고 2를 깬다. 원래 `useId()`는 2만 만족하고 1을 깬다.

### 재설계: 엔트리 id(유니크) + kind(renderer key) 분리

**사용처 조사 결과 `useRouteOverlay`가 반환하는 `isOpen`/`close`는 아무도 소비하지 않는다.** (renderer 콜백 내부의 `isOpen`/`close`는 `RouteOverlayRenderer`가 주입하는 별개 값.) 따라서 훅은 열린 오버레이의 상태를 추적할 필요가 없고, id를 소유할 이유도 없다.

- **오버레이 종류(kind)** = path 패턴 문자열(함수형 path는 이름/식별용 키를 사용). renderer는 **kind → renderer** 로 등록한다. kind당 한 번만 등록되면 되므로 매 렌더 재등록/통지 폭풍이 사라진다(**증상 1 해결**).
- **엔트리 id** = open 시점에 `crypto.randomUUID()`로 생성하는 유니크 값. 스택 엔트리는 `{ id, kind, data }`. 같은 kind를 여러 번 열어도 id가 달라 충돌 없다(**증상 2 해결**).
- 히스토리 state의 스택 엔트리에 `kind`가 저장되므로, 복원 시 `RouteOverlayRenderer`가 `kind`로 renderer를 조회한다. A가 죽어도 kind 등록만 살아있으면 복원된다(**요구 1·2 동시 충족**).

### 변경되는 인터페이스

- `routeOverlayStore`: key가 유니크 id가 아니라 **kind**. `registerRouteOverlay(kind, renderer)`.
- 히스토리 state 스키마: `routeOverlays: { id, data }[]` → `routeOverlays: { id, kind, data }[]`.
- `useRouteOverlay`: id 대신 kind를 계산해 등록. `open`/`Link`가 `crypto.randomUUID()`로 엔트리 id 생성. 반환에서 미사용 `isOpen`/`close`는 제거 가능하나, 회귀 최소화를 위해 유지하되 재설계된 의미로 계산.
- `RouteOverlayRenderer`: 엔트리의 `kind`로 renderer 조회. `useSyncExternalStore` 불필요(kind 등록이 마운트 전에 끝나 있음) — 단, 복원 타이밍 안전을 위해 구독은 유지하되 getSnapshot이 **안정 참조**(kind→renderer는 재등록 안 됨)라 폭풍 없음.

### 재검증 추가 항목

- 같은 배경에서 오버레이 2개 연속 open → 둘 다 표시, 각각 뒤로가기로 하나씩 닫힘.
- 오버레이 열고 뒤로가기 → 렌더 멈춤 없음(폭풍 제거).
