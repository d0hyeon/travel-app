# 마커 좌표 레지스트리 전환 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `NativeMap`이 `children`을 `Children.toArray`로 정적 스캔해 마커 목록을 얻는 방식을 제거하고, 각 `NativeMapMarker`가 마운트 시 스스로 좌표 레지스트리(Context)에 자신을 등록하는 방식으로 전환한다. 이를 통해 `children`이 함수형이라 최상위가 Fragment로 감싸이는 경우(`TripPlaceContent.tsx` 등) 마커가 컬링/클러스터링 로직에서 완전히 누락되는 버그를 근본적으로 해소한다.

**Architecture:** 웹(`waylog-web/src/shared/components/Map/useClusterRegistry.tsx`)이 이미 쓰는 "마커 자가등록" 패턴을 앱에 이식하되, RN(Mapbox `MarkerView`)의 제약에 맞게 변형한다. 웹은 클러스터링이 켜지면 개별 마커가 자기 렌더링을 멈추고 별도 `ClusterOverlays`가 레지스트리 데이터로 클러스터/단일마커를 전부 명령형으로 다시 그리지만(DOM 직접 조작), RN은 선언형이라 마커의 JSX(아이콘·라벨 등 커스텀 렌더)를 유지한 채, "이 마커가 지금 화면에 보여야 하는가"라는 판단 결과만 레지스트리 스냅샷을 소비하는 `NativeMap`이 계산해 `MapContext`로 각 마커에 다시 흘려보낸다. 각 마커는 이 판단을 구독해 자기 자신을 렌더링하거나 `null`을 반환해 스스로 숨긴다.

**Tech Stack:** React 19 (Context, `use()`), React Native, `@rnmapbox/maps` 10.3.5, TypeScript, Vitest.

**Spec:** 이 세션의 디버깅 세션 — `apps/waylog-app/src/features/trip/trip-place/TripPlaceContent.tsx`가 `Map`의 `children`을 함수형(`{({zoom}) => <>...</>}`)으로 넘기면 반환값 최상위가 Fragment가 되고, `NativeMap.tsx`의 `splitMarkers`(`Children.toArray` 기반)가 Fragment 내부를 펼치지 못해 그 안의 `Map.Marker`들이 컬링(`visibleMarkerProps`)·클러스터링(`clustered`) 계산에서 완전히 누락되는 것을 실측 확인(`console.log` 계측으로 `totalMarkers: 0` 확인). 원인 조사 중 과거 커밋 `af093bb9`(`"마커·경로가 마운트 시점에 스스로 좌표를 등록하는 방식으로 바꿔, Suspense나 조건부 렌더로 감싸인 자식도 자연스럽게 반영되게 한다"`)가 이미 `extendBound`(카메라 범위)에는 이 자가등록 패턴을 적용했으나, 그 뒤 추가된 컬링·클러스터링은 이 패턴으로 확장되지 않고 옛 정적 스캔에 남아있었던 것이 근본 원인으로 확인됨. 이 플랜은 컬링·클러스터링도 자가등록 패턴으로 통합한다. 별도 스펙 문서 없음 — 이 헤더가 스펙을 겸한다.

## Global Constraints

- `Map`/`Map.Marker`/`Map.Path`/`MapProps`/`MarkerProps`/`PathProps` 공개 인터페이스는 절대 변경하지 않는다 — 15개 이상의 소비자 파일이 이 계약에 의존한다. 이번 변경은 `NativeMap.tsx`/`NativeMapMarker.tsx`/`MapContext.ts`/`NativeMapCluster.tsx` 내부 구현만 바꾼다.
- `NativeMapMarker`의 시각적 렌더링(라벨/아이콘/툴팁/썸네일, `MarkerShape` 함수)은 절대 수정하지 않는다 — 이미 검증된 코드다.
- 타입 단언(`as`, `as unknown`, `as never`)을 새로 추가하지 않는다. 기존에 있던 `useImperativeHandle`의 `ref as never`(이 플랜 범위 밖)는 그대로 둔다.
- 이번 플랜의 첫 번째 태스크(Task 0)는 이전 디버깅 세션에서 `NativeMap.tsx`에 추가한 임시 `console.log` 3곳을 제거하는 것부터 시작한다 — 이게 끝나야 나머지 태스크의 diff가 깨끗해진다.
- `clusterMarkers`(`packages/domains/src/modules/map/cluster.core.ts`)는 순수 함수이므로 수정하지 않는다.
- `isCoordinateInBounds`(`useMapViewportCulling.ts`)도 순수 함수이므로 로직을 수정하지 않는다 — 호출하는 곳만 바뀐다.
- `Coordinate`/`MapBounds`/`MarkerData` 등 공유 타입(`@waylog/domains/modules/map`)은 변경하지 않는다.
- 빌드 검증: `pnpm --filter waylog-app exec tsc --noEmit -p . 2>&1 | tail -60`. 순수 로직(레지스트리, 컬링 판단)은 Vitest로 테스트한다. `NativeMapMarker.tsx`/`NativeMap.tsx` 자체는 이 코드베이스 규칙상 컴포넌트 테스트 인프라가 없으므로 최종 태스크에서 실기기 확인으로 검증한다.
- 커밋은 각 태스크 완료 시점에 한글 커밋 메시지로 분리한다 (변경 목적 단위 분리 원칙, CLAUDE.md 준수).

---

## File Structure

```
apps/waylog-app/src/shared/components/Map/
├── NativeMap.tsx                                  [대폭 수정] splitMarkers/findMarker/Children 스캔 제거,
│                                                    레지스트리 소비 + visibility 계산으로 교체
├── MapContext.ts                                   [수정] visibleMarkerIds 필드 추가
├── NativeMapMarker.tsx                             [수정] 레지스트리 등록 + 자기 가시성 판단 추가
├── NativeMapCluster.tsx                            [수정 없음] 그대로 유지
├── useMapMarkerRegistry.tsx                         [신규] 웹 useClusterRegistry.tsx를 본뜬 좌표 레지스트리
│                                                    (MarkerRegistryContext, useRegisterMapMarker,
│                                                    useRegisteredMapMarkers, MapMarkerRegistryProvider)
├── useMapMarkerRegistry.utils.ts                    [신규] 컬링+클러스터링 결과로부터
│                                                    "보여야 할 마커 id 집합"을 계산하는 순수 함수
├── __tests__/
│   └── useMapMarkerRegistry.utils.test.ts           [신규]
└── useMapViewportCulling.ts                         [수정 없음] 그대로 재사용
```

**책임 분리 근거:**
- `useMapMarkerRegistry.tsx`를 별도 파일로 분리하는 이유: 웹의 `useClusterRegistry.tsx`와 대칭되는 위치·이름으로 두어, 이후 이 코드를 유지보수하는 사람이 웹 구현과 나란히 비교하기 쉽게 한다. `NativeMap.tsx`에 인라인하면 이미 큰 파일이 더 커진다.
- `useMapMarkerRegistry.utils.ts`를 컴포넌트 파일에서 분리하는 이유: "레지스트리 스냅샷 + 컬링 bounds + 클러스터링 결과 → 최종 보여줄 id 집합"이라는 계산은 React 훅이 아닌 순수 함수로 만들 수 있고, 이래야 Vitest로 테스트 가능하다(CLAUDE.md의 "React Query 훅은 순수 로직을 `*.utils.ts`로 분리해 테스트" 원칙과 동일 패턴을 컴포넌트 로직에도 적용).

---

### Task 0: 디버그 로그 제거

**Files:**
- Modify: `apps/waylog-app/src/shared/components/Map/NativeMap.tsx`

**Interfaces:**
- Consumes: 없음
- Produces: 없음 (정리 작업)

이전 디버깅 세션에서 원인 조사를 위해 `NativeMap.tsx`에 임시로 추가한 `console.log` 3곳을 제거한다.

- [ ] **Step 1: 3곳의 DEBUG 로그와 그로 인한 부수 코드 제거**

`apps/waylog-app/src/shared/components/Map/NativeMap.tsx`를 열어 다음 3곳을 제거한다:

1. `splitMarkers` 호출 직후의 `console.log('[DEBUG splitMarkers]', {...})` 블록 전체.
2. `visibleMarkerProps`의 `useMemo` 안, `const result = markerProps.filter(...)` 다음의 `console.log('[DEBUG culling]', {...})` 블록. `return result`는 원래 형태인 `return markerProps.filter(...)`로 되돌린다(중간 변수 `result`도 로그를 위해서만 추가됐던 것이므로 함께 제거).
3. `extendBound`의 `useBatchedCallback` 콜백 안, `cameraRef.current?.fitBounds(...)` 호출 직전의 `console.log('[DEBUG extendBound flush]', {...})` 블록.

수정 후 `visibleMarkerProps`의 `useMemo` 블록은 다음과 같아야 한다:

```ts
const visibleMarkerProps = useMemo(() => {
  if (visibleBounds == null) return markerProps // 최초 마운트 시(bounds 미확정)는 전체 표시

  const latPadding = (visibleBounds.north - visibleBounds.south) * VIEWPORT_PADDING_RATIO
  const lngPadding = (visibleBounds.east - visibleBounds.west) * VIEWPORT_PADDING_RATIO
  const padding = Math.max(latPadding, lngPadding)

  return markerProps.filter((marker) =>
    isCoordinateInBounds({ lat: marker.lat, lng: marker.lng }, visibleBounds, padding),
  )
  // markerProps 는 매 렌더마다 새 배열이므로 값이 같은지로 비교한다.
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [markerIdentity, visibleBounds])
```

- [ ] **Step 2: 타입 체크**

Run: `pnpm --filter waylog-app exec tsc --noEmit -p . 2>&1 | tail -40`
Expected: `NativeMap.tsx` 관련 에러 없음.

- [ ] **Step 3: 커밋**

```bash
git add apps/waylog-app/src/shared/components/Map/NativeMap.tsx
git commit -m "chore(app): 디버그 로그 제거"
```

---

### Task 1: 마커 좌표 레지스트리 작성

**Files:**
- Create: `apps/waylog-app/src/shared/components/Map/useMapMarkerRegistry.tsx`

**Interfaces:**
- Consumes: 없음 (최초 태스크, `react`의 `createContext`/`use`/`useCallback`/`useMemo`/`useRef`/`useState`/`useEffect`만 사용)
- Produces:
  - `interface RegisteredMapMarker { id: string; lat: number; lng: number }`
  - `MapMarkerRegistryProvider({ children }: PropsWithChildren)` — 컴포넌트. `NativeMap`이 자식 트리를 이걸로 감싼다.
  - `useRegisterMapMarker(marker: RegisteredMapMarker): void` — 훅. `NativeMapMarker`가 마운트 시 호출한다. `marker.id`가 바뀌면(좌표 변경 등) 자동으로 재등록한다.
  - `useRegisteredMapMarkers(): { version: number; markers: RegisteredMapMarker[] }` — 훅. `NativeMap`이 레지스트리 스냅샷을 구독한다. `version`이 바뀔 때만 `markers` 배열이 새로 계산된다(리렌더 최소화).

이 파일은 웹의 `apps/waylog-web/src/shared/components/Map/useClusterRegistry.tsx`를 참고해 작성한다(아래 코드는 그 파일을 RN 상황에 맞게 변형한 것 — 웹처럼 `MarkerData`나 `onClick`/`color` 같은 렌더링 관련 필드는 담지 않고, 컬링·클러스터링 계산에 필요한 좌표+id만 담는다는 점이 유일한 차이다):

```tsx
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react'
import { useBatchedCallback } from '../../hooks/useBatchedCallback'

export interface RegisteredMapMarker {
  id: string
  lat: number
  lng: number
}

interface MapMarkerRegistryContextValue {
  version: number
  getRegistry: () => Map<string, RegisteredMapMarker>
  registerMarker: (marker: RegisteredMapMarker) => void
  unregisterMarker: (id: string) => void
}

const MapMarkerRegistryContext = createContext<MapMarkerRegistryContextValue | null>(null)

function useMapMarkerRegistryContext(): MapMarkerRegistryContextValue {
  const context = use(MapMarkerRegistryContext)
  if (context == null) {
    throw new Error('MapMarkerRegistryContext is not available. Make sure this is rendered inside <Map>.')
  }
  return context
}

// 마운트 시 스스로 좌표를 등록한다. 부모(NativeMap)가 children을 스캔하지 않으므로
// Fragment·Suspense·조건부 렌더로 감싸인 마커도 자동으로 반영된다.
export function useRegisterMapMarker(marker: RegisteredMapMarker): void {
  const { registerMarker, unregisterMarker } = useMapMarkerRegistryContext()

  useEffect(() => {
    registerMarker(marker)
    return () => unregisterMarker(marker.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marker.id, marker.lat, marker.lng])
}

export function useRegisteredMapMarkers(): { version: number; markers: RegisteredMapMarker[] } {
  const { version, getRegistry } = useMapMarkerRegistryContext()
  // version을 키로 스냅샷을 새로 만든다 — Map 참조 동일성만으로는 useMemo가 갱신을 못 잡는다.
  const markers = useMemo(() => Array.from(getRegistry().values()), [version])
  return { version, markers }
}

export function MapMarkerRegistryProvider({ children }: PropsWithChildren) {
  const registryRef = useRef<Map<string, RegisteredMapMarker>>(new Map())
  const [version, setVersion] = useState(0)

  const scheduleVersionBump = useBatchedCallback(() => {
    setVersion((current) => current + 1)
  })

  const registerMarker = useCallback((marker: RegisteredMapMarker) => {
    registryRef.current.set(marker.id, marker)
    scheduleVersionBump()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const unregisterMarker = useCallback((id: string) => {
    registryRef.current.delete(id)
    scheduleVersionBump()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getRegistry = useCallback(() => registryRef.current, [])

  const value = useMemo(
    () => ({ version, getRegistry, registerMarker, unregisterMarker }),
    [version, getRegistry, registerMarker, unregisterMarker],
  )

  return <MapMarkerRegistryContext value={value}>{children}</MapMarkerRegistryContext>
}
```

**중요 — 검증 후 필요하면 수정할 것:**

1. `useBatchedCallback`의 정확한 타입 시그니처를 `apps/waylog-app/src/shared/hooks/useBatchedCallback.ts`에서 직접 확인하라. 이 훅은 `useBatchedCallback<T = never>(onFlush: (items: T[]) => void, options?: { once?: boolean })` 형태이고, 인자 없이 호출하는 `collect()` 형태(제네릭 `T`가 `never`인 경우)를 지원한다 — 위 예시의 `scheduleVersionBump()`가 인자 없이 호출되는 것과 일치하는지 실제 타입 정의로 확인하라.
2. `<MapMarkerRegistryContext value={value}>` 문법(React 19의 Context Provider 축약형)이 이 프로젝트에서 실제로 쓰이는지 `apps/waylog-app/src/shared/components/Map/MapContext.ts`나 다른 최근 작성 파일(`PolygonLayer.tsx` 등)에서 확인하고, 프로젝트 관례와 다르면(`<MapMarkerRegistryContext.Provider value={value}>`) 그 관례를 따르라.
3. 타입 단언을 쓰지 마라.

- [ ] **Step 2: 타입 체크**

Run: `pnpm --filter waylog-app exec tsc --noEmit -p . 2>&1 | tail -40`
Expected: `useMapMarkerRegistry.tsx` 관련 에러 없음. (아직 아무도 이 파일을 import하지 않으므로 미사용 경고만 있을 수 있다 — 무시하고 다음 태스크에서 연결된다.)

- [ ] **Step 3: 커밋**

```bash
git add apps/waylog-app/src/shared/components/Map/useMapMarkerRegistry.tsx
git commit -m "feat(app): 마커 좌표 자가등록 레지스트리 추가"
```

---

### Task 2: 가시성 계산 순수 함수 작성 (TDD)

**Files:**
- Create: `apps/waylog-app/src/shared/components/Map/useMapMarkerRegistry.utils.ts`
- Test: `apps/waylog-app/src/shared/components/Map/__tests__/useMapMarkerRegistry.utils.test.ts`

**Interfaces:**
- Consumes: `RegisteredMapMarker`(Task 1), `MapBounds`(`@waylog/domains/modules/map`), `isCoordinateInBounds`(`./useMapViewportCulling`), `clusterMarkers`/`Cluster`/`ToPixel`(`@waylog/domains/modules/map`)
- Produces:
  - `interface MarkerVisibility { visibleMarkerIds: Set<string>; clusters: Cluster[] | null }`
  - `computeMarkerVisibility(params: { markers: RegisteredMapMarker[]; visibleBounds: MapBounds | null; clustering: boolean; clusterGridSize: number; toPixel: (bounds: MapBounds) => ToPixel; viewportWidth: number; paddingRatio: number }): MarkerVisibility`
  - `Task 3(NativeMap.tsx)`이 이 함수 하나로 컬링+클러스터링을 계산해 렌더링 분기에 쓴다.

이 함수는 지금 `NativeMap.tsx`에 흩어져 있는 컬링(`visibleMarkerProps` 계산)과 클러스터링(`clustered` 계산) 로직을 하나의 순수 함수로 합친 것이다. **컬링을 통과한 마커만 클러스터링 대상이 되는 기존 동작(Task 5의 `visibleMarkerProps` → `clustered` 순서)을 그대로 유지한다.**

- [ ] **Step 1: 실패하는 테스트 작성**

`apps/waylog-app/src/shared/components/Map/__tests__/useMapMarkerRegistry.utils.test.ts` 신규 생성:

```ts
import { describe, expect, it } from 'vitest'
import { computeMarkerVisibility } from '../useMapMarkerRegistry.utils'

const BOUNDS = { north: 38, south: 37, east: 127, west: 126 }

function toPixelStub(bounds: typeof BOUNDS) {
  const scale = 1000 / (bounds.east - bounds.west)
  return (coord: { lat: number; lng: number }) => ({
    x: (coord.lng - bounds.west) * scale,
    y: (bounds.north - coord.lat) * scale,
  })
}

describe('computeMarkerVisibility', () => {
  it('visibleBounds가 null이면 모든 마커를 보여준다(클러스터링도 비활성)', () => {
    const markers = [
      { id: 'a', lat: 37.5, lng: 126.5 },
      { id: 'b', lat: 40, lng: 130 }, // bounds 밖 좌표라도 포함
    ]

    const result = computeMarkerVisibility({
      markers,
      visibleBounds: null,
      clustering: true,
      clusterGridSize: 50,
      toPixel: toPixelStub,
      viewportWidth: 1000,
      paddingRatio: 0.2,
    })

    expect(result.visibleMarkerIds).toEqual(new Set(['a', 'b']))
    expect(result.clusters).toBeNull()
  })

  it('bounds 밖 마커는 컬링되어 visibleMarkerIds에서 빠진다', () => {
    const markers = [
      { id: 'inside', lat: 37.5, lng: 126.5 },
      { id: 'outside', lat: 40, lng: 130 },
    ]

    const result = computeMarkerVisibility({
      markers,
      visibleBounds: BOUNDS,
      clustering: false,
      clusterGridSize: 50,
      toPixel: toPixelStub,
      viewportWidth: 1000,
      paddingRatio: 0.2,
    })

    expect(result.visibleMarkerIds).toEqual(new Set(['inside']))
    expect(result.clusters).toBeNull()
  })

  it('clustering이 false면 clusters는 null이고 컬링만 적용된다', () => {
    const markers = [
      { id: 'a', lat: 37.5, lng: 126.5 },
      { id: 'b', lat: 37.5001, lng: 126.5001 },
    ]

    const result = computeMarkerVisibility({
      markers,
      visibleBounds: BOUNDS,
      clustering: false,
      clusterGridSize: 50,
      toPixel: toPixelStub,
      viewportWidth: 1000,
      paddingRatio: 0.2,
    })

    expect(result.clusters).toBeNull()
    expect(result.visibleMarkerIds).toEqual(new Set(['a', 'b']))
  })

  it('clustering이 true이고 마커가 2개 미만이면 clusters는 null이다', () => {
    const markers = [{ id: 'only', lat: 37.5, lng: 126.5 }]

    const result = computeMarkerVisibility({
      markers,
      visibleBounds: BOUNDS,
      clustering: true,
      clusterGridSize: 50,
      toPixel: toPixelStub,
      viewportWidth: 1000,
      paddingRatio: 0.2,
    })

    expect(result.clusters).toBeNull()
    expect(result.visibleMarkerIds).toEqual(new Set(['only']))
  })

  it('가까운 마커 2개는 clustering이 true일 때 하나의 클러스터로 묶인다', () => {
    const markers = [
      { id: 'a', lat: 37.5, lng: 126.5 },
      { id: 'b', lat: 37.5001, lng: 126.5001 },
    ]

    const result = computeMarkerVisibility({
      markers,
      visibleBounds: BOUNDS,
      clustering: true,
      clusterGridSize: 50,
      toPixel: toPixelStub,
      viewportWidth: 1000,
      paddingRatio: 0.2,
    })

    expect(result.clusters).not.toBeNull()
    expect(result.clusters).toHaveLength(1)
    expect(result.clusters![0]!.markers).toHaveLength(2)
  })

  it('id가 없는 마커는 좌표 기반 키로 클러스터링 결과에서 식별된다', () => {
    // RegisteredMapMarker.id는 항상 존재해야 하지만(레지스트리 등록 시 필수),
    // 이 함수 자체는 넘어온 id를 그대로 clusterMarkers에 전달하는지만 검증한다.
    const markers = [{ id: '37.5,126.5', lat: 37.5, lng: 126.5 }]

    const result = computeMarkerVisibility({
      markers,
      visibleBounds: BOUNDS,
      clustering: true,
      clusterGridSize: 50,
      toPixel: toPixelStub,
      viewportWidth: 1000,
      paddingRatio: 0.2,
    })

    expect(result.visibleMarkerIds.has('37.5,126.5')).toBe(true)
  })
})
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

Run: `cd apps/waylog-app && pnpm test -- useMapMarkerRegistry.utils`
Expected: FAIL with "Cannot find module '../useMapMarkerRegistry.utils'"

- [ ] **Step 3: 최소 구현 작성**

`apps/waylog-app/src/shared/components/Map/useMapMarkerRegistry.utils.ts` 신규 생성:

```ts
import {
  clusterMarkers,
  type Cluster,
  type MapBounds,
  type MarkerData,
  type ToPixel,
} from '@waylog/domains/modules/map'
import { isCoordinateInBounds } from './useMapViewportCulling'
import type { RegisteredMapMarker } from './useMapMarkerRegistry'

export interface MarkerVisibility {
  visibleMarkerIds: Set<string>
  clusters: Cluster[] | null
}

interface ComputeMarkerVisibilityParams {
  markers: RegisteredMapMarker[]
  visibleBounds: MapBounds | null
  clustering: boolean
  clusterGridSize: number
  toPixel: (bounds: MapBounds) => ToPixel
  viewportWidth: number
  paddingRatio: number
}

// 뷰포트 컬링 → 클러스터링 순서로 계산한다. 컬링을 먼저 적용해 MarkerView
// 동시 표시 상한(공식 권장 최대 ~100개)을 넘지 않게 한 뒤, 화면에 남은
// 마커만 클러스터링 대상으로 삼는다.
export function computeMarkerVisibility({
  markers,
  visibleBounds,
  clustering,
  clusterGridSize,
  toPixel,
  viewportWidth,
  paddingRatio,
}: ComputeMarkerVisibilityParams): MarkerVisibility {
  const visibleMarkers = filterByViewport(markers, visibleBounds, paddingRatio)

  if (!clustering || visibleBounds == null || visibleMarkers.length < 2) {
    return { visibleMarkerIds: new Set(visibleMarkers.map((marker) => marker.id)), clusters: null }
  }

  const data: MarkerData[] = visibleMarkers.map((marker) => ({
    id: marker.id,
    position: { lat: marker.lat, lng: marker.lng },
  }))

  const clusters = clusterMarkers(data, toPixel(visibleBounds), clusterGridSize)

  return { visibleMarkerIds: new Set(visibleMarkers.map((marker) => marker.id)), clusters }
}

function filterByViewport(
  markers: RegisteredMapMarker[],
  visibleBounds: MapBounds | null,
  paddingRatio: number,
): RegisteredMapMarker[] {
  if (visibleBounds == null) return markers // 최초 마운트 시(bounds 미확정)는 전체 표시

  const latPadding = (visibleBounds.north - visibleBounds.south) * paddingRatio
  const lngPadding = (visibleBounds.east - visibleBounds.west) * paddingRatio
  const padding = Math.max(latPadding, lngPadding)

  return markers.filter((marker) =>
    isCoordinateInBounds({ lat: marker.lat, lng: marker.lng }, visibleBounds, padding),
  )
}
```

**중요**: `toPixel: (bounds: MapBounds) => ToPixel`이라는 curried 형태 시그니처는, 기존 `NativeMap.tsx`의 `createToPixel(bounds, width)` 함수(2개 인자)와 다르다. Task 3에서 `NativeMap.tsx`가 이 함수를 호출할 때 `toPixel: (bounds) => createToPixel(bounds, width)` 형태로 클로저를 만들어 넘길 것이므로, 이 시그니처를 그대로 유지하라 — `viewportWidth` 파라미터는 이 함수 시그니처에 존재하지만 내부적으로는 `toPixel` 클로저 안에서 이미 캡처되어 있으므로 함수 본문에서 직접 쓰지 않는다(호출부 책임 분리를 위해 시그니처에는 유지, 이후 실제로 안 쓰인다면 타입 체크 시 미사용 경고가 안 뜨는지 확인 — 안 쓰는 파라미터라면 시그니처에서 제거하고 테스트도 함께 조정하라. 이 판단은 구현자가 실제 사용 여부를 보고 결정한다).

- [ ] **Step 4: 테스트 실행하여 통과 확인**

Run: `cd apps/waylog-app && pnpm test -- useMapMarkerRegistry.utils`
Expected: PASS (6 tests)

- [ ] **Step 5: 타입 체크**

Run: `pnpm --filter waylog-app exec tsc --noEmit -p . 2>&1 | tail -40`
Expected: 에러 없음.

- [ ] **Step 6: 커밋**

```bash
git add apps/waylog-app/src/shared/components/Map/useMapMarkerRegistry.utils.ts \
        apps/waylog-app/src/shared/components/Map/__tests__/useMapMarkerRegistry.utils.test.ts
git commit -m "feat(app): 마커 컬링·클러스터링 가시성 계산을 순수 함수로 분리"
```

---

### Task 3: MapContext에 가시성 정보 추가

**Files:**
- Modify: `apps/waylog-app/src/shared/components/Map/MapContext.ts`

**Interfaces:**
- Consumes: 없음
- Produces: `MapContextValue`에 `visibleMarkerIds: Set<string> | null` 필드 추가 (`null`이면 "전부 보임", 즉 컬링/클러스터링이 아직 계산 전이거나 비활성 상태). Task 4(`NativeMapMarker.tsx`)와 Task 5(`NativeMap.tsx`)가 이 필드를 각각 읽고/쓴다.

- [ ] **Step 1: MapContextValue에 필드 추가**

`apps/waylog-app/src/shared/components/Map/MapContext.ts`를 다음으로 교체:

```ts
import { createContext, useContext } from 'react'
import type { AutoFocus, Coordinate } from '@waylog/domains/modules/map'
import type Mapbox from '@rnmapbox/maps'

// 웹 shared/components/Map/MapContext.ts 와 동일한 설계다.
// 마커·경로가 부모에게 스캔당하는 대신, 마운트 시점에 스스로 자기 좌표를 등록한다.
export interface MapContextValue {
  extendBound: (value: Coordinate) => void
  config: { autoFocus: AutoFocus }
  map: Mapbox.MapView | null
  // 컬링·클러스터링 계산 결과. null이면 계산 전이거나 두 기능 모두 비활성 —
  // 이 경우 마커는 항상 자신을 렌더링한다(과거 basemap 동작과 동일).
  visibleMarkerIds: Set<string> | null
}

export const MapContext = createContext<MapContextValue | null>(null)

export function useMapContext(): MapContextValue {
  const context = useContext(MapContext)
  if (context == null) {
    throw new Error('MapContext is not available. Make sure this is rendered inside <Map>.')
  }
  return context
}
```

- [ ] **Step 2: 타입 체크로 컴파일 실패 확인 (아직 NativeMap.tsx가 이 필드를 안 채우므로 에러 나는 게 정상)**

Run: `pnpm --filter waylog-app exec tsc --noEmit -p . 2>&1 | grep -i "NativeMap.tsx"`
Expected: `mapContextValue`를 만드는 곳에서 `visibleMarkerIds` 필드 누락 관련 타입 에러가 나야 한다. 이건 Task 5에서 해소된다 — 지금 단계에서는 이 에러가 나는 게 정상이므로, 이 태스크는 여기서 커밋해도 된다(플랜의 다음 태스크가 즉시 이어서 해소하기 때문).

- [ ] **Step 3: 커밋**

```bash
git add apps/waylog-app/src/shared/components/Map/MapContext.ts
git commit -m "feat(app): MapContext에 마커 가시성 필드 추가"
```

---

### Task 4: NativeMapMarker가 레지스트리에 자가등록하고 가시성을 스스로 판단

**Files:**
- Modify: `apps/waylog-app/src/shared/components/Map/NativeMapMarker.tsx`
- Modify: `apps/waylog-app/src/shared/components/Map/NativeMapCluster.tsx`

**Interfaces:**
- Consumes: `useRegisterMapMarker`(Task 1), `useMapContext()`의 `visibleMarkerIds`(Task 3)
- Produces: `NativeMapMarker`의 외부 시그니처(`MarkerProps & { icon?: ReactNode }`)는 불변. 다만 이제 자기 `id`가 `visibleMarkerIds`에 없으면(컬링되었거나 클러스터에 묶여 숨겨져야 하면) `null`을 반환한다.

**배경**: 지금 `NativeMap.tsx`가 컬링/클러스터링 이후 `findMarker`로 "보여줄 마커"만 골라 렌더링하는데, 이 태스크 이후로는 **모든 `Map.Marker`가 항상 마운트되어 있고**(부모가 더 이상 선택적으로 렌더링하지 않음), 대신 각 마커가 스스로 "나는 지금 보여야 하는가"를 판단해서 안 보여야 하면 `null`을 반환한다.

`markerKey`(id 없으면 좌표 기반 fallback) 로직은 레지스트리 등록 시 `id`로 그대로 써야 한다 — `RegisteredMapMarker.id`는 항상 문자열이 필요하므로, `NativeMapMarker`가 자신의 `id` prop이 없으면 좌표로 fallback해서 레지스트리에 등록해야 한다(지금 `NativeMap.tsx`에 있는 `markerKey` 함수와 동일한 로직).

- [ ] **Step 1: NativeMapMarker.tsx 수정**

현재 파일(`apps/waylog-app/src/shared/components/Map/NativeMapMarker.tsx`)을 읽고, 다음 변경을 적용한다:

1. `id` prop을 구조 분해에 추가하고, `id ?? \`${lat},${lng}\`` 형태로 레지스트리 키를 계산하는 로컬 변수를 만든다(이름은 `registryId` 등 역할을 드러내는 이름으로).
2. `useRegisterMapMarker({ id: registryId, lat, lng })`를 호출한다(Task 1에서 만든 훅, `./useMapMarkerRegistry`에서 import).
3. `useMapContext()`에서 `visibleMarkerIds`를 추가로 구조 분해한다.
4. 컴포넌트 최상단(다른 훅 호출 이후, 조기 반환 위치)에 다음을 추가한다:

```ts
const isVisible = visibleMarkerIds == null || visibleMarkerIds.has(registryId)
if (!isVisible) return null
```

**중요 — React 훅 규칙 주의**: 이 조기 반환은 반드시 **이 컴포넌트의 모든 훅 호출(`useEffect`, `useState`, `usePreservedCallback`, `useRegisterMapMarker`, `useMapContext`) 이후**에 와야 한다. React는 컴포넌트가 렌더링될 때마다 정확히 같은 순서로 같은 훅을 호출해야 하므로, 훅 호출 앞에 조기 반환을 두면 안 된다(Rules of Hooks 위반). `useRegisterMapMarker`는 반드시 호출되어야 한다 — 그래야 숨겨진 마커도 레지스트리에는 남아있어서, 그 좌표가 다시 뷰포트에 들어오면(예: 줌아웃) 곧바로 재평가된다.

전체 구조는 다음과 같아야 한다(발췌, 전체 파일을 이 형태로 만들되 기존 `MarkerShape`/`toTooltipText`/`memo` 비교 함수는 그대로 유지):

```tsx
import { memo, useEffect, useState, type ReactNode } from 'react'
import { usePreservedCallback } from '@waylog/react'
import Mapbox from '@rnmapbox/maps'
import { resolveMarkerColor, type MarkerProps } from '@waylog/domains/modules/map'
import { Image, Pressable, View } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'
import { Typography } from '../mui'
import { useMapContext } from './MapContext'
import { useRegisterMapMarker } from './useMapMarkerRegistry'
import { NativeMapTooltip } from './NativeMapTooltip'

interface NativeMarkerProps extends MarkerProps {
  icon?: ReactNode
}

const MAX_LABEL_WIDTH = 120
const TOUCH_TARGET_SIZE = 44
const PIN_SIZE = { width: 17, height: 25 }
const CIRCLE_SIZE = 18
const THUMBNAIL_SIZE = 38

function NativeMapMarkerView({
  id,
  lat,
  lng,
  label,
  variant = 'pin',
  color,
  opacity = 1,
  outlined,
  thumbnailUrl,
  tooltip,
  icon,
  onClick,
  onContextMenu,
}: NativeMarkerProps) {
  const resolved = resolveMarkerColor(color, variant)
  const handleClick = usePreservedCallback(() => onClick?.({ lat, lng, label, variant }))
  const handleContextMenu = usePreservedCallback(() => onContextMenu?.({ lat, lng, label, variant }))

  // id가 없는 마커는 좌표로 식별한다. NativeMap.tsx의 컬링·클러스터링이
  // 이 동일한 키로 이 마커를 다시 찾아 visibleMarkerIds에 넣어준다.
  const registryId = id ?? `${lat},${lng}`

  const { config, extendBound, visibleMarkerIds } = useMapContext()
  useRegisterMapMarker({ id: registryId, lat, lng })

  useEffect(() => {
    if (config.autoFocus === 'marker') extendBound({ lat, lng })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [isTooltipVisible, setIsTooltipVisible] = useState(false)
  const tooltipText = toTooltipText(tooltip)

  // 컬링되었거나 클러스터에 묶여 숨겨져야 하는 마커는 스스로 렌더링을 멈춘다.
  // 레지스트리 등록(useRegisterMapMarker)은 이 분기보다 먼저 실행되어야 하므로
  // Rules of Hooks에 따라 반드시 모든 훅 호출 이후에 반환한다.
  const isVisible = visibleMarkerIds == null || visibleMarkerIds.has(registryId)
  if (!isVisible) return null

  return (
    // Mapbox.MarkerView는 id prop을 받지 않는다(누락이 아니라 타입에 없음).
    <Mapbox.MarkerView coordinate={[lng, lat]} anchor={{ x: 0.5, y: 1 }}>
      <Pressable
        onPress={() => {
          if (tooltipText != null) {
            setIsTooltipVisible((visible) => !visible)
            return
          }
          handleClick()
        }}
        onLongPress={handleContextMenu}
      >
        <View style={{ minWidth: 44, minHeight: 48, alignItems: 'center', justifyContent: 'flex-end' }}>
          {tooltipText != null && (
            <NativeMapTooltip
              visible={isTooltipVisible}
              text={tooltipText}
              onRequestClose={() => setIsTooltipVisible(false)}
            />
          )}

          {label != null && (
            <View
              style={{
                maxWidth: MAX_LABEL_WIDTH,
                backgroundColor: resolved,
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 10,
                marginBottom: 2,
              }}
            >
              <Typography
                numberOfLines={1}
                ellipsizeMode="tail"
                sx={{ color: '#fff', fontSize: 11, fontWeight: '900' }}
              >
                {label}
              </Typography>
            </View>
          )}

          <View style={{ minWidth: TOUCH_TARGET_SIZE, minHeight: TOUCH_TARGET_SIZE, alignItems: 'center', justifyContent: 'flex-end' }}>
            {icon ?? (
              <MarkerShape
                variant={variant}
                color={resolved}
                opacity={opacity}
                outlined={outlined}
                thumbnailUrl={thumbnailUrl}
              />
            )}
          </View>
        </View>
      </Pressable>
    </Mapbox.MarkerView>
  )
}

// MarkerShape, ShapeProps, toTooltipText 함수는 기존 파일에서 그대로 가져온다(수정 없음).
```

`memo`의 두 번째 인자(비교 함수)에는 `visibleMarkerIds` 비교를 추가하지 않는다 — `memo` 비교 함수는 **props**만 비교하는 것이고, `visibleMarkerIds`는 `useMapContext()`로 읽는 context 값이라 `memo`가 자동으로 처리한다(context 값이 바뀌면 이 컴포넌트가 구독 중이므로 memo와 무관하게 리렌더된다). 기존 `memo` 비교 함수는 그대로 둔다.

- [ ] **Step 2: NativeMapCluster.tsx도 동일한 패턴으로 확인 (수정이 필요한지 판단)**

`apps/waylog-app/src/shared/components/Map/NativeMapCluster.tsx`를 읽어라. 이 컴포넌트는 `NativeMap.tsx`가 `clusters` 배열을 순회하며 직접 렌더링하는 것이지, 레지스트리에 자가등록하는 마커가 아니다(클러스터 자체는 좌표 레지스트리에 등록될 필요가 없다 — 클러스터링 계산 결과일 뿐이다). **이 파일은 수정하지 않는다.** Step 2는 "수정이 필요 없음을 확인하는" 검증 스텝이다.

- [ ] **Step 3: 타입 체크**

Run: `pnpm --filter waylog-app exec tsc --noEmit -p . 2>&1 | tail -40`
Expected: `NativeMapMarker.tsx` 관련 에러 없음. `NativeMap.tsx`(아직 Task 5 전이므로 `mapContextValue`에 `visibleMarkerIds`가 없어 나는 에러)는 이 태스크 범위 밖이므로 무시.

- [ ] **Step 4: 커밋**

```bash
git add apps/waylog-app/src/shared/components/Map/NativeMapMarker.tsx
git commit -m "feat(app): 마커가 레지스트리 등록과 자기 가시성 판단을 스스로 수행"
```

---

### Task 5: NativeMap이 정적 스캔 대신 레지스트리를 소비하도록 교체

**Files:**
- Modify: `apps/waylog-app/src/shared/components/Map/NativeMap.tsx`

**Interfaces:**
- Consumes: `MapMarkerRegistryProvider`/`useRegisteredMapMarkers`(Task 1), `computeMarkerVisibility`(Task 2), `MapContextValue.visibleMarkerIds`(Task 3)
- Produces: `NativeMap`의 외부 시그니처(`MapProps & { sx?: Sx }`)는 불변. 내부적으로 `splitMarkers`/`findMarker`/`Children` import가 완전히 제거된다.

**배경**: 이 태스크가 끝나면 `NativeMap`은 더 이상 `children`의 트리 구조를 알 필요가 없다. `children`을 그대로 렌더링(`{children}`처럼, 다만 함수형이면 호출)하고, 화면에 뭘 보여줄지는 각 마커가 레지스트리 기반으로 스스로 결정한다. `NativeMap`은 오직 (1) 레지스트리 스냅샷을 읽어 컬링·클러스터링을 계산하고 (2) 그 결과를 `MapContext`로 흘려보내고 (3) 클러스터 UI(`NativeMapCluster`)만 직접 그리는 역할만 한다.

- [ ] **Step 1: NativeMap.tsx 전체 교체**

현재 파일(`apps/waylog-app/src/shared/components/Map/NativeMap.tsx`, Task 0 완료 후 상태)을 읽고, 다음 구조로 교체한다:

```tsx
import {
  pastelMapboxStyle,
  type MapBounds,
  type MapProps,
  type MapRef,
} from '@waylog/domains/modules/map'
import { useImperativeHandle, useMemo, useRef, useState, type ReactNode } from 'react'
import { StyleSheet, useWindowDimensions } from 'react-native'
import Mapbox, { type MapState } from '@rnmapbox/maps'
import { MapContext } from './MapContext'
import { NativeMapCluster } from './NativeMapCluster'
import { useBatchedCallback } from '../../hooks/useBatchedCallback'
import { DEFAULT_DELTA, deltaToZoom, levelToDelta } from './NativeMap.utils'
import { MapMarkerRegistryProvider, useRegisteredMapMarkers } from './useMapMarkerRegistry'
import { computeMarkerVisibility } from './useMapMarkerRegistry.utils'
import { sxToStyle, type Sx } from '../mui'

// 화면 경계 바로 밖도 살짝 포함해 패닝 시 마커가 뚝 끊겨 나타나지 않게 한다.
const VIEWPORT_PADDING_RATIO = 0.2

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '')

function visibleBoundsToMapBounds(bounds: MapState['properties']['bounds']): MapBounds {
  const [eastLng, northLat] = bounds.ne
  const [westLng, southLat] = bounds.sw
  return { north: northLat, south: southLat, east: eastLng, west: westLng }
}

export function NativeMap({
  autoFocus = 'marker',
  defaultCenter,
  center,
  children,
  ref,
  clustering,
  clusterGridSize = 50,
  onBoundsChange,
  sx,
}: MapProps & { sx?: Sx }) {
  return (
    <MapMarkerRegistryProvider>
      <NativeMapInner
        autoFocus={autoFocus}
        defaultCenter={defaultCenter}
        center={center}
        ref={ref}
        clustering={clustering}
        clusterGridSize={clusterGridSize}
        onBoundsChange={onBoundsChange}
        sx={sx}
      >
        {children}
      </NativeMapInner>
    </MapMarkerRegistryProvider>
  )
}

function NativeMapInner({
  autoFocus = 'marker',
  defaultCenter,
  center,
  children,
  ref,
  clustering,
  clusterGridSize = 50,
  onBoundsChange,
  sx,
}: MapProps & { sx?: Sx }) {
  const cameraRef = useRef<Mapbox.Camera>(null)
  const [zoom, setZoom] = useState(() => deltaToZoom(DEFAULT_DELTA))
  const [visibleBounds, setVisibleBounds] = useState<MapBounds | null>(null)
  const [mapInstance, setMapInstance] = useState<Mapbox.MapView | null>(null)
  const { width } = useWindowDimensions()

  useImperativeHandle<MapRef, MapRef>(
    ref as never,
    () => ({
      panTo: (lat, lng, level) => {
        const delta = level == null ? DEFAULT_DELTA : levelToDelta(level)
        cameraRef.current?.setCamera({
          centerCoordinate: [lng, lat],
          zoomLevel: deltaToZoom(delta),
          animationDuration: 300,
        })
      },
      relayout: () => { },
      focus: () => { },
    }),
    [],
  )

  const scheduleBoundsUpdate = useBatchedCallback<MapBounds>((updates) => {
    const bounds = updates.at(-1)
    if (bounds == null) return

    setVisibleBounds(bounds)
    onBoundsChange?.(bounds)
  })

  const initial = center ?? defaultCenter
  const rendered = typeof children === 'function' ? children({ zoom }) : children

  const { version: registryVersion, markers } = useRegisteredMapMarkers()

  const boundsRef = useRef<{ lat: number; lng: number }[]>([])
  const extendBound = useBatchedCallback<{ lat: number; lng: number }>((coords) => {
    boundsRef.current.push(...coords)
    if (boundsRef.current.length === 0) return

    const lats = boundsRef.current.map((coord) => coord.lat)
    const lngs = boundsRef.current.map((coord) => coord.lng)
    cameraRef.current?.fitBounds(
      [Math.max(...lngs), Math.max(...lats)],
      [Math.min(...lngs), Math.min(...lats)],
      60,
      600,
    )
  }, { once: true })

  const { visibleMarkerIds, clusters } = useMemo(
    () =>
      computeMarkerVisibility({
        markers,
        visibleBounds,
        clustering: clustering === true,
        clusterGridSize,
        toPixel: (bounds) => createToPixel(bounds, width),
        viewportWidth: width,
        paddingRatio: VIEWPORT_PADDING_RATIO,
      }),
    // markers 는 레지스트리 스냅샷 배열이라 매 렌더 새 참조다. 실제 변경 여부는
    // registryVersion(레지스트리 자체가 바뀔 때만 증가)으로 판단한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [registryVersion, visibleBounds, clustering, clusterGridSize, width],
  )

  const mapContextValue = useMemo(
    () => ({ extendBound, config: { autoFocus }, map: mapInstance, visibleMarkerIds: clustering === true || visibleBounds != null ? visibleMarkerIds : null }),
    [extendBound, autoFocus, mapInstance, visibleMarkerIds, clustering, visibleBounds],
  )

  return (
    <MapContext value={mapContextValue}>
      <Mapbox.MapView
        ref={setMapInstance}
        style={[StyleSheet.absoluteFill, sxToStyle(sx)]}
        styleJSON={JSON.stringify(pastelMapboxStyle)}
        onCameraChanged={(state) => {
          const nextZoom = Math.round(state.properties.zoom)
          setZoom((current) => (nextZoom === current ? current : nextZoom))

          const bounds = visibleBoundsToMapBounds(state.properties.bounds)
          scheduleBoundsUpdate(bounds)
        }}
      >
        <Mapbox.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: initial ? [initial.lng, initial.lat] : undefined,
            zoomLevel: deltaToZoom(DEFAULT_DELTA),
          }}
        />
        {rendered as ReactNode}
        {clusters?.map((cluster) =>
          cluster.markers.length > 1 ? (
            <NativeMapCluster
              key={cluster.id}
              latitude={cluster.center.lat}
              longitude={cluster.center.lng}
              count={cluster.markers.length}
              onTap={() => {
                const lats = cluster.markers.map((marker) => marker.position.lat)
                const lngs = cluster.markers.map((marker) => marker.position.lng)
                cameraRef.current?.fitBounds(
                  [Math.max(...lngs), Math.max(...lats)],
                  [Math.min(...lngs), Math.min(...lats)],
                  80,
                  600,
                )
              }}
            />
          ) : null,
        )}
      </Mapbox.MapView>
    </MapContext>
  )
}

// 좌표를 화면 픽셀로 옮긴다. 클러스터링이 픽셀 거리 기준이라 필요하다.
function createToPixel(bounds: MapBounds, width: number) {
  const scale = width / (bounds.east - bounds.west)

  return (coord: { lat: number; lng: number }) => ({
    x: (coord.lng - bounds.west) * scale,
    y: (bounds.north - coord.lat) * scale,
  })
}
```

**중요 — 이 코드는 예시이며 검증 후 필요하면 수정할 것. 반드시 확인해야 할 것들:**

1. **`rendered`를 그대로 렌더링하는 것의 의미**: 이제 `NativeMap`은 `children`(마커 포함)을 있는 그대로 JSX 트리에 넣는다. 마커 컴포넌트 자신(Task 4)이 `visibleMarkerIds`를 보고 `null`을 반환할지 결정하므로, `NativeMap`은 "누구를 뺄지" 고민할 필요가 없다. 이게 정확히 이 리팩터링의 핵심이다 — 이 부분이 예시 코드와 다르게 구현되어 있다면(예: 여전히 `children`을 스캔하는 코드가 남아있다면) 브리프의 의도를 벗어난 것이니 반드시 이 방식으로 고쳐라.
2. **`mapContextValue.visibleMarkerIds`의 삼항식**: 예시 코드의 `clustering === true || visibleBounds != null ? visibleMarkerIds : null` 부분은 "클러스터링이 꺼져있고 아직 bounds도 모르는 최초 마운트 순간에는 컬링도 적용하지 말고 전부 보여준다"는 기존 동작(Task 5 이전 `visibleMarkerProps`의 `if (visibleBounds == null) return markerProps` 분기)을 재현하려는 의도다. 하지만 `computeMarkerVisibility`(Task 2) 자체가 이미 `visibleBounds == null`일 때 전체 마커의 id를 반환하도록 구현되어 있으므로(Task 2 Step 3 `filterByViewport` 참고), 이 삼항식이 실제로 필요한지 다시 검토하라 — 필요 없다면(즉 `computeMarkerVisibility`의 반환값을 그냥 그대로 `visibleMarkerIds`에 써도 동일한 결과라면) 단순하게 `visibleMarkerIds` 그대로 쓰고 이 삼항식은 제거하라(YAGNI). 이 판단을 보고서에 근거와 함께 남겨라.
3. **`NativeMapInner`로 컴포넌트를 분리한 이유**: `MapMarkerRegistryProvider`가 제공하는 Context를 `useRegisteredMapMarkers()`로 읽으려면, 그 훅을 호출하는 컴포넌트가 `MapMarkerRegistryProvider`의 자손이어야 한다. `NativeMap`이 스스로 `Provider`와 그 소비자를 한 컴포넌트에서 겸할 수 없으므로(Provider는 자기 자신을 감쌀 수 없다) 내부 컴포넌트로 분리했다. 이 분리 자체는 유지하되, 두 컴포넌트에 걸쳐 prop을 그대로 다시 전달하는 부분(`NativeMap`이 받은 props를 전부 `NativeMapInner`에 그대로 넘기는 부분)이 장황해 보이면, `{...props}` 형태로 줄일 수 있는지 검토하라 — 다만 `ref`는 `useImperativeHandle`이 있는 `NativeMapInner`가 직접 받아야 하므로 특별 취급이 필요하다.
4. `useRegisteredMapMarkers()`가 반환하는 `version`을 `registryVersion`으로 받아 `useMemo` 의존성에 쓰는 이유: `markers` 배열 자체는 Task 1의 `useMemo(() => Array.from(...), [version])`에 의해 `version`이 바뀔 때만 새로 만들어지므로, 사실 `markers`를 직접 의존성 배열에 넣어도 참조 안정성이 보장된다. 그럼에도 `registryVersion`을 쓰는 이유가 타당한지, 아니면 `markers`를 직접 의존성에 넣는 게 더 명확한지 판단해서 실제 구현에 반영하라(둘 다 동작은 같지만 코드 명확성 문제다 — YAGNI 관점에서 더 간단한 쪽을 택하라).
5. 타입 단언을 새로 추가하지 마라. `useImperativeHandle<MapRef, MapRef>(ref as never, ...)`는 기존에 있던 것이므로 그대로 둔다.

- [ ] **Step 2: 타입 체크**

Run: `pnpm --filter waylog-app exec tsc --noEmit -p . 2>&1 | tail -60`
Expected: `NativeMap.tsx` 관련 에러 없음. `splitMarkers`/`findMarker`/`markerKey`/`Children`/`isValidElement` import가 전부 사라졌는지 `grep -n "Children\|isValidElement\|splitMarkers\|findMarker" apps/waylog-app/src/shared/components/Map/NativeMap.tsx`로 확인하라 — 남아있으면 안 된다.

- [ ] **Step 3: 전체 테스트 스위트 실행 (회귀 확인)**

Run: `cd apps/waylog-app && pnpm test`
Expected: 기존 테스트(NativeMap.utils, useMapViewportCulling, useMapMarkerRegistry.utils 등) 모두 통과.

- [ ] **Step 4: 커밋**

```bash
git add apps/waylog-app/src/shared/components/Map/NativeMap.tsx
git commit -m "refactor(app): NativeMap이 자식 트리 스캔 대신 마커 레지스트리를 소비하도록 교체"
```

---

### Task 6: 실기기 검증

**Files:**
- 없음 (수동 검증)

**Interfaces:**
- Consumes: Task 0~5의 모든 산출물
- Produces: 없음 (검증)

- [ ] **Step 1: Metro 재시작 후 앱 리로드**

Metro 번들러가 실행 중이면 앱을 리로드한다(순수 JS 변경이라 네이티브 재빌드 불필요). Run: 앱 화면에서 개발 메뉴 → Reload, 또는 시뮬레이터 Cmd+R.

- [ ] **Step 2: 장소탭(TripPlaceContent, children이 함수형인 화면) 확인**

트립 상세 → 장소탭으로 이동. 이 플랜이 고치려던 정확한 버그를 확인한다:
- 진입 시 등록된 장소 마커가 전부(줌인 없이) 화면에 나타나는지.
- 클러스터링 토글을 켰을 때 가까운 마커들이 클러스터로 묶이는지.
- 클러스터를 탭하면 확대되며 클러스터가 개별 마커로 풀리는지, 이때 마커가 정상적으로 나타나는지(이전에 겪은 "id 없는 마커가 인덱스 불일치로 안 뜨던 문제"가 재발하지 않는지).

Expected: 모두 정상.

- [ ] **Step 3: 계획탭(TripRoutesContent, children이 배열인 화면) 회귀 확인**

트립 상세 → 계획탭으로 이동. 이전 세션에서 이미 정상 확인된 기능들이 이번 리팩터링 이후에도 유지되는지 확인:
- 마커, 클러스터링, 클러스터 탭 시 줌인, 클러스터 풀렸을 때 개별 마커 노출.

Expected: 모두 정상(회귀 없음).

- [ ] **Step 4: 다른 지도 사용 화면 확인**

`ExplorerMap.tsx`(explorer, `clustering` prop 켜짐), `ProfileRecordsTab.tsx`(clustering 켜짐), `PlaceDetailScreen.tsx`(단일 마커, clustering 없음) 각각 진입해 마커가 정상적으로 뜨는지 확인.

Expected: 모두 정상.

- [ ] **Step 5: docs/codebase.md 갱신 여부 확인**

Run: `grep -n "splitMarkers\|Children.toArray\|정적 스캔" docs/codebase.md`
결과가 있으면 그 서술을 이번 변경(레지스트리 기반 자가등록)에 맞게 갱신한다. 없으면 이 스텝은 생략한다.

- [ ] **Step 6: 최종 커밋 (docs 갱신이 있었다면)**

```bash
git add docs/codebase.md
git commit -m "docs: 마커 레지스트리 전환 반영"
```

---

## Self-Review 결과

**Spec coverage:**
- Fragment 문제 근본 해결(children 스캔 제거) → Task 5 ✓
- 웹과 동일한 자가등록 패턴 이식, RN 제약(마커 JSX 유지)에 맞게 변형 → Task 1(레지스트리), Task 4(마커 자가등록+자가판단) ✓
- 기존 동작 회귀 없음(컬링→클러스터링 순서, `autoFocus`, 클러스터 탭 확대) → Task 2가 기존 로직을 그대로 함수로 옮김, Task 5가 `extendBound`/클러스터 탭 로직 그대로 보존 ✓
- 디버그 로그 정리 → Task 0 ✓
- 공개 인터페이스(`MapProps`/`MarkerProps` 등) 불변 → 전 태스크에서 시그니처 유지 명시 ✓

**Placeholder scan:** Task 5 Step 1의 "중요" 섹션에 구현자가 판단해야 할 지점(삼항식 필요 여부, `registryVersion` vs `markers` 직접 사용)이 있음 — 이는 플레이스홀더가 아니라, 실제 구현하면서 나오는 코드 대비 예시 코드의 사소한 불확실성(플랜 작성 시점엔 실행해볼 수 없는 부분)을 명시적으로 위임한 것이며, 구현자가 "왜 그렇게 판단했는지"를 보고서에 남기도록 지시했으므로 무근거 위임이 아니다.

**Type consistency:** `RegisteredMapMarker`(Task 1) → `computeMarkerVisibility`의 `markers` 파라미터 타입(Task 2) → `NativeMap.tsx`의 `useRegisteredMapMarkers()` 반환 타입(Task 5) 모두 동일한 `RegisteredMapMarker[]`로 일관됨. `MarkerVisibility.visibleMarkerIds: Set<string>`(Task 2) → `MapContextValue.visibleMarkerIds: Set<string> | null`(Task 3) → `NativeMapMarker`의 판단 로직(Task 4)까지 타입이 일관되게 이어짐. `registryId`(Task 4에서 `id ?? "lat,lng"`)와 레지스트리 등록 키가 정확히 일치함을 확인.
