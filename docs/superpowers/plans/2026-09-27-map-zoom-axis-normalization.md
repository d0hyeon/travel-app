# Map Zoom 축 정규화 + defaultZoom 추가 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 공용 Map 인터페이스(`MapProps`, `MapRef`, `useMapZoomLevel`)의 줌 값 축을 "클수록 확대"(구글·Mapbox 표준)로 통일하고, `MapProps`에 `defaultZoom`을 추가해 웹(카카오·구글)·앱(Mapbox) 세 구현체 모두에 적용한다.

**Architecture:** 지금까지 공용 줌 값은 사실상 카카오 레벨(작을수록 확대)을 기준으로 노출되고 있었고, 구글 구현체만 `22 - level`로 반전해 맞춰왔다. Mapbox·도메인 레이어(`polygonZoomOpacity.ts`)는 이미 "클수록 확대" 축을 그대로 쓰고 있었다. 이번 변경은 반전 책임을 구글에서 카카오로 옮긴다 — 카카오 구현체 내부에 `kakao/zoomLevel.utils.ts`를 두고 표준 zoom ↔ 카카오 level 상호 변환을 완결시키며, 구글·Mapbox·도메인 레이어는 손대지 않는다. 소비 코드(`RoutePath.tsx`, `PlaceSearchSelectScreen.tsx` 양쪽, `CommunityRouteDetailOverlay.tsx`)는 이제 표준 축의 값을 주고받도록 부등호와 숫자를 다시 계산한다.

**Tech Stack:** TypeScript, React, react-native, Kakao Maps JS SDK, Google Maps JS SDK, @rnmapbox/maps

**Spec:** 본 대화 — 사용자 확정 사항: "구글·Mapbox가 표준(클수록 확대), 카카오가 노멀라이징한다."

## Global Constraints

- 표준 축 범위는 구글이 이미 쓰는 0~22, 카카오 변환 기준값은 기존 `GoogleMap.tsx`의 `ZOOM_MAX_LEVEL = 22`를 그대로 승계한다 (검증된 상수 재사용, 새 상수 임의 도입 금지).
- 공용 도메인 레이어(`packages/domains/src/modules/map/*`)의 `polygonZoomOpacity.ts`, `map.utils.ts` 등은 이미 표준 축을 쓰고 있으므로 수정하지 않는다.
- 카카오 축 변환은 `kakao/` 디렉토리 내부에서 완결한다 — 공용 `types.ts`나 도메인 유틸에 카카오 특화 상수/함수를 두지 않는다.
- 기존 테스트 케이스(`packages/domains/src/modules/map/__tests__/*`)는 이번 변경과 무관하므로 임의로 바꾸지 않는다.
- 커밋은 논리 단위로 분리한다 (도메인 인터페이스 변경 / 카카오 어댑터 / 구글 정리 / 앱 defaultZoom / 소비 코드 조정 각각 별도 커밋).

## Review Focus

- `RoutePath.tsx`의 `zoomLevel < 10` 부등호를 반전 없이 그대로 두면 라벨 표시 조건이 완전히 뒤집힌다 — 값과 부등호를 함께 재계산했는지 확인.
- 웹 `PlaceSearchSelectScreen.tsx`의 `panTo(result.lat, result.lng, 2)` 두 호출부가 "카카오 레벨 2(매우 확대)"라는 기존 의도를 유지한 채 표준 zoom 값으로 바뀌었는지 확인 — 숫자만 그대로 두면 거의 축소된 상태로 이동하게 된다.
- `KakaoMap.tsx`의 초기 `level: 8`과 `useViewportFit`의 `map.getLevel()`/`map.setLevel(level)` 내부 왕복이, 외부로 나가는 `useMapZoomLevel()` 값과 축이 엇갈리지 않는지 확인 — 내부는 카카오 level 그대로 두고 경계에서만 변환해야 한다.
- `GoogleMap.tsx`의 `panTo`에서 `ZOOM_MAX_LEVEL - z` 변환을 제거할 때 `useImperativeHandle`의 다른 분기(레벨 없이 좌표만 이동하는 경우)까지 실수로 건드리지 않았는지 확인.
- `MapProps.defaultZoom`이 옵셔널이라 기존 호출부(값을 넘기지 않는 모든 `<Map />`, `<KakaoMap />`, `<GoogleMap />`, `<NativeMap />`)가 기존 초기 줌 그대로 동작하는지 확인 — 기본값 상수가 세 구현체에서 서로 다른 의미로 새지 않아야 한다.

---

## File Structure

```
packages/domains/src/modules/map/
  types.ts                          # MapProps.defaultZoom 추가 (표준 축, 클수록 확대)

apps/waylog-web/src/shared/components/Map/
  kakao/
    zoomLevel.utils.ts               # 신규 — zoomToKakaoLevel / kakaoLevelToZoom 순수 변환 함수
    KakaoMap.tsx                     # defaultZoom 반영, panTo 변환 적용
    useMapZoomLevel.ts                # 반환값을 표준 축으로 변환
    KakaoMap.hooks.ts                 # 변경 없음 (내부는 카카오 level 그대로 왕복)
  google/
    GoogleMap.tsx                     # defaultZoom 반영, panTo/useMapZoomLevel 반전 로직 제거
  index.tsx                           # useMapZoomLevel()의 22 - googleZoom 역변환 제거

apps/waylog-app/src/shared/components/Map/
  NativeMap.tsx                       # defaultZoom을 초기 zoomLevel로 반영

apps/waylog-web/src/features/trip/trip-route/components/RoutePath.tsx        # 부등호/기준값 재계산
apps/waylog-web/src/features/place/place-search/PlaceSearchSelectScreen.tsx  # panTo 숫자 재계산
apps/waylog-app/src/features/place/place-search/PlaceSearchSelectScreen.tsx  # panTo 숫자 재계산 (레벨 없는 호출은 그대로)
apps/waylog-app/src/features/trip/trip-community-routes/CommunityRouteDetailOverlay.tsx  # panTo 숫자 재계산
```

---

## Task 1: 공용 인터페이스에 defaultZoom 추가

**Files:**

- Modify: `packages/domains/src/modules/map/types.ts`

**Interfaces:**

- Produces: `MapProps.defaultZoom?: number` — 표준 축(0~22, 클수록 확대) 기준 초기 줌. 미지정 시 각 구현체의 기존 기본값을 유지한다.

- [ ] **Step 1: `MapProps`에 `defaultZoom` 추가**

`packages/domains/src/modules/map/types.ts`의 `MapProps` 인터페이스(15번째 줄 부근)에 추가:

```ts
export interface MapProps {
  defaultCenter?: Coordinate;
  center?: Coordinate;
  /** 초기 줌. 구글·Mapbox 축 기준(0~22, 클수록 확대) — 카카오 구현체가 내부에서 변환한다. */
  defaultZoom?: number;
  autoFocus?: AutoFocus;
  children?: ReactNode | ((props: MapRenderProps) => ReactNode);
  ref?: Ref<MapRef>;
  clustering?: boolean;
  clusterGridSize?: number;
  onBoundsChange?: (bounds: MapBounds) => void;
}
```

- [ ] **Step 2: 타입 체크로 확인**

Run: `cd apps/waylog-web && npx tsc --noEmit 2>&1 | grep -i "MapProps\|types.ts"`
Expected: 새 옵셔널 필드 추가만으로는 에러 없음 (기존 소비처는 옵셔널이라 영향 없음)

- [ ] **Step 3: 커밋**

```bash
git add packages/domains/src/modules/map/types.ts
git commit -m "feat(도메인): Map 인터페이스에 defaultZoom을 추가한다"
```

---

## Task 2: 카카오 줌 변환 유틸 작성

**Files:**

- Create: `apps/waylog-web/src/shared/components/Map/kakao/zoomLevel.utils.ts`

**Interfaces:**

- Consumes: 없음 (순수 함수)
- Produces:
  - `zoomToKakaoLevel(zoom: number): number` — 표준 zoom(클수록 확대) → 카카오 level(작을수록 확대)
  - `kakaoLevelToZoom(level: number): number` — 카카오 level → 표준 zoom
  - `KAKAO_LEVEL_MAX = 22` (export, 두 함수가 공유하는 반전 기준값)

- [ ] **Step 1: 변환 유틸 작성**

```ts
// apps/waylog-web/src/shared/components/Map/kakao/zoomLevel.utils.ts

// 카카오는 레벨이 작을수록 확대된다. 구글·Mapbox 표준(클수록 확대)과 반전 관계이며,
// 이 파일이 그 반전을 완결한다 — 카카오 밖으로 이 상수나 변환을 내보내지 않는다.
export const KAKAO_LEVEL_MAX = 22;

export function zoomToKakaoLevel(zoom: number): number {
  return KAKAO_LEVEL_MAX - zoom;
}

export function kakaoLevelToZoom(level: number): number {
  return KAKAO_LEVEL_MAX - level;
}
```

- [ ] **Step 2: 커밋**

```bash
git add apps/waylog-web/src/shared/components/Map/kakao/zoomLevel.utils.ts
git commit -m "feat(웹): 카카오 레벨과 표준 줌 축을 상호 변환하는 유틸을 추가한다"
```

---

## Task 3: KakaoMap이 표준 축을 받아 카카오 level로 변환

**Files:**

- Modify: `apps/waylog-web/src/shared/components/Map/kakao/KakaoMap.tsx`

**Interfaces:**

- Consumes: `zoomToKakaoLevel`, `kakaoLevelToZoom` from `./zoomLevel.utils`
- Produces: `KakaoMap`은 이제 `defaultZoom`(표준 축)을 받고, `MapRef.panTo`의 `level` 인자도 표준 축으로 해석한다.

- [ ] **Step 1: 초기 레벨과 panTo를 표준 축 기준으로 변환**

`KakaoMap.tsx` 수정:

```tsx
import { KakaoMapContext } from '../MapContext';
import type { MapProps } from '../types';
import { ClusterProvider } from '../useClusterRegistry';
import { KakaoMapClusterOverlays } from './cluster/KakaoMapClusterOverlays';
import { useBoundsChangeListener, useViewportFit } from './KakaoMap.hooks';
import { loadKakaoMap } from './loader';
import { useMapZoomLevel } from './useMapZoomLevel';
import { zoomToKakaoLevel } from './zoomLevel.utils';
import { DEFAULT_MAP_CENTER } from '@waylog/domains/modules/map'

const DEFAULT_ZOOM = 14; // 기존 level: 8 과 동일한 확대 정도 (22 - 14 = 8)

type Props = MapProps & Omit<BoxProps, 'ref' | 'autoFocus' | 'children'>

export default function KakaoMap({
  center,
  defaultCenter = DEFAULT_MAP_CENTER,
  defaultZoom = DEFAULT_ZOOM,
  ref,
  autoFocus = 'marker',
  clustering = false,
  clusterGridSize = 60,
  onBoundsChange,
  children,
  ...boxProps
}: Props) {
  use(loadKakaoMap());
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [map, setMap] = useState<kakao.maps.Map | null>(null);

  useEffect(() => {
    if (!container) return;
    const coordinate = center ?? defaultCenter;
    const mapInstance = new kakao.maps.Map(container, {
      center: new kakao.maps.LatLng(coordinate.lat, coordinate.lng),
      level: zoomToKakaoLevel(defaultZoom),
    });

    setMap(mapInstance);
  }, [container]);

  useEffect(() => {
    if (map != null && center != null) {
      map.setCenter(new kakao.maps.LatLng(center.lat, center.lng));
    }
  }, [map, center?.lat, center?.lng]);

  const { extend: extendBound, fit: focusBounds } = useViewportFit(map);

  useImperativeHandle(ref, () => ({
    panTo: (lat: number, lng: number, zoom?: number) => {
      if (!map) return;
      if (zoom != null) map.setLevel(zoomToKakaoLevel(zoom));
      map.panTo(new kakao.maps.LatLng(lat, lng));
    },
    relayout: () => map?.relayout(),
    focus: focusBounds,
  }), [map]);

  // ... 이하 동일
```

`Renderer` 함수의 `useMapZoomLevel()` 반환값은 Task 4에서 이미 표준 축으로 바뀌므로 이 파일에서 추가로 손댈 곳 없음.

- [ ] **Step 2: 타입 체크**

Run: `cd apps/waylog-web && npx tsc --noEmit 2>&1 | grep -i "KakaoMap"`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add apps/waylog-web/src/shared/components/Map/kakao/KakaoMap.tsx
git commit -m "fix(웹): KakaoMap이 defaultZoom과 panTo를 표준 축 기준으로 받게 한다"
```

---

## Task 4: 카카오 useMapZoomLevel이 표준 축으로 반환

**Files:**

- Modify: `apps/waylog-web/src/shared/components/Map/kakao/useMapZoomLevel.ts`

**Interfaces:**

- Consumes: `kakaoLevelToZoom` from `./zoomLevel.utils`
- Produces: `useMapZoomLevel()`은 이제 표준 축(클수록 확대) 값을 반환한다.

- [ ] **Step 1: 반환값 변환**

```ts
import { use, useEffect, useState } from "react";
import { KakaoMapContext } from "../MapContext";
import { kakaoLevelToZoom } from "./zoomLevel.utils";

type Options = {
  enabled?: boolean;
};

export function useMapZoomLevel({ enabled = true }: Options = {}) {
  const context = use(KakaoMapContext);
  const [level, setLevel] = useState(context?.map?.getLevel() ?? 8);

  useEffect(() => {
    if (!enabled || context?.map == null) return;

    setLevel(context.map.getLevel());
    const zoomHandler = () => setLevel(context.map!.getLevel());
    kakao.maps.event.addListener(context.map, "zoom_changed", zoomHandler);

    return () => {
      kakao.maps.event.removeListener(
        context.map!,
        "zoom_changed",
        zoomHandler,
      );
    };
  }, [enabled, context?.map]);

  return kakaoLevelToZoom(level);
}
```

- [ ] **Step 2: 커밋**

```bash
git add apps/waylog-web/src/shared/components/Map/kakao/useMapZoomLevel.ts
git commit -m "fix(웹): 카카오 useMapZoomLevel이 표준 축 값을 반환하게 한다"
```

---

## Task 5: GoogleMap의 반전 로직 제거 (이미 표준 축)ㅌ

**Files:**

- Modify: `apps/waylog-web/src/shared/components/Map/google/GoogleMap.tsx`
- Modify: `apps/waylog-web/src/shared/components/Map/index.tsx`

**Interfaces:**

- Consumes: `MapProps.defaultZoom`
- Produces: `GoogleMap`이 `defaultZoom`을 그대로 초기 `zoom`으로 쓰고, `panTo`도 변환 없이 그대로 `setZoom`한다. 공용 `useMapZoomLevel()`(index.tsx)도 구글 쪽 역변환을 제거한다.

- [ ] **Step 1: GoogleMap.tsx에서 defaultZoom 반영 및 변환 제거**

```tsx
import { Box, type BoxProps } from "@mui/material";
import {
  Suspense,
  use,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_MAP_CENTER,
  pastelMapStyle,
} from "@waylog/domains/modules/map";
import { GoogleMapContext } from "../MapContext";
import type { MapProps } from "../types";
import { ClusterProvider } from "../useClusterRegistry";
import { GoogleMapClusterOverlays } from "./cluster/GoogleMapClusterOverlays";
import { useBoundsChangeListener, useViewportFit } from "./GoogleMap.hooks";
import { loadGoogleMaps } from "./loader";
import { useMapZoomLevel } from "./useMapZoomLevel";

const DEFAULT_ZOOM = 10;

type Props = MapProps & Omit<BoxProps, "ref" | "autoFocus" | "children">;

export function preload() {
  loadGoogleMaps();
}

export default function GoogleMap({
  center,
  defaultCenter = DEFAULT_MAP_CENTER,
  defaultZoom = DEFAULT_ZOOM,
  ref,
  autoFocus = "marker",
  clustering = false,
  clusterGridSize = 60,
  onBoundsChange,
  children,
  ...boxProps
}: Props) {
  use(loadGoogleMaps());
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  useEffect(() => {
    if (!container) return;
    setMap(
      new google.maps.Map(container, {
        center: center ?? defaultCenter,
        zoom: defaultZoom,
        disableDefaultUI: true,
        styles: pastelMapStyle,
      }),
    );
  }, [container]);

  useEffect(() => {
    if (center != null) map?.setCenter(center);
  }, [map, center?.lat, center?.lng]);

  const { extend: extendBound, fit: focusBounds } = useViewportFit(map);

  useImperativeHandle(
    ref,
    () => ({
      panTo: (lat: number, lng: number, zoom?: number) => {
        if (!map) return;
        map.panTo({ lat, lng });
        if (zoom != null) map.setZoom(zoom);
      },
      relayout: () => {
        if (!map) return;
        google.maps.event.trigger(map, "resize");
      },
      focus: focusBounds,
    }),
    [map, focusBounds],
  );

  const mapContextValue = useMemo(
    () => ({
      map,
      extendBound,
      config: { autoFocus, clustering, gridSize: clusterGridSize },
    }),
    [map, extendBound, autoFocus, clustering, clusterGridSize],
  );

  useBoundsChangeListener(map, onBoundsChange);

  return (
    <GoogleMapContext.Provider value={mapContextValue}>
      <Box ref={setContainer} position="relative" {...boxProps} />
      <Suspense>
        <ClusterProvider>
          <Resolved>{children}</Resolved>
          {clustering && (
            <GoogleMapClusterOverlays gridSize={clusterGridSize} />
          )}
        </ClusterProvider>
      </Suspense>
    </GoogleMapContext.Provider>
  );
}

function Resolved({ children }: Props) {
  const zoom = useMapZoomLevel();

  if (typeof children === "function") return children({ zoom });
  return children;
}
```

`ZOOM_MAX_LEVEL` 상수는 더 이상 쓰이지 않으므로 제거한다.

- [ ] **Step 2: index.tsx의 useMapZoomLevel 역변환 제거**

`apps/waylog-web/src/shared/components/Map/index.tsx`의 118~127번째 줄:

```tsx
export function useMapZoomLevel() {
  const type = use(MapTypeContext);

  const googleZoom = useGoogleMapZoomLevel({ enabled: type === "google" });
  const kakaoZoom = useKakaoMapZoomLevel({ enabled: type === "kakao" });

  if (type === "google") return googleZoom;
  return kakaoZoom;
}
```

`GOOGLE_MAX_SCALE_DOWN_LEVEL` 상수는 더 이상 쓰이지 않으므로 제거한다.

- [ ] **Step 3: 타입 체크**

Run: `cd apps/waylog-web && npx tsc --noEmit 2>&1 | grep -i "GoogleMap\|shared/components/Map/index"`
Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add apps/waylog-web/src/shared/components/Map/google/GoogleMap.tsx apps/waylog-web/src/shared/components/Map/index.tsx
git commit -m "refactor(웹): GoogleMap이 이미 표준 축이므로 반전 변환을 제거한다"
```

---

## Task 6: NativeMap(Mapbox)에 defaultZoom 반영

**Files:**

- Modify: `apps/waylog-app/src/shared/components/Map/NativeMap.tsx`

**Interfaces:**

- Consumes: `MapProps.defaultZoom`
- Produces: `NativeMap`은 `defaultZoom`을 초기 카메라 `zoomLevel`과 초기 `zoom` 상태로 사용한다. Mapbox는 이미 표준 축이므로 변환 없이 그대로 사용.

- [ ] **Step 1: defaultZoom을 초기 zoom으로 사용**

`NativeMap.tsx`에서 `deltaToZoom(DEFAULT_DELTA)`로 계산하던 초기 줌을 `defaultZoom` prop으로 대체한다:

```tsx
import {
  DEFAULT_MAP_CENTER,
  pastelMapboxStyle,
  type MapProps,
  type MapRef,
} from "@waylog/domains/modules/map";
import {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  StyleSheet,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Mapbox from "@rnmapbox/maps";
import { MapContext } from "./MapContext";
import { NativeMapCluster } from "./NativeMapCluster";
import { useBatchedCallback } from "../../hooks/useBatchedCallback";
import {
  MapMarkerRegistryProvider,
  useRegisteredMapMarkers,
} from "./useMapMarkerRegistry";
import { computeMarkerVisibility } from "./useMapMarkerRegistry.utils";
import { useMapCamera } from "./useMapCamera";
import { useClusterTransition } from "./useClusterTransition";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "");

const VIEWPORT_PADDING_RATIO = 0.4;
const CLUSTER_TAP_PADDING = 50;
const CLUSTER_TAP_DURATION = 500;
const DEFAULT_ZOOM = 14; // 웹 KakaoMap 기본값(defaultZoom=14, 카카오 level 8 상당)과 동일한 확대 정도

export function NativeMap(props: MapProps & { style?: StyleProp<ViewStyle> }) {
  return (
    <MapMarkerRegistryProvider>
      <NativeMapInner {...props} />
    </MapMarkerRegistryProvider>
  );
}

function NativeMapInner({
  autoFocus = "marker",
  defaultCenter,
  center,
  defaultZoom = DEFAULT_ZOOM,
  children,
  ref,
  clustering,
  clusterGridSize = 50,
  onBoundsChange,
  style,
}: MapProps & { style?: StyleProp<ViewStyle> }) {
  const [zoom, setZoom] = useState(defaultZoom);
  const { width: screenWidth } = useWindowDimensions();

  const {
    camera,
    ref: cameraRef,
    fitTo,
    fitToViewport,
    panTo,
    track,
  } = useMapCamera({
    screenWidth,
    onApply: onBoundsChange,
  });

  useImperativeHandle<MapRef, MapRef>(
    ref as never,
    () => ({
      panTo: (lat, lng, zoom) => panTo({ lat, lng }, zoom),
      relayout: () => {},
      focus: () => {},
    }),
    [panTo],
  );

  const initial = center ?? defaultCenter ?? DEFAULT_MAP_CENTER;
  const rendered =
    typeof children === "function" ? children({ zoom }) : children;

  const { markers } = useRegisteredMapMarkers();

  const boundsRef = useRef<{ lat: number; lng: number }[]>([]);
  const extendBound = useBatchedCallback<{ lat: number; lng: number }>(
    (coords) => {
      boundsRef.current.push(...coords);
      fitToViewport(boundsRef.current);
    },
    { once: true },
  );

  const { visibleMarkerIds, clusters } = useMemo(
    () =>
      computeMarkerVisibility({
        markers,
        camera,
        clustering: clustering === true,
        clusterGridSize,
        paddingRatio: VIEWPORT_PADDING_RATIO,
      }),
    [markers, camera, clustering, clusterGridSize],
  );

  const transitioningClusters = useClusterTransition(clusters);

  const mapContextValue = useMemo(
    () => ({ extendBound, config: { autoFocus }, visibleMarkerIds, zoom }),
    [extendBound, autoFocus, visibleMarkerIds, zoom],
  );

  return (
    <MapContext value={mapContextValue}>
      <Mapbox.MapView
        style={[StyleSheet.absoluteFill, style]}
        styleJSON={JSON.stringify(pastelMapboxStyle)}
        rotateEnabled={false}
        onCameraChanged={(state) => {
          const nextZoom = Math.round(state.properties.zoom);
          setZoom((current) => (nextZoom === current ? current : nextZoom));

          track(state);
        }}
      >
        <Mapbox.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: initial ? [initial.lng, initial.lat] : undefined,
            zoomLevel: defaultZoom,
          }}
        />
        {rendered as ReactNode}
        {transitioningClusters.map(
          ({ cluster, destination, isLeaving, origin }) =>
            cluster.markers.length > 1 ? (
              <NativeMapCluster
                key={cluster.id}
                latitude={cluster.center.lat}
                longitude={cluster.center.lng}
                count={cluster.markers.length}
                leavingTo={isLeaving ? destination : undefined}
                emergingFrom={origin}
                onTap={
                  isLeaving
                    ? undefined
                    : () =>
                        fitTo(
                          cluster.markers.map((marker) => marker.position),
                          {
                            padding: CLUSTER_TAP_PADDING,
                            duration: CLUSTER_TAP_DURATION,
                          },
                        )
                }
              />
            ) : null,
        )}
      </Mapbox.MapView>
    </MapContext>
  );
}
```

`DEFAULT_DELTA`, `deltaToZoom` import는 더 이상 이 파일에서 쓰지 않으므로 제거한다 (다른 파일에서 여전히 쓰이므로 `NativeMap.utils.ts`에서 export 자체는 유지).

- [ ] **Step 2: 타입 체크**

Run: `cd apps/waylog-app && npx tsc --noEmit 2>&1 | grep -i "NativeMap.tsx"`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add apps/waylog-app/src/shared/components/Map/NativeMap.tsx
git commit -m "feat(앱): NativeMap이 defaultZoom을 초기 줌으로 사용하게 한다"
```

---

## Task 7: useCameraControl의 panTo가 표준 축을 그대로 사용

**Files:**

- Modify: `apps/waylog-app/src/shared/components/Map/useCameraControl.ts`

**Interfaces:**

- Consumes: 없음
- Produces: `panTo(center, zoom?)`의 `zoom`은 이제 표준 축(0~22, 클수록 확대) 그대로 `zoomLevel`에 쓰인다. 기존처럼 `levelToDelta`/`deltaToZoom`을 거치지 않는다.

- [ ] **Step 1: panTo에서 변환 제거**

```ts
import { useEffect, useRef } from "react";
import { usePreservedCallback } from "@waylog/react";
import type Mapbox from "@rnmapbox/maps";
import type { Coordinate } from "@waylog/domains/modules/map";
import {
  toFitBounds,
  toViewportBounds,
  type FitBounds,
} from "./NativeMap.utils";

const FIT_PADDING = 60;
const FIT_DURATION = 0;
const PAN_DURATION = 300;

interface FitOptions {
  padding?: number;
  duration?: number;
}

interface Params {
  onMoveStart: () => void;
  onMoveEnd: () => void;
}

export function useCameraControl({ onMoveStart, onMoveEnd }: Params) {
  const ref = useRef<Mapbox.Camera>(null);
  const moveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notifyMoveStart = usePreservedCallback(onMoveStart);
  const notifyMoveEnd = usePreservedCallback(onMoveEnd);

  const startMove = (move: () => void, duration: number) => {
    notifyMoveStart();
    move();

    if (moveTimerRef.current != null) clearTimeout(moveTimerRef.current);
    moveTimerRef.current = setTimeout(() => {
      moveTimerRef.current = null;
      notifyMoveEnd();
    }, duration);
  };

  const moveToBounds = (
    bounds: FitBounds | null,
    { padding = FIT_PADDING, duration = FIT_DURATION }: FitOptions,
  ) => {
    if (bounds == null) return;

    startMove(
      () =>
        ref.current?.setCamera({
          bounds: {
            ne: bounds.ne,
            sw: bounds.sw,
            paddingTop: padding,
            paddingBottom: padding,
            paddingLeft: padding,
            paddingRight: padding,
          },
          animationMode: duration === 0 ? "none" : "easeTo",
          animationDuration: duration,
        }),
      duration,
    );
  };

  const fitTo = usePreservedCallback(
    (coordinates: Coordinate[], options: FitOptions = {}) => {
      moveToBounds(toFitBounds(coordinates), options);
    },
  );

  const fitToViewport = usePreservedCallback(
    (coordinates: Coordinate[], options: FitOptions = {}) => {
      moveToBounds(toViewportBounds(coordinates), options);
    },
  );

  // 웹과 같이 zoom 을 준 호출만 축척을 바꾼다. 생략하면 현재 축척을 유지한 채
  // 중심만 옮긴다 — 목록에서 항목을 고르는 것은 확대 요청이 아니다.
  const panTo = usePreservedCallback((center: Coordinate, zoom?: number) => {
    startMove(
      () =>
        ref.current?.setCamera({
          centerCoordinate: [center.lng, center.lat],
          ...(zoom == null ? {} : { zoomLevel: zoom }),
          animationDuration: PAN_DURATION,
        }),
      PAN_DURATION,
    );
  });

  const isMoving = usePreservedCallback(() => moveTimerRef.current != null);

  useEffect(
    () => () => {
      if (moveTimerRef.current != null) clearTimeout(moveTimerRef.current);
    },
    [],
  );

  return { ref, fitTo, fitToViewport, panTo, isMoving };
}
```

`levelToDelta` import 제거.

- [ ] **Step 2: 타입 체크**

Run: `cd apps/waylog-app && npx tsc --noEmit 2>&1 | grep -i "useCameraControl"`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add apps/waylog-app/src/shared/components/Map/useCameraControl.ts
git commit -m "refactor(앱): panTo가 카카오 레벨 변환 없이 표준 축 zoom을 그대로 쓰게 한다"
```

---

## Task 8: 소비 코드의 줌 값 재계산 — RoutePath (웹)

**Files:**

- Modify: `apps/waylog-web/src/features/trip/trip-route/components/RoutePath.tsx`

**Interfaces:**

- Consumes: `useMapZoomLevel()` (Task 4에서 표준 축으로 변경됨)

- [ ] **Step 1: 부등호와 기준값 재계산**

기존 `zoomLevel < 10`은 "카카오 레벨이 10보다 작다(확대된 상태)"는 뜻이었다. 표준 축에서 카카오 레벨 10은 `kakaoLevelToZoom(10) = 22 - 10 = 12`에 대응한다. "확대된 상태"는 표준 축에서 값이 클 때이므로 부등호도 반전한다:

```tsx
import { Map } from "~shared/components/Map";
import type { Coordinate } from "~shared/components/Map/types";
import { formatDuration } from "@waylog/utility";
import { useRoadRoute } from "~features/route/road-route/useRoadRoute";
import { TransportTypeLabel } from "@waylog/domains/modules/transport";
import { useMapZoomLevel } from "~shared/components/Map";
import { useTripViewConfigValue } from "../useTripViewConfig";

interface RoutePathProps {
  waypoints: Coordinate[];
  color: string;
  isSelected: boolean;
}

const SCALED_UP_ZOOM_THRESHOLD = 12; // 기존 카카오 level < 10 과 동일한 확대 정도

export function RoutePath({ waypoints, color, isSelected }: RoutePathProps) {
  const {
    data: { legs },
  } = useRoadRoute({ waypoints, suspense: false });
  const { isVisibleRouteLegs } = useTripViewConfigValue();

  const zoom = useMapZoomLevel();
  const isScaledUpViewport = zoom > SCALED_UP_ZOOM_THRESHOLD;
  const isVisibleLegLabel =
    isVisibleRouteLegs && isSelected && isScaledUpViewport;

  if (legs.length === 0) return null;

  return (
    <Map.Polyline
      strokeColor={color}
      strokeWeight={isSelected ? 5 : 3}
      strokeOpacity={isSelected ? 1 : 0.6}
    >
      {legs.map((leg, index) => (
        <Map.Polyline.Line
          key={index}
          coordinates={leg.coordinates}
          label={
            isVisibleLegLabel
              ? `${index + 1}. ${TransportTypeLabel[leg.transport]} ${formatDuration(leg.duration)}`
              : undefined
          }
        />
      ))}
    </Map.Polyline>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add apps/waylog-web/src/features/trip/trip-route/components/RoutePath.tsx
git commit -m "fix(웹): RoutePath의 줌 분기를 표준 축 기준으로 재계산한다"
```

---

## Task 9: 소비 코드의 줌 값 재계산 — PlaceSearchSelectScreen (웹)

**Files:**

- Modify: `apps/waylog-web/src/features/place/place-search/PlaceSearchSelectScreen.tsx`

- [ ] **Step 1: panTo 호출 두 곳의 숫자를 표준 축으로 재계산**

기존 `panTo(lat, lng, 2)`는 카카오 레벨 2(매우 확대)였다. 표준 축에서는 `22 - 2 = 20`.

`PlaceSearchSelectScreen.tsx`의 58번째 줄과 144번째 줄:

```tsx
const FOCUS_ZOOM = 20; // 기존 카카오 level 2 와 동일한 확대 정도

// ...
useEffect(() => {
  const [result] = results;
  if (result) {
    mapRef.current?.panTo(result.lat, result.lng, FOCUS_ZOOM);
  }
}, [keyword])

// ...
onClick={() => mapRef.current?.panTo(x.lat, x.lng, FOCUS_ZOOM)}
```

- [ ] **Step 2: 커밋**

```bash
git add apps/waylog-web/src/features/place/place-search/PlaceSearchSelectScreen.tsx
git commit -m "fix(웹): 장소 검색 화면의 panTo 줌 값을 표준 축 기준으로 재계산한다"
```

---

## Task 10: 소비 코드의 줌 값 재계산 — PlaceSearchSelectScreen (앱)

**Files:**

- Modify: `apps/waylog-app/src/features/place/place-search/PlaceSearchSelectScreen.tsx`

- [ ] **Step 1: panTo 호출의 숫자를 표준 축으로 재계산**

기존 `panTo(result.lat, result.lng, 2)`는 `useCameraControl.ts`(Task 7 변경 전)의 `levelToDelta(2)` → `deltaToZoom(...)` 변환을 거쳐 Mapbox zoomLevel ≈ 15로 적용되고 있었다. Task 7 이후 이 변환이 사라지므로, 동일한 확대 정도를 유지하려면 zoomLevel 값을 직접 넘겨야 한다:

```tsx
const FOCUS_ZOOM = 15; // 기존 카카오 level 2가 변환되던 Mapbox zoomLevel과 동일한 확대 정도

// ...
useDidUpdate(() => {
  const [result] = results;
  if (result) {
    mapRef.current?.panTo(result.lat, result.lng, FOCUS_ZOOM);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [keyword]);
```

`focusFromList`의 `mapRef.current?.panTo(place.lat, place.lng)`는 zoom 인자가 없어 축척을 유지하는 호출이므로 변경하지 않는다.

- [ ] **Step 2: 커밋**

```bash
git add apps/waylog-app/src/features/place/place-search/PlaceSearchSelectScreen.tsx
git commit -m "fix(앱): 장소 검색 화면의 panTo 줌 값을 표준 축 기준으로 재계산한다"
```

---

## Task 11: 소비 코드의 줌 값 재계산 — CommunityRouteDetailOverlay (앱)

**Files:**

- Modify: `apps/waylog-app/src/features/trip/trip-community-routes/CommunityRouteDetailOverlay.tsx`

- [ ] **Step 1: panTo 호출의 숫자를 표준 축으로 재계산**

기존 `panTo(place.lat, place.lng, 5)`는 `levelToDelta(5)` → `deltaToZoom(...)` 변환으로 Mapbox zoomLevel ≈ 13에 대응했다:

```tsx
const FOCUS_ZOOM = 13; // 기존 카카오 level 5가 변환되던 Mapbox zoomLevel과 동일한 확대 정도

// ...
onPress={() => mapRef.current?.panTo(place.lat, place.lng, FOCUS_ZOOM)}
```

- [ ] **Step 2: 커밋**

```bash
git add apps/waylog-app/src/features/trip/trip-community-routes/CommunityRouteDetailOverlay.tsx
git commit -m "fix(앱): 커뮤니티 경로 상세의 panTo 줌 값을 표준 축 기준으로 재계산한다"
```

---

## Task 12: 최종 빌드 및 실기기/브라우저 확인

**Files:** 없음 (검증 전용)

- [ ] **Step 1: 웹 타입 체크 전체**

Run: `cd apps/waylog-web && npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 2: 앱 타입 체크 전체**

Run: `cd apps/waylog-app && npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: 도메인 패키지 테스트**

Run: `cd packages/domains && pnpm test`
Expected: 기존 테스트 전부 PASS (변경 대상 아님)

- [ ] **Step 4: 웹 브라우저 확인**

웹 개발 서버를 실행하고 여행 상세 페이지(경로 탭)에서:

- 카카오 지도: 확대/축소 시 `RoutePath`의 구간 라벨이 이전과 동일한 확대 수준에서 나타나는지 확인
- 구글 지도로 전환 후 동일 확인
- 장소 검색 화면에서 검색 결과 선택 시 지도가 이전과 동일하게 확대되는지 카카오·구글 각각 확인

- [ ] **Step 5: 앱 실기기/시뮬레이터 확인**

Expo 앱을 실행하고:

- 장소 검색 화면에서 검색 결과 선택 시 확대 정도 확인
- 커뮤니티 경로 상세에서 장소 탭 시 확대 정도 확인
- 지도 최초 진입 시 초기 줌이 기존과 동일한 범위인지 확인

- [ ] **Step 6: 문서 업데이트**

`docs/codebase.md`에 Map 인터페이스의 줌 축 규칙(표준: 클수록 확대, 카카오만 내부에서 반전)을 반영한다. 파일 위치·의존 방향이 문서와 어긋나지 않는지 함께 확인 후 커밋:

```bash
git add docs/codebase.md
git commit -m "docs(전체): Map 줌 값의 표준 축과 카카오 변환 규칙을 codebase.md에 반영한다"
```
