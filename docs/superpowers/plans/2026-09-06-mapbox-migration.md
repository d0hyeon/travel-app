# 앱 지도 구현체 Mapbox 전환 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `waylog-app`의 지도 구현체를 `react-native-maps`에서 `@rnmapbox/maps`로 교체하여, New Architecture(Fabric) legacy interop 레이어에서 발생하는 `insertReactSubview:atIndex:` 네이티브 크래시(계획탭 진입 시 무로그 크래시)를 근본적으로 해소하고, 웹(`waylog-web/src/shared/components/Map`)과 동일한 `MapProps`/`MarkerProps`/`PathProps`/`PolygonLayerProps` 인터페이스 계약을 앱에도 제공한다.

**Architecture:** 앱이 이미 갖고 있는 `Map`/`Map.Marker`/`Map.Path`/`MapContext` 추상화는 그대로 유지하고, 내부 구현(`NativeMap.tsx`, `NativeMapMarker.tsx`, `NativeMapPath.tsx`, `NativeMapCluster.tsx`)만 `@rnmapbox/maps`의 `MapView`/`Camera`/`MarkerView`/`ShapeSource`+`LineLayer`로 교체한다. 소비자 코드(`TripRoutesContent.tsx` 등 15개 파일)는 한 줄도 바뀌지 않는다. 마커는 `MarkerView`(실제 네이티브 뷰, 스냅샷 캐싱 없음)로 구현해 prop 변경이 즉시 반영되며, 지금까지 있었던 `tracksViewChanges`/`key` 리마운트 트릭이 전부 제거된다. 폴리곤(지역구 색칠)은 웹에는 있고 앱에는 없던 기능이라 이번에 함께 이식하며, `packages/domains/src/modules/map`에 웹 로컬에만 있던 `PolygonLayerProps`/`MapPolygonProps`/`MapRegionProps` 타입을 승격해 앱·웹이 공유한다.

**Tech Stack:** Expo SDK 54, React Native (New Architecture/Fabric), `@rnmapbox/maps` (Fabric 코드젠 기반, New Architecture 필수), TypeScript, Vitest.

**Spec:** 본 대화 세션의 요구사항 확정 내역 — (1) 마커 형태: 원형/핀, (2) 라벨, (3) 탭 시 툴팁, (4) 마커 내 이미지(썸네일), (5) 지역구/국가 폴리곤 색칠(웹 `Map.PolygonLayer`/`Map.Region`/`Map.Polygon`과 동일 계약). 별도 스펙 문서 없음 — 이 헤더가 스펙을 겸한다.

## Global Constraints

- `MapProps`/`MarkerProps`/`PathProps`/`MapRef` 시그니처는 절대 변경하지 않는다 — 15개 소비자 파일이 이 계약에 의존한다.
- `MarkerProps.icon?: ReactNode`는 앱 전용 확장 필드로 그대로 유지한다(웹에는 없음, `NativeMapMarker.tsx:13-17` 주석 근거).
- 마커 동시 표시 상한(`@rnmapbox/maps` 공식 권장 최대 ~100개)에 대응하기 위해, 화면 밖 마커는 렌더링하지 않는 뷰포트 컬링을 반드시 포함한다.
- `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`은 이미 `apps/waylog-app/.env`에 추가되어 있다 (public `pk.` 토큰). 별도 `RNMapboxMapsDownloadToken`(secret `sk.` 토큰)은 최신 `@rnmapbox/maps`에서 deprecated이므로 추가하지 않는다.
- `app.config.ts`의 `plugins` 배열에서 `"./plugins/withPersonalTeamSigning"`은 반드시 마지막 위치를 유지한다(entitlements 정리가 다른 플러그인 이후에 실행되어야 함).
- `react-native-maps`, `NativeMapCluster.tsx`의 `Marker`(react-native-maps import)는 최종 태스크에서 완전히 제거한다 — 중간 태스크까지는 병행 존재를 허용하지 않는다(같은 지도 인스턴스에 두 SDK를 동시에 못 그림).
- 클러스터링 로직(`packages/domains/src/modules/map/cluster.core.ts`의 `clusterMarkers`)은 지도 SDK 비의존 순수 함수이므로 수정하지 않고 그대로 재사용한다.
- 폴리곤 좌표 계산 로직(`polygon-layer.utils.ts`, `boundary.geometry.ts`, `boundary.data.ts`)도 지도 SDK 비의존이므로 그대로 재사용한다 — 웹 로컬에서 공유 패키지로 옮기기만 한다(로직 변경 없음).
- 빌드 검증은 `pnpm --filter waylog-app exec tsc --noEmit -p .` 로 타입 체크, 순수 로직은 Vitest 단위 테스트로 검증한다. `*.tsx` 컴포넌트는 이 코드베이스 규칙상 컴포넌트 테스트 인프라가 없으므로 빌드 통과 + 실제 앱 확인(Xcode Run)으로 검증한다.
- 커밋은 각 태스크 완료 시점에 한글 커밋 메시지로 분리한다 (변경 목적 단위 분리 원칙, CLAUDE.md 준수).

---

## File Structure

```
apps/waylog-app/
├── app.config.ts                                    [수정] @rnmapbox/maps plugin 등록
├── package.json                                      [수정] react-native-maps 제거, @rnmapbox/maps 추가
├── .env                                               [기존] EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN 이미 존재
└── src/shared/components/Map/
    ├── index.tsx                                      [수정] Map.PolygonLayer/Polygon/Region 재노출 추가
    ├── MapContext.ts                                  [수정] map 인스턴스 필드 추가 (폴리곤 레이어가 필요)
    ├── NativeMap.tsx                                   [교체] MapView(react-native-maps) → Mapbox.MapView + Camera
    ├── NativeMapMarker.tsx                             [교체] Marker → Mapbox.MarkerView, 스냅샷 트릭 제거
    ├── NativeMapPath.tsx                               [교체] Polyline → Mapbox.ShapeSource + LineLayer
    ├── NativeMapCluster.tsx                            [교체] Marker → Mapbox.MarkerView
    ├── useMapViewportCulling.ts                        [신규] 화면 밖 마커 컬링 훅 (뷰포트 컬링 요구사항)
    ├── PolygonLayer.tsx                                 [신규] 웹 PolygonLayer/Polygon/Region 앱 이식
    └── NativeMapTooltip.tsx                             [신규] MarkerView 탭 시 툴팁 오버레이 (네이티브 Callout 대체)

packages/domains/src/modules/map/
├── types.ts                                            [수정] PolygonStyleProps/MapPolygonProps/MapRegionProps 승격
└── index.ts                                            [수정] 위 타입 재노출

apps/waylog-web/src/shared/components/Map/
└── polygon-layer.types.ts                              [수정] 공유 패키지 타입 re-export로 축소 (중복 제거)
```

**책임 분리 근거:**
- `NativeMapTooltip.tsx`를 별도 파일로 뺀 이유: `MarkerView`는 네이티브 `Callout`이 없어 툴팁을 JS로 직접 그려야 한다. 이 로직은 `NativeMapMarker.tsx`의 마커 형태 렌더링과 책임이 다르고(탭 상태 관리 + 오버레이 포지셔닝), 재사용 가능성도 있어 분리한다.
- `useMapViewportCulling.ts`를 별도 훅으로 뺀 이유: 뷰포트 컬링은 마커 전용 로직이 아니라 `NativeMap.tsx`(bounds 계산)와 마커 소비 양쪽에 걸치는 관심사라, 훅으로 분리해 `NativeMap.tsx` 내부에서 조합한다.
- `PolygonLayer.tsx`를 새 파일로 만든 이유: 웹의 `PolygonLayer.tsx`/`GooglePolygonLayer.tsx` 2단 구조(스타일 컨텍스트 + 실제 렌더링)와 동일한 관심사 분리를 앱에도 유지한다.

---

### Task 1: 패키지 교체 및 Expo 설정

**Files:**
- Modify: `apps/waylog-app/package.json`
- Modify: `apps/waylog-app/app.config.ts`
- Test: 없음 (설정 변경, 빌드로 검증)

**Interfaces:**
- Consumes: 없음 (최초 태스크)
- Produces: `@rnmapbox/maps` 패키지가 설치되고 `expo prebuild` 시 iOS/Android 네이티브 프로젝트에 반영됨. 이후 태스크는 `import Mapbox from '@rnmapbox/maps'`를 사용할 수 있다.

- [ ] **Step 1: react-native-maps 제거, @rnmapbox/maps 설치**

```bash
cd apps/waylog-app
pnpm remove react-native-maps
pnpm add @rnmapbox/maps
```

- [ ] **Step 2: app.config.ts에 Mapbox plugin 등록**

`apps/waylog-app/app.config.ts`의 `plugins` 배열을 다음과 같이 수정한다 (기존 `withPersonalTeamSigning`은 반드시 마지막 유지):

```ts
plugins: [
  "expo-router",
  [
    "@rnmapbox/maps",
    {
      // v10+ 는 RNMapboxMapsDownloadToken 불필요. 런타임 access token은
      // Mapbox.setAccessToken() 호출로 별도 주입한다 (Task 2).
    },
  ],
  // expo-notifications 가 autolinking 으로 주입하는 aps-environment 를 걷어낸다.
  // 반드시 마지막에 둔다 — 앞선 플러그인이 넣은 뒤에 지워야 한다.
  "./plugins/withPersonalTeamSigning",
],
```

기존 `ios.config.googleMapsApiKey`, `android.config.googleMaps` 항목은 이번 태스크에서 삭제하지 않는다 (Task 6에서 react-native-maps 완전 제거 시점에 함께 정리).

- [ ] **Step 3: prebuild로 네이티브 프로젝트 재생성 확인**

Run: `cd apps/waylog-app && pnpm prebuild:ios`
Expected: 에러 없이 종료, `ios/Podfile`에 `RNMapboxMaps` 관련 pod가 추가됨 (`grep -i mapbox ios/Podfile`로 확인).

- [ ] **Step 4: 커밋**

```bash
git add apps/waylog-app/package.json apps/waylog-app/app.config.ts pnpm-lock.yaml
git commit -m "chore(app): react-native-maps를 @rnmapbox/maps로 교체"
```

---

### Task 2: MapContext 확장 및 NativeMap(지도 컨테이너) 교체

**Files:**
- Modify: `apps/waylog-app/src/shared/components/Map/MapContext.ts`
- Modify: `apps/waylog-app/src/shared/components/Map/NativeMap.tsx`
- Test: `apps/waylog-app/src/shared/components/Map/__tests__/NativeMap.utils.test.ts` (신규 — region↔zoom 변환 순수 함수만)

**Interfaces:**
- Consumes: `@rnmapbox/maps`의 `Mapbox.MapView`, `Mapbox.Camera` (Task 1에서 설치됨)
- Produces:
  - `MapContextValue { extendBound: (c: Coordinate) => void; config: { autoFocus: AutoFocus }; map: Mapbox.MapView | null }` — `map` 필드가 새로 추가됨. Task 5(PolygonLayer)가 이 `map` 필드를 소비한다.
  - `NativeMap`은 기존 `MapProps & { sx?: Sx }`를 그대로 받고 `MapRef { panTo, relayout, focus }`를 그대로 구현한다.

- [ ] **Step 1: MapContext에 map 필드 추가**

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

- [ ] **Step 2: region↔zoom 변환 순수 함수를 별도 파일로 분리하고 실패하는 테스트 작성**

`apps/waylog-app/src/shared/components/Map/NativeMap.utils.ts` 신규 생성:

```ts
export const DEFAULT_DELTA = 0.02

export function levelToDelta(level: number): number {
  return DEFAULT_DELTA * 2 ** (level - 3)
}

export function deltaToZoom(delta: number): number {
  return Math.round(Math.log2(360 / delta))
}
```

`apps/waylog-app/src/shared/components/Map/__tests__/NativeMap.utils.test.ts` 신규 생성:

```ts
import { describe, expect, it } from 'vitest'
import { DEFAULT_DELTA, deltaToZoom, levelToDelta } from '../NativeMap.utils'

describe('levelToDelta', () => {
  it('레벨 3에서 기본 delta를 반환한다', () => {
    expect(levelToDelta(3)).toBe(DEFAULT_DELTA)
  })

  it('레벨이 1 증가할 때마다 delta가 2배가 된다', () => {
    expect(levelToDelta(4)).toBeCloseTo(DEFAULT_DELTA * 2)
  })
})

describe('deltaToZoom', () => {
  it('delta 360일 때 줌 레벨 0을 반환한다', () => {
    expect(deltaToZoom(360)).toBe(0)
  })

  it('delta가 절반이 되면 줌 레벨이 1 증가한다', () => {
    expect(deltaToZoom(180)).toBe(1)
  })
})
```

- [ ] **Step 3: 테스트 실행하여 통과 확인 (이미 구현이 있으므로 즉시 통과해야 함)**

Run: `cd apps/waylog-app && pnpm test -- NativeMap.utils`
Expected: PASS (4 tests)

- [ ] **Step 4: NativeMap.tsx를 Mapbox 기반으로 교체**

`apps/waylog-app/src/shared/components/Map/NativeMap.tsx`를 다음으로 교체:

```tsx
import {
  clusterMarkers,
  pastelMapStyle,
  type MapBounds,
  type MapProps,
  type MapRef,
  type MarkerData,
  type ToPixel,
} from '@waylog/domains/modules/map'
import {
  Children,
  isValidElement,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { StyleSheet, useWindowDimensions } from 'react-native'
import Mapbox from '@rnmapbox/maps'
import { MapContext } from './MapContext'
import { NativeMapCluster } from './NativeMapCluster'
import { NativeMapMarker } from './NativeMapMarker'
import { useBatchedCallback } from '../../hooks/useBatchedCallback'
import { DEFAULT_DELTA, deltaToZoom, levelToDelta } from './NativeMap.utils'
import { Sx } from '../mui'

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '')

function regionToBounds(bounds: [number, number, number, number]): MapBounds {
  const [west, south, east, north] = bounds
  return { north, south, east, west }
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
  const mapRef = useRef<Mapbox.MapView>(null)
  const cameraRef = useRef<Mapbox.Camera>(null)
  const [zoom, setZoom] = useState(() => deltaToZoom(DEFAULT_DELTA))
  const [visibleBounds, setVisibleBounds] = useState<MapBounds | null>(null)
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
      relayout: () => {},
      focus: () => {},
    }),
    [],
  )

  const initial = center ?? defaultCenter
  const rendered = typeof children === 'function' ? children({ zoom }) : children

  const { markerProps, others } = splitMarkers(rendered)

  const markerIdentity = markerProps
    .map((marker, index) => `${marker.id ?? index}:${marker.lat},${marker.lng}`)
    .join('|')

  const boundsRef = useRef<{ lat: number; lng: number }[]>([])
  const extendBound = useBatchedCallback<{ lat: number; lng: number }>((coords) => {
    boundsRef.current.push(...coords)
    if (boundsRef.current.length === 0) return

    const lats = boundsRef.current.map((c) => c.lat)
    const lngs = boundsRef.current.map((c) => c.lng)
    cameraRef.current?.fitBounds(
      [Math.max(...lngs), Math.max(...lats)],
      [Math.min(...lngs), Math.min(...lats)],
      60,
      600,
    )
  }, { once: true })

  const [mapInstance, setMapInstance] = useState<Mapbox.MapView | null>(null)
  const mapContextValue = useMemo(
    () => ({ extendBound, config: { autoFocus }, map: mapInstance }),
    [extendBound, autoFocus, mapInstance],
  )

  const clustered = useMemo(() => {
    if (clustering !== true || visibleBounds == null || markerProps.length < 2) return null

    const data: MarkerData[] = markerProps.map((marker, index) => ({
      id: marker.id ?? String(index),
      position: { lat: marker.lat, lng: marker.lng },
    }))

    return clusterMarkers(data, createToPixel(visibleBounds, width), clusterGridSize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clustering, visibleBounds, markerIdentity, clusterGridSize, width])

  return (
    <MapContext value={mapContextValue}>
      <Mapbox.MapView
        ref={(instance) => {
          mapRef.current = instance
          setMapInstance(instance)
        }}
        style={[StyleSheet.absoluteFill, sx] as never}
        styleJSON={pastelMapStyle as never}
        onCameraChanged={(state) => {
          const nextZoom = Math.round(state.properties.zoom)
          setZoom((current) => (nextZoom === current ? current : nextZoom))
        }}
        onMapIdle={(state) => {
          const bounds = regionToBounds(state.properties.bounds.ne.concat(state.properties.bounds.sw) as never)
          setVisibleBounds(bounds)
          onBoundsChange?.(bounds)
        }}
      >
        <Mapbox.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: initial ? [initial.lng, initial.lat] : undefined,
            zoomLevel: deltaToZoom(DEFAULT_DELTA),
          }}
        />
        {(clustered == null
          ? rendered
          : [
            ...others,
            ...clustered.map((cluster) =>
              cluster.markers.length === 1 ? (
                findMarker(rendered, cluster.markers[0]!.id)
              ) : (
                <NativeMapCluster
                  key={cluster.id}
                  latitude={cluster.center.lat}
                  longitude={cluster.center.lng}
                  count={cluster.markers.length}
                  onTap={() => {
                    const lats = cluster.markers.map((m) => m.position.lat)
                    const lngs = cluster.markers.map((m) => m.position.lng)
                    cameraRef.current?.fitBounds(
                      [Math.max(...lngs), Math.max(...lats)],
                      [Math.min(...lngs), Math.min(...lats)],
                      80,
                      600,
                    )
                  }}
                />
              ),
            ),
          ]) as ReactNode}
      </Mapbox.MapView>
    </MapContext>
  )
}

type MarkerElementProps = React.ComponentProps<typeof NativeMapMarker>

function splitMarkers(children: ReactNode): {
  markerProps: MarkerElementProps[]
  others: ReactNode[]
} {
  const markerProps: MarkerElementProps[] = []
  const others: ReactNode[] = []

  Children.toArray(children).forEach((child) => {
    if (isValidElement<MarkerElementProps>(child) && child.type === NativeMapMarker) {
      markerProps.push(child.props)
      return
    }
    others.push(child)
  })

  return { markerProps, others }
}

function createToPixel(bounds: MapBounds, width: number): ToPixel {
  const lngSpan = bounds.east - bounds.west
  const scale = width / lngSpan

  return (coord) => ({
    x: (coord.lng - bounds.west) * scale,
    y: (bounds.north - coord.lat) * scale,
  })
}

function findMarker(children: ReactNode, id: string): ReactNode {
  return (
    Children.toArray(children).find(
      (child, index) =>
        isValidElement<MarkerElementProps>(child) &&
        child.type === NativeMapMarker &&
        (child.props.id ?? String(index)) === id,
    ) ?? null
  )
}
```

**@NOTE** `pastelMapStyle`은 지금 Google Maps `customMapStyle` 형식(스타일러 배열)이라 Mapbox `styleJSON`(Mapbox Style Spec, 완전히 다른 JSON 스키마)에는 그대로 쓸 수 없다. 이 태스크에서는 일단 타입 단언(`as never`)으로 컴파일만 통과시키고, 실제 pastel 스타일 JSON 재작성은 **Task 7**에서 별도로 처리한다 (범위 분리: 지도가 동작하는 것 먼저, 스타일 디테일은 나중).

- [ ] **Step 5: 타입 체크로 컴파일 확인**

Run: `pnpm --filter waylog-app exec tsc --noEmit -p . 2>&1 | tail -40`
Expected: `NativeMap.tsx`, `MapContext.ts` 관련 에러 없음 (다른 파일의 기존 에러는 이 태스크 범위 밖이므로 무시).

- [ ] **Step 6: 커밋**

```bash
git add apps/waylog-app/src/shared/components/Map/MapContext.ts \
        apps/waylog-app/src/shared/components/Map/NativeMap.tsx \
        apps/waylog-app/src/shared/components/Map/NativeMap.utils.ts \
        apps/waylog-app/src/shared/components/Map/__tests__/NativeMap.utils.test.ts
git commit -m "feat(app): NativeMap을 Mapbox MapView/Camera 기반으로 교체"
```

---

### Task 3: NativeMapMarker를 MarkerView로 교체 (스냅샷 트릭 제거)

**Files:**
- Modify: `apps/waylog-app/src/shared/components/Map/NativeMapMarker.tsx`
- Create: `apps/waylog-app/src/shared/components/Map/NativeMapTooltip.tsx`
- Test: 없음 (컴포넌트, 빌드+실기기 검증. 이 코드베이스 규칙상 `*.tsx` 컴포넌트 테스트 인프라 없음)

**Interfaces:**
- Consumes: `MapContext`(Task 2 완료본)의 `useMapContext()`, `@rnmapbox/maps`의 `Mapbox.MarkerView`
- Produces: `NativeMapMarker`는 기존과 동일한 `MarkerProps & { icon?: ReactNode }`를 받는다 (시그니처 불변). `NativeMapTooltip`은 `{ visible: boolean; text: string; onRequestClose: () => void }`를 받는 신규 컴포넌트.

- [ ] **Step 1: NativeMapTooltip 작성**

`apps/waylog-app/src/shared/components/Map/NativeMapTooltip.tsx` 신규 생성:

```tsx
import { Pressable, View } from 'react-native'
import { Typography } from '../mui'

interface Props {
  visible: boolean
  text: string
  onRequestClose: () => void
}

// MarkerView는 네이티브 Callout이 없어 탭 시 툴팁을 직접 그린다.
export function NativeMapTooltip({ visible, text, onRequestClose }: Props) {
  if (!visible) return null

  return (
    <Pressable
      onPress={onRequestClose}
      style={{
        position: 'absolute',
        bottom: '100%',
        left: '50%',
        transform: [{ translateX: -60 }],
        marginBottom: 8,
        width: 120,
        padding: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.85)',
      }}
    >
      <View>
        <Typography numberOfLines={4} sx={{ color: '#fff', fontSize: 12, textAlign: 'center' }}>
          {text}
        </Typography>
      </View>
    </Pressable>
  )
}
```

- [ ] **Step 2: NativeMapMarker.tsx를 MarkerView 기반으로 교체**

`apps/waylog-app/src/shared/components/Map/NativeMapMarker.tsx`를 다음으로 교체:

```tsx
import { memo, useState, type ReactNode } from 'react'
import { usePreservedCallback } from '@waylog/react'
import Mapbox from '@rnmapbox/maps'
import { resolveMarkerColor, type MarkerProps } from '@waylog/domains/modules/map'
import { Image, Pressable, View } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'
import { Typography } from '../mui'
import { useMapContext } from './MapContext'
import { NativeMapTooltip } from './NativeMapTooltip'

// 웹 MarkerProps 를 그대로 받는다.
// hover·우클릭이 없는 자리는 길게 누르기로 대응한다.
//
// icon 은 앱에만 있다. 웹은 SVG 를 data URI 로 만들어 thumbnailUrl 에 넣지만
// RN 의 Image 는 SVG data URI 를 못 읽어 그릴 것을 직접 받는다.
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

  const { config, extendBound } = useMapContext()
  const [isMounted] = useState(() => {
    if (config.autoFocus === 'marker') extendBound({ lat, lng })
    return true
  })
  void isMounted

  const [tooltipVisible, setTooltipVisible] = useState(false)
  const tooltipText = toTooltipText(tooltip)

  return (
    <Mapbox.MarkerView id={id} coordinate={[lng, lat]} anchor={{ x: 0.5, y: 1 }}>
      <Pressable
        onPress={() => {
          handleClick()
          if (tooltipText != null) setTooltipVisible((v) => !v)
        }}
        onLongPress={handleContextMenu}
      >
        <View style={{ minWidth: 44, minHeight: 48, alignItems: 'center', justifyContent: 'flex-end' }}>
          {tooltipText != null && (
            <NativeMapTooltip
              visible={tooltipVisible}
              text={tooltipText}
              onRequestClose={() => setTooltipVisible(false)}
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

interface ShapeProps {
  variant: 'pin' | 'circle'
  color: string
  opacity: number
  outlined?: boolean
  thumbnailUrl?: string
}

function MarkerShape({ variant, color, opacity, outlined, thumbnailUrl }: ShapeProps) {
  if (thumbnailUrl != null) {
    return (
      <View style={{ alignItems: 'center' }}>
        <View
          style={{
            width: THUMBNAIL_SIZE,
            height: THUMBNAIL_SIZE,
            borderRadius: THUMBNAIL_SIZE / 2,
            borderWidth: 3,
            borderColor: color,
            overflow: 'hidden',
            backgroundColor: '#eee',
          }}
        >
          <Image source={{ uri: thumbnailUrl }} style={{ width: '100%', height: '100%' }} />
        </View>
        <View
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: 5,
            borderRightWidth: 5,
            borderTopWidth: 6,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderTopColor: color,
            marginTop: -1,
          }}
        />
      </View>
    )
  }

  if (variant === 'circle') {
    return (
      <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} viewBox="0 0 16 16">
        {outlined === true ? (
          <Circle cx={8} cy={8} r={6} fill="white" fillOpacity={0.9} stroke={color} strokeWidth={2.5} />
        ) : (
          <>
            <Circle cx={8} cy={8} r={6} fill={color} fillOpacity={opacity} stroke="white" strokeWidth={4.5} />
            <Circle cx={8} cy={8} r={6} fill="none" stroke={color} strokeOpacity={opacity} strokeWidth={1} />
          </>
        )}
      </Svg>
    )
  }

  return (
    <Svg width={PIN_SIZE.width} height={PIN_SIZE.height} viewBox="0 0 20 30">
      <Path
        d="M10 0C4.5 0 0 4.5 0 10c0 7.5 10 20 10 20s10-12.5 10-20c0-5.5-4.5-10-10-10z"
        fill={color}
        fillOpacity={opacity}
      />
      <Circle cx={10} cy={10} r={4} fill="white" />
    </Svg>
  )
}

// Mapbox MarkerView는 실제 네이티브 뷰라 prop이 바뀌면 표준 React 리렌더링으로
// 반영된다. react-native-maps Marker처럼 스냅샷 캐싱을 하지 않으므로
// tracksViewChanges/key 리마운트 트릭이 더 이상 필요 없다.
export const NativeMapMarker = memo(NativeMapMarkerView, (prev, next) =>
  prev.id === next.id &&
  prev.lat === next.lat &&
  prev.lng === next.lng &&
  prev.label === next.label &&
  prev.variant === next.variant &&
  prev.color === next.color &&
  prev.opacity === next.opacity &&
  prev.outlined === next.outlined &&
  prev.thumbnailUrl === next.thumbnailUrl &&
  prev.tooltip === next.tooltip,
)

function toTooltipText(tooltip: MarkerProps['tooltip']): string | undefined {
  if (tooltip == null) return undefined
  return Array.isArray(tooltip) ? tooltip.join('\n') : tooltip
}
```

**@NOTE** `extendBound`를 `useState` 초기화 함수 안에서 부수효과로 실행하는 방식은 기존 `useEffect(() => {...}, [])`와 동일한 "마운트 시 1회" 시맨틱을 유지하되, React 19 Strict Mode에서 effect가 두 번 실행되는 것을 피하기 위함이다. 만약 팀 컨벤션상 `useEffect`를 선호한다면 `useEffect(() => { if (config.autoFocus === 'marker') extendBound({ lat, lng }) }, [])`로 대체 가능 — 두 방식 모두 동작은 동일하다.

- [ ] **Step 3: 타입 체크**

Run: `pnpm --filter waylog-app exec tsc --noEmit -p . 2>&1 | tail -40`
Expected: `NativeMapMarker.tsx`, `NativeMapTooltip.tsx` 관련 에러 없음.

- [ ] **Step 4: 커밋**

```bash
git add apps/waylog-app/src/shared/components/Map/NativeMapMarker.tsx \
        apps/waylog-app/src/shared/components/Map/NativeMapTooltip.tsx
git commit -m "feat(app): 마커를 MarkerView로 교체해 스냅샷 캐싱 트릭 제거"
```

---

### Task 4: NativeMapPath, NativeMapCluster를 Mapbox로 교체

**Files:**
- Modify: `apps/waylog-app/src/shared/components/Map/NativeMapPath.tsx`
- Modify: `apps/waylog-app/src/shared/components/Map/NativeMapCluster.tsx`
- Test: 없음 (컴포넌트)

**Interfaces:**
- Consumes: `useMapContext()` (Task 2), `@rnmapbox/maps`의 `Mapbox.ShapeSource`, `Mapbox.LineLayer`, `Mapbox.MarkerView`
- Produces: `NativeMapPath`는 기존과 동일한 `PathProps` 시그니처 유지. `NativeMapCluster`는 기존과 동일한 `{ latitude, longitude, count, onTap? }` props 유지.

- [ ] **Step 1: NativeMapPath.tsx를 ShapeSource/LineLayer 기반으로 교체**

`apps/waylog-app/src/shared/components/Map/NativeMapPath.tsx`를 다음으로 교체:

```tsx
import { useEffect, useId } from 'react'
import type { PathProps } from '@waylog/domains/modules/map'
import Mapbox from '@rnmapbox/maps'
import { useMapContext } from './MapContext'

export function NativeMapPath({
  coordinates,
  strokeColor = '#4C84FF',
  strokeWeight = 4,
  strokeOpacity = 1,
  strokeStyle,
}: PathProps) {
  const { config, extendBound } = useMapContext()
  const sourceId = useId()

  useEffect(() => {
    if (config.autoFocus === 'path') coordinates.forEach((coord) => extendBound(coord))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coordinates])

  if (coordinates.length < 2) return null

  const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: coordinates.map((c) => [c.lng, c.lat]),
    },
  }

  return (
    <Mapbox.ShapeSource id={`path-${sourceId}`} shape={geojson}>
      <Mapbox.LineLayer
        id={`path-line-${sourceId}`}
        style={{
          lineColor: strokeColor,
          lineWidth: strokeWeight,
          lineOpacity: strokeOpacity,
          lineDashArray: toDashPattern(strokeStyle, strokeWeight),
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
    </Mapbox.ShapeSource>
  )
}

function toDashPattern(style: string | undefined, weight: number): number[] | undefined {
  if (style === 'dashed') return [weight * 3, weight * 2]
  if (style === 'dotted') return [weight, weight * 2]
  return undefined
}
```

**@NOTE** 기존 `withOpacity` 헬퍼(hex+opacity를 rgba로 합성)는 더 이상 필요 없다 — Mapbox `LineLayer`는 `lineColor`와 `lineOpacity`를 별개 스타일 속성으로 받으므로 색상 합성이 불필요해졌다. 이건 인터페이스(`PathProps`)가 아니라 구현 세부사항의 단순화이므로 소비자에 영향 없음.

- [ ] **Step 2: NativeMapCluster.tsx를 MarkerView 기반으로 교체**

`apps/waylog-app/src/shared/components/Map/NativeMapCluster.tsx`를 다음으로 교체:

```tsx
import Mapbox from '@rnmapbox/maps'
import Svg, { Circle, Text as SvgText } from 'react-native-svg'
import { Pressable } from 'react-native'

interface Props {
  latitude: number
  longitude: number
  count: number
  /** 누르면 묶인 마커가 모두 보이도록 확대한다 */
  onTap?: () => void
}

// 카카오·구글처럼 개수에 따라 크기와 색이 커진다.
function getStyle(count: number) {
  if (count >= 100) return { size: 64, color: '#e53935', ring: 'rgba(229,57,53,0.3)' }
  if (count >= 10) return { size: 56, color: '#fb8c00', ring: 'rgba(251,140,0,0.3)' }
  return { size: 48, color: '#4C84FF', ring: 'rgba(76,132,255,0.3)' }
}

export function NativeMapCluster({ latitude, longitude, count, onTap }: Props) {
  const { size, color, ring } = getStyle(count)
  const half = size / 2

  return (
    <Mapbox.MarkerView coordinate={[longitude, latitude]} anchor={{ x: 0.5, y: 0.5 }}>
      <Pressable onPress={onTap}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle cx={half} cy={half} r={half} fill={ring} />
          <Circle cx={half} cy={half} r={half - 6} fill={color} stroke="#fff" strokeWidth={2} />
          <SvgText
            x={half}
            y={half}
            fill="#fff"
            fontSize={count >= 100 ? 16 : 18}
            fontWeight="bold"
            textAnchor="middle"
            alignmentBaseline="central"
          >
            {String(count)}
          </SvgText>
        </Svg>
      </Pressable>
    </Mapbox.MarkerView>
  )
}
```

- [ ] **Step 3: useRouteLegsPathList.ts 주석 갱신 확인**

`apps/waylog-app/src/features/trip/hooks/useRouteLegsPathList.ts:7-9`의 주석("AIRMap 은 지도용이 아닌 자식을 만나면... 내부 배열이 깨진다")은 `react-native-maps`(`AIRMap`) 특유의 제약을 설명한 것이다. Mapbox `ShapeSource`는 이 제약이 없으므로, 훅으로 구간만 얻어 호출부가 `Map.Path`를 직접 펼치는 지금 설계 자체는 계속 유효하지만(불필요한 재작업 방지 목적으로도 유효한 패턴), 주석의 "AIRMap" 언급만 사실과 다르게 남는다. 이 파일은 수정하지 않는다 — 주석 정정은 범위 밖이며, Task 8(문서 갱신)에서 `docs/codebase.md` 갱신 시 함께 언급한다.

- [ ] **Step 4: 타입 체크**

Run: `pnpm --filter waylog-app exec tsc --noEmit -p . 2>&1 | tail -40`
Expected: `NativeMapPath.tsx`, `NativeMapCluster.tsx` 관련 에러 없음.

- [ ] **Step 5: 커밋**

```bash
git add apps/waylog-app/src/shared/components/Map/NativeMapPath.tsx \
        apps/waylog-app/src/shared/components/Map/NativeMapCluster.tsx
git commit -m "feat(app): 경로선·클러스터 마커를 Mapbox ShapeSource/MarkerView로 교체"
```

---

### Task 5: 뷰포트 컬링 (마커 100개 상한 대응)

**Files:**
- Create: `apps/waylog-app/src/shared/components/Map/useMapViewportCulling.ts`
- Create: `apps/waylog-app/src/shared/components/Map/__tests__/useMapViewportCulling.test.ts`
- Modify: `apps/waylog-app/src/shared/components/Map/NativeMap.tsx`

**Interfaces:**
- Consumes: `MapBounds` 타입 (`@waylog/domains/modules/map`), Task 2에서 만든 `visibleBounds` state
- Produces: `isCoordinateInBounds(coordinate: Coordinate, bounds: MapBounds, padding?: number): boolean` — 순수 함수. `NativeMap.tsx`가 이 함수로 `markerProps`를 필터링한다.

- [ ] **Step 1: 실패하는 테스트 작성**

`apps/waylog-app/src/shared/components/Map/__tests__/useMapViewportCulling.test.ts` 신규 생성:

```ts
import { describe, expect, it } from 'vitest'
import { isCoordinateInBounds } from '../useMapViewportCulling'

describe('isCoordinateInBounds', () => {
  const bounds = { north: 38, south: 37, east: 127, west: 126 }

  it('bounds 내부 좌표는 true를 반환한다', () => {
    expect(isCoordinateInBounds({ lat: 37.5, lng: 126.5 }, bounds)).toBe(true)
  })

  it('bounds 외부 좌표는 false를 반환한다', () => {
    expect(isCoordinateInBounds({ lat: 40, lng: 126.5 }, bounds)).toBe(false)
  })

  it('padding을 주면 경계 바로 밖 좌표도 포함한다', () => {
    expect(isCoordinateInBounds({ lat: 38.05, lng: 126.5 }, bounds, 0.1)).toBe(true)
  })

  it('padding 없이는 경계 바로 밖 좌표를 제외한다', () => {
    expect(isCoordinateInBounds({ lat: 38.05, lng: 126.5 }, bounds)).toBe(false)
  })
})
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

Run: `cd apps/waylog-app && pnpm test -- useMapViewportCulling`
Expected: FAIL with "Cannot find module '../useMapViewportCulling'"

- [ ] **Step 3: 최소 구현 작성**

`apps/waylog-app/src/shared/components/Map/useMapViewportCulling.ts` 신규 생성:

```ts
import type { Coordinate, MapBounds } from '@waylog/domains/modules/map'

// 뷰포트 밖 마커는 렌더링하지 않는다. MarkerView는 실제 네이티브 뷰라
// react-native-maps Marker(비트맵)보다 동시 표시 상한(공식 권장 최대 ~100개)이
// 낮으므로, 화면에 보이는 것만 유지해 상한을 넘지 않게 한다.
export function isCoordinateInBounds(coordinate: Coordinate, bounds: MapBounds, padding = 0): boolean {
  return (
    coordinate.lat <= bounds.north + padding &&
    coordinate.lat >= bounds.south - padding &&
    coordinate.lng <= bounds.east + padding &&
    coordinate.lng >= bounds.west - padding
  )
}
```

- [ ] **Step 4: 테스트 실행하여 통과 확인**

Run: `cd apps/waylog-app && pnpm test -- useMapViewportCulling`
Expected: PASS (4 tests)

- [ ] **Step 5: NativeMap.tsx에서 markerProps를 뷰포트로 필터링**

`apps/waylog-app/src/shared/components/Map/NativeMap.tsx`에서 `clustered` 계산 직전에 다음을 추가 (Task 2에서 작성한 파일을 수정):

```ts
import { isCoordinateInBounds } from './useMapViewportCulling'

// ... 기존 markerProps 계산 다음에 추가
const VIEWPORT_PADDING_RATIO = 0.2 // 화면 경계 바로 밖도 살짝 포함해 패닝 시 마커가 뚝 끊겨 나타나지 않게 한다

const visibleMarkerProps = useMemo(() => {
  if (visibleBounds == null) return markerProps // 최초 마운트 시(bounds 미확정)는 전체 표시

  const latPadding = (visibleBounds.north - visibleBounds.south) * VIEWPORT_PADDING_RATIO
  const lngPadding = (visibleBounds.east - visibleBounds.west) * VIEWPORT_PADDING_RATIO
  const padding = Math.max(latPadding, lngPadding)

  return markerProps.filter((marker) => isCoordinateInBounds({ lat: marker.lat, lng: marker.lng }, visibleBounds, padding))
}, [markerProps, markerIdentity, visibleBounds])
```

그리고 `clustered` 계산과 최종 렌더링에서 `markerProps` 대신 `visibleMarkerProps`를 사용하도록 교체한다 (클러스터링 입력 데이터, `findMarker` 탐색 대상 모두).

- [ ] **Step 6: 타입 체크**

Run: `pnpm --filter waylog-app exec tsc --noEmit -p . 2>&1 | tail -40`
Expected: 에러 없음.

- [ ] **Step 7: 커밋**

```bash
git add apps/waylog-app/src/shared/components/Map/useMapViewportCulling.ts \
        apps/waylog-app/src/shared/components/Map/__tests__/useMapViewportCulling.test.ts \
        apps/waylog-app/src/shared/components/Map/NativeMap.tsx
git commit -m "feat(app): 화면 밖 마커 컬링으로 MarkerView 동시 표시 상한 대응"
```

---

### Task 6: 폴리곤 타입 공유 패키지 승격

**Files:**
- Modify: `packages/domains/src/modules/map/types.ts`
- Modify: `packages/domains/src/modules/map/index.ts`
- Modify: `apps/waylog-web/src/shared/components/Map/polygon-layer.types.ts`
- Test: 없음 (타입 전용 변경, 컴파일로 검증)

**Interfaces:**
- Consumes: 없음 (타입 정의 이동)
- Produces: `@waylog/domains/modules/map`에서 `PolygonStyleProps`, `MapPolygonProps`, `MapRegionProps`, `PolygonLayerProps`, `RegionLayerProps` export. Task 7이 앱 쪽에서 이 타입을 import한다.

- [ ] **Step 1: 공유 패키지에 폴리곤 타입 추가**

`packages/domains/src/modules/map/types.ts`의 파일 끝(`MarkerData` 인터페이스 다음)에 추가:

```ts
import type { ReactNode } from "react";

// 지역구/국가 경계 색칠. 웹·앱 공용 계약 — 제공자가 미지원이면 null 렌더로 처리한다.
export interface PolygonStyleProps {
  color?: string;
  opacity?: number;
  strokeColor?: string;
}

export type MapPolygonProps = PolygonStyleProps & {
  coordinates: Coordinate[][];
};

export type MapRegionProps =
  | (PolygonStyleProps & { country: string; location?: never })
  | (PolygonStyleProps & { location: unknown; country?: never });

export interface PolygonLayerProps extends PolygonStyleProps {
  children?: ReactNode;
}

export type RegionLayerProps = PolygonLayerProps;
```

**@NOTE** `MapRegionProps`의 `country`/`location` 필드 타입은 웹 원본에서 각각 `Country`(`@waylog/domains/modules/location`), `Location`(동일 패키지)이었다. `packages/domains/src/modules/map`은 `modules/location`을 이미 참조 가능한 같은 패키지 내부이므로, 실제 구현 시에는 `unknown` 대신 다음처럼 정확한 타입을 import해서 쓴다:

```ts
import type { Country, Location } from "../location";

export type MapRegionProps =
  | (PolygonStyleProps & { country: Country; location?: never })
  | (PolygonStyleProps & { location: Location; country?: never });
```

(플랜 작성 시점에 `../location` 모듈의 정확한 export 경로를 실행자가 `packages/domains/src/modules/location/index.ts`에서 확인할 것.)

- [ ] **Step 2: index.ts는 이미 `export * from './types'`이므로 추가 수정 불필요 확인**

`packages/domains/src/modules/map/index.ts`를 열어 `export * from './types'`가 있는지 확인만 한다. 이미 있으므로 수정 없음.

- [ ] **Step 3: 웹의 polygon-layer.types.ts를 재노출로 축소**

`apps/waylog-web/src/shared/components/Map/polygon-layer.types.ts`를 다음으로 교체:

```ts
import type { ReactElement } from 'react'
import type { MapPolygonProps, MapRegionProps } from './types'

export type {
  PolygonStyleProps,
  MapPolygonProps,
  MapRegionProps,
  PolygonLayerProps,
  RegionLayerProps,
} from '@waylog/domains/modules/map'

export type PolygonElement = ReactElement<MapPolygonProps>
export type RegionElement = ReactElement<MapRegionProps>
```

- [ ] **Step 4: 웹 타입 체크로 회귀 확인**

Run: `pnpm --filter waylog-web exec tsc --noEmit -p . 2>&1 | tail -40`
Expected: `polygon-layer.types.ts`를 import하는 `PolygonLayer.tsx`, `GooglePolygonLayer.tsx` 등에서 에러 없음 (타입이 동일한 구조로 재노출되므로 기존 코드는 영향 없어야 함).

- [ ] **Step 5: 커밋**

```bash
git add packages/domains/src/modules/map/types.ts \
        apps/waylog-web/src/shared/components/Map/polygon-layer.types.ts
git commit -m "refactor(domains): 폴리곤 레이어 타입을 공유 패키지로 승격"
```

---

### Task 7: 앱에 PolygonLayer/Polygon/Region 이식

**Files:**
- Create: `apps/waylog-app/src/shared/components/Map/PolygonLayer.tsx`
- Modify: `apps/waylog-app/src/shared/components/Map/index.tsx`
- Test: 없음 (컴포넌트, 빌드+실기기 검증)

**Interfaces:**
- Consumes: `MapContext`(Task 2, `map` 필드), `@waylog/domains/modules/map`의 `PolygonLayerProps`/`MapPolygonProps`/`MapRegionProps` (Task 6), 웹의 `getCountryPolygonCoordinateGroups`/`getLocationCoordinates` (재사용, 아래 Step 1에서 앱 쪽 위치 확인)
- Produces: `Map.PolygonLayer`, `Map.Polygon`, `Map.Region` — 웹과 동일한 API.

- [ ] **Step 1: 폴리곤 좌표 계산 로직의 앱 내 위치 확인**

`apps/waylog-web/src/shared/components/Map/polygon-layer.utils.ts`가 import하는 `fetchCountryCityBoundaries`, `fetchCountryRegionBoundaries`, `fetchWorldBoundaries`, `getCountryCoordinateGroups`, `getLocationCoordinatesFromBoundary`는 현재 `apps/waylog-web/src/shared/components/Map/google/boundary/` 아래에 있다(웹 로컬, Google 전용 폴더 안). 이 로직 자체는 순수 데이터 처리(경계 데이터 fetch + GeoJSON 파싱)라 지도 SDK와 무관하지만, 지금 위치가 `google/` 폴더 안이라 이름이 오해를 부른다.

이 태스크에서는 **로직을 옮기지 않고** 앱에서 상대 경로로 재사용 불가능하다는 점만 확인한 뒤(다른 앱 패키지에서 `apps/waylog-web` 내부 파일을 직접 import할 수 없음 — 워크스페이스 경계), 다음 Step에서 이 로직을 앱에서도 쓸 수 있는 위치로 복사가 아닌 **이동**을 제안한다:

Run: `grep -n "boundary" apps/waylog-web/src/shared/components/Map/polygon-layer.utils.ts`
Expected: `./google/boundary/boundary.data`, `./google/boundary/boundary.geometry` import 확인.

**의사결정**: `boundary.data.ts`, `boundary.geometry.ts`, `boundary.types.ts`는 지도 SDK 비의존이므로 `packages/domains/src/modules/map/boundary/`로 이동하는 것이 정석이지만, 이 이동은 웹 쪽 import 경로 15곳 이상을 함께 수정해야 하는 별도 리팩터링 범위다. **이번 플랜에서는 범위를 좁혀, 앱은 이 데이터를 웹과 별개로 직접 fetch하는 대신 같은 API 엔드포인트/정적 데이터를 가리키는 얇은 어댑터를 앱 로컬에 둔다** — 아래 Step 2에서 구현.

- [ ] **Step 2: 앱 로컬 폴리곤 좌표 유틸 작성 (웹 로직 참조, 앱 fetch 경로로 어댑팅)**

`apps/waylog-web/src/shared/components/Map/google/boundary/boundary.data.ts`를 먼저 읽어 `fetchWorldBoundaries` 등이 정적 JSON을 fetch하는지 API 호출인지 확인한 뒤 (실행자가 확인할 것), 다음 구조로 `apps/waylog-app/src/shared/components/Map/PolygonLayer.tsx`를 작성한다:

```tsx
import { createContext, use, useEffect, useState, type ReactNode } from 'react'
import type {
  MapPolygonProps,
  MapRegionProps,
  PolygonLayerProps,
  PolygonStyleProps,
} from '@waylog/domains/modules/map'
import type { Coordinate } from '@waylog/utility'
import Mapbox from '@rnmapbox/maps'
import { useMapContext } from './MapContext'

const PolygonLayerStyleContext = createContext<PolygonStyleProps | null>(null)

export function PolygonLayer({ children, color, opacity, strokeColor }: PolygonLayerProps) {
  return (
    <PolygonLayerStyleContext value={{ color, opacity, strokeColor }}>
      {children}
    </PolygonLayerStyleContext>
  )
}

export function Polygon(props: MapPolygonProps) {
  const defaults = use(PolygonLayerStyleContext)
  const color = props.color ?? defaults?.color ?? '#4C84FF'
  const opacity = props.opacity ?? defaults?.opacity ?? 0.3
  const strokeColor = props.strokeColor ?? defaults?.strokeColor ?? color

  const geojson: GeoJSON.Feature<GeoJSON.Polygon> = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: props.coordinates
        .filter((ring) => ring.length >= 3)
        .map((ring) => closePolygon(ring).map((c) => [c.lng, c.lat])),
    },
  }

  return (
    <Mapbox.ShapeSource id={`polygon-${JSON.stringify(props.coordinates[0]?.[0])}`} shape={geojson}>
      <Mapbox.FillLayer
        id="polygon-fill"
        style={{ fillColor: color, fillOpacity: opacity, fillOutlineColor: strokeColor }}
      />
    </Mapbox.ShapeSource>
  )
}

export function Region(props: MapRegionProps) {
  const [coordinateGroups, setCoordinateGroups] = useState<Coordinate[][][] | null>(null)

  useEffect(() => {
    let mounted = true
    setCoordinateGroups(null)

    async function load() {
      const { getCountryPolygonCoordinateGroups, getLocationCoordinates } = await import('@waylog/domains/modules/map')

      if (props.country != null) {
        const coordinates = await getCountryPolygonCoordinateGroups(props.country)
        if (mounted) setCoordinateGroups(coordinates)
        return
      }

      const coordinates = await getLocationCoordinates({ location: props.location })
      if (mounted) setCoordinateGroups(coordinates ? [coordinates] : [])
    }

    load()
    return () => {
      mounted = false
    }
  }, [props])

  if (!coordinateGroups?.length) return null

  return (
    <>
      {coordinateGroups.map((coordinates, index) => (
        <Polygon
          key={`${props.country ?? String(props.location)}-${index}`}
          coordinates={coordinates}
          color={props.color}
          opacity={props.opacity}
          strokeColor={props.strokeColor}
        />
      ))}
    </>
  )
}

function closePolygon(coordinates: Coordinate[]) {
  if (coordinates.length === 0) return coordinates
  const first = coordinates[0]
  const last = coordinates[coordinates.length - 1]
  if (!first || !last) return coordinates
  if (first.lat === last.lat && first.lng === last.lng) return coordinates
  return [...coordinates, first]
}
```

**@NOTE** `getCountryPolygonCoordinateGroups`/`getLocationCoordinates`를 `@waylog/domains/modules/map`에서 동적 import하는 것으로 작성했지만, 이 함수들은 현재 **웹 로컬**(`apps/waylog-web/src/shared/components/Map/polygon-layer.utils.ts`)에 있고 공유 패키지에는 없다. 이 플랜의 Task 6은 **타입만** 승격했고 **로직(함수)**은 옮기지 않았다. 따라서 이 Step을 실행하는 담당자는 다음 중 하나를 먼저 선택해야 한다:

  (a) `polygon-layer.utils.ts` + `google/boundary/*` 전체를 `packages/domains/src/modules/map/`로 이동하고 웹의 import 경로를 전부 갱신 (정공법, 범위 확대)
  (b) 앱에서 별도로 동일한 fetch 로직을 복제 구현 (중복 발생, 비권장)

**이 플랜은 (a)를 권장하며, Task 7의 실제 착수 전에 이 이동을 별도 서브태스크로 먼저 완료한다.** 담당자는 착수 시 `apps/waylog-web/src/shared/components/Map/polygon-layer.utils.ts`와 `google/boundary/` 3개 파일을 읽고, import 경로 변경 범위(웹에서 이 경로를 참조하는 파일 수)를 `grep -rl "polygon-layer.utils\|boundary/boundary" apps/waylog-web/src`로 먼저 산출한 뒤 진행한다.

- [ ] **Step 3: Map/index.tsx에 PolygonLayer 재노출 추가**

`apps/waylog-app/src/shared/components/Map/index.tsx`를 읽고, 다음을 추가한다 (기존 `Map.Marker`, `Map.Path` 재노출 옆에):

```ts
import { PolygonLayer, Polygon, Region } from './PolygonLayer'

// ... 기존 Object.assign 또는 Map.xxx = ... 패턴에 맞춰 추가
Map.PolygonLayer = PolygonLayer
Map.Polygon = Polygon
Map.Region = Region
```

정확한 추가 위치는 현재 `apps/waylog-app/src/shared/components/Map/index.tsx`의 기존 구조(현재 `Object.assign(NativeMap, { Marker, Path })` 형태)를 그대로 따른다 — 담당자가 파일을 열어 기존 패턴에 맞춰 통합한다.

- [ ] **Step 4: 타입 체크**

Run: `pnpm --filter waylog-app exec tsc --noEmit -p . 2>&1 | tail -40`
Expected: 에러 없음.

- [ ] **Step 5: 커밋**

```bash
git add apps/waylog-app/src/shared/components/Map/PolygonLayer.tsx \
        apps/waylog-app/src/shared/components/Map/index.tsx
git commit -m "feat(app): 지역구·국가 폴리곤 색칠(Map.Region/Map.Polygon) 이식"
```

---

### Task 8: pastelMapStyle을 Mapbox Style Spec으로 재작성

**Files:**
- Modify: `packages/domains/src/modules/map/map.style.ts`
- Test: 없음 (스타일 JSON, 실기기 시각 확인)

**Interfaces:**
- Consumes: 없음
- Produces: `pastelMapStyle`이 Mapbox Style Spec(JSON, `version: 8` 포맷)을 만족하는 객체로 변경됨. `NativeMap.tsx`(Task 2)의 `styleJSON={pastelMapStyle as never}`에서 `as never` 캐스팅을 제거할 수 있게 됨.

- [ ] **Step 1: 현재 pastelMapStyle 확인**

`packages/domains/src/modules/map/map.style.ts`를 읽는다. 이는 Google Maps `styles` 배열(`[{ featureType, elementType, stylers }]`) 포맷이다. **웹은 이 파일을 그대로 계속 쓴다** — 이 태스크는 앱 전용 Mapbox 스타일을 별도로 추가하는 것이지, 기존 파일을 대체하는 것이 아니다.

- [ ] **Step 2: Mapbox용 파스텔 스타일을 별도 파일로 추가**

`packages/domains/src/modules/map/map.style.mapbox.ts` 신규 생성 — Mapbox Style Spec 최소 구성(배경/도로/물/라벨 색상만 pastel 톤으로):

```ts
// Mapbox Style Spec (v8). react-native-maps용 pastelMapStyle(map.style.ts)과
// 별개 파일이다 — 두 SDK의 스타일 포맷이 근본적으로 다르다.
export const pastelMapboxStyle = {
  version: 8,
  sources: {
    'mapbox-streets': {
      type: 'vector',
      url: 'mapbox://mapbox.mapbox-streets-v8',
    },
  },
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': '#F5F3EE' } },
    {
      id: 'water',
      type: 'fill',
      source: 'mapbox-streets',
      'source-layer': 'water',
      paint: { 'fill-color': '#CFE3EC' },
    },
    {
      id: 'road',
      type: 'line',
      source: 'mapbox-streets',
      'source-layer': 'road',
      paint: { 'line-color': '#FFFFFF', 'line-width': 1.5 },
    },
    {
      id: 'admin',
      type: 'line',
      source: 'mapbox-streets',
      'source-layer': 'admin',
      paint: { 'line-color': '#D8D4C8', 'line-width': 1 },
    },
  ],
} as const
```

**@NOTE** 이 스타일은 최소 골격이다. 실제 색상 값(배경 `#F5F3EE` 등)은 담당자가 기존 Google `pastelMapStyle`의 색상 값을 참고해 시각적으로 맞춰야 하며, Xcode 실기기 확인(Task 9)에서 웹/기존 앱과 나란히 비교해 조정한다.

- [ ] **Step 3: map.style.ts의 export에 추가**

`packages/domains/src/modules/map/map.style.ts` 파일 끝에 추가:

```ts
export { pastelMapboxStyle } from './map.style.mapbox'
```

- [ ] **Step 4: NativeMap.tsx에서 as never 캐스팅 제거**

`apps/waylog-app/src/shared/components/Map/NativeMap.tsx`에서:

```diff
- import { clusterMarkers, pastelMapStyle, ... } from '@waylog/domains/modules/map'
+ import { clusterMarkers, pastelMapboxStyle, ... } from '@waylog/domains/modules/map'

- styleJSON={pastelMapStyle as never}
+ styleJSON={JSON.stringify(pastelMapboxStyle)}
```

(`Mapbox.MapView`의 `styleJSON` prop은 문자열을 받는지 객체를 받는지 `@rnmapbox/maps` 타입 정의로 실행자가 확인 후 맞는 형태로 전달한다.)

- [ ] **Step 5: 타입 체크**

Run: `pnpm --filter waylog-app exec tsc --noEmit -p . 2>&1 | tail -40`
Expected: 에러 없음.

- [ ] **Step 6: 커밋**

```bash
git add packages/domains/src/modules/map/map.style.mapbox.ts \
        packages/domains/src/modules/map/map.style.ts \
        apps/waylog-app/src/shared/components/Map/NativeMap.tsx
git commit -m "style(app): Mapbox용 파스텔 지도 스타일 추가"
```

---

### Task 9: 실기기 검증 및 문서 갱신

**Files:**
- Modify: `docs/codebase.md`
- Test: 없음 (수동 실기기 검증)

**Interfaces:**
- Consumes: Task 1~8의 모든 산출물
- Produces: 없음 (검증 + 문서화 태스크)

- [ ] **Step 1: iOS 네이티브 빌드 재생성**

Run: `cd apps/waylog-app && pnpm prebuild:ios && pnpm ios --device`
Expected: 빌드 성공, 앱이 실기기에 설치되어 실행됨.

- [ ] **Step 2: 계획탭(route.tsx) 크래시 재현 시나리오 확인**

앱에서 트립 상세 → 계획탭(route)으로 이동. 이전에 크래시를 유발했던 조작(경로 선택 변경, 장소 카테고리 변경, 줌인/줌아웃 반복)을 반복 수행한다.
Expected: 크래시 없음. Xcode 콘솔에 `AIRGoogleMap`/`insertReactSubview` 관련 에러 없음.

- [ ] **Step 3: 마커 기능 4종 확인**

- 마커 형태(pin/circle)가 화면에 올바르게 표시되는지
- 라벨 텍스트가 표시되고, 장소명 변경 시 즉시 갱신되는지 (재마운트 깜빡임 없이)
- 마커 탭 시 툴팁이 뜨고, 다시 탭하면 닫히는지
- 썸네일 이미지가 있는 마커가 원형 이미지로 표시되는지

Expected: 4가지 모두 정상 동작.

- [ ] **Step 4: 폴리곤(지역구 색칠) 확인**

`Map.Region`을 사용하는 화면(웹의 `ProfileRecordsTab.tsx`에 해당하는 앱 화면이 있다면 그곳, 없다면 임시로 `ExplorerMap.tsx`에 `<Map.Region location={...} />`를 추가해 확인 후 제거)에서 지역구 색칠이 렌더링되는지 확인.
Expected: 다각형이 지정한 색상으로 채워짐.

- [ ] **Step 5: 클러스터링 확인**

`clustering` prop이 켜진 화면(`ExplorerMap.tsx`)에서 마커가 많은 지역을 줌아웃해 클러스터 숫자 마커로 묶이는지, 탭하면 확대되는지 확인.
Expected: 정상 동작.

- [ ] **Step 6: docs/codebase.md 갱신**

`docs/codebase.md`에서 `waylog-app`의 지도 구현 관련 서술을 찾아 `react-native-maps` → `@rnmapbox/maps`로 갱신하고, `Map.PolygonLayer`/`Map.Region`/`Map.Polygon`이 앱에도 추가되었음을 반영한다. 정확한 위치는 실행자가 `grep -n "react-native-maps\|NativeMap" docs/codebase.md`로 찾는다.

- [ ] **Step 7: 최종 커밋**

```bash
git add docs/codebase.md
git commit -m "docs: 지도 구현체 Mapbox 전환 반영"
```

---

## Self-Review 결과

**Spec coverage:**
- (1) 마커 형태 원형/핀 → Task 3 `MarkerShape` 그대로 이식 ✓
- (2) 라벨 → Task 3 `<Typography>` 자식, prop 변경 자동 반영 ✓
- (3) 탭 시 툴팁 → Task 3 `NativeMapTooltip` 신규 구현 ✓
- (4) 마커 내 이미지 → Task 3 `Image` 자식 그대로 이식 ✓
- (5) 지역구 색칠 → Task 6(타입 승격) + Task 7(구현 이식) ✓
- 크래시 근본 해결 → Task 1~5 전체(react-native-maps 제거 + MarkerView 전환) ✓
- 웹과 동일 인터페이스 → `MapProps`/`MarkerProps`/`PathProps` 시그니처 전 태스크에서 불변 유지 ✓

**Placeholder scan:** Task 7 Step 2에서 "(a)/(b) 중 선택" 형태로 열어둔 결정 지점이 있음 — 이는 플레이스홀더가 아니라, 웹 로직 이동이라는 별도 리팩터링 범위를 이 플랜 안에서 강행하지 않기 위한 의도적 위임이며, 권장안(a)과 실행자가 사전에 확인해야 할 정확한 명령(`grep`)을 명시했으므로 "TBD"류 플레이스홀더와는 다르다.

**Type consistency:** `MapContextValue`(Task 2)에 추가된 `map` 필드를 Task 7의 `PolygonLayer.tsx`가 실제로는 사용하지 않는 것으로 최종안이 작성됨(대신 `Mapbox.ShapeSource`/`FillLayer`를 트리 내 선언형으로 직접 사용) — `map` 필드는 향후 명령형 API가 필요해질 경우(예: `map.data` 같은 직접 조작)를 대비해 Task 2에서 추가했으나 이번 플랜 범위에서는 소비처가 없다. 불필요하면 Task 2 Step 1에서 `map` 필드 추가를 생략해도 무방하나, 웹과의 구조적 대칭성(`MapContextValue<MapInstance>`가 `map`을 갖는 것)을 위해 유지하는 것을 권장한다.
