# 리팩토링 사례

지도(`shared/components/Map`) 모듈을 정리하며 도출한 리팩토링 사례 모음.
provider(Google/Kakao) 분기 구조에서 중복을 어떻게 추상화했는지, 어떤 후보를 왜 버렸는지를 기록한다.

핵심 원칙으로 반복 등장하는 것:

- **provider 간(Google↔Kakao)은 합치지 않는다.** SDK 생명주기가 본질적으로 달라 새는 추상화가 된다.
- **provider 내부(컴포넌트↔클러스터)의 중복은 합친다.** 같은 SDK를 두 번 쓰는 진짜 중복이다.
- **순수 로직과 SDK 의존을 가르고, 차이나는 한 조각만 주입한다.**

---

## 1. 마커 콘텐츠 생성과 DOM 조립을 계층으로 분리

### 문제 정의 및 개선 아이디어

같은 provider 안에서 마커를 그리는 코드가 **컴포넌트(`*MapMarker`)** 와 **클러스터(`cluster.utils`)** 두 곳에 중복돼 있었다.
특히 썸네일 마커는 `document.createElement` → `innerHTML` → `addEventListener` 절차가 거의 글자까지 동일하게 두 벌 존재했다.

더 나쁜 건, 콘텐츠 문자열을 만드는 헬퍼(`createThumbnailContent`)가 이미 있는데도 **클러스터 쪽이 이를 호출하지 않고 SVG/HTML을 인라인으로 베껴 써서**, 마커 크기·라벨 offset이 컴포넌트와 미묘하게 달라져 있었다(버그가 갈라져 자람).

개선 아이디어: 마커 그리기를 **세 계층으로 분리**한다.

| 계층 | 책임 | 예시 |
| --- | --- | --- |
| 콘텐츠 | 렌더링용 문자열 생성 | `createThumbnailContent`, `createMarkerSvg` |
| DOM 노드 | 문자열 → 이벤트 바인딩된 DOM 노드 | `createThumbnailMarkerNode` |
| 마운트 | 노드를 지도에 올리고 정리 함수 반환 | (다음 사례의 `createPositionedOverlay`) |

### 이전 → 이후

```ts
// 이전 — 컴포넌트와 클러스터가 각각 인라인으로 DOM 조립
const el = document.createElement('div');
el.innerHTML = createThumbnailContent(thumbnailUrl, color);
el.style.cssText = '...';
el.addEventListener('click', handleClick);
// ...cleanup에서 removeEventListener 직접...
```

```ts
// 이후 — DOM 조립을 빌더 하나로, 정리 핸들까지 반환
export function createThumbnailMarkerNode({ thumbnailUrl, color, onClick, onContextMenu }): MarkerElement {
  const node = document.createElement('div');
  node.innerHTML = createThumbnailContent(thumbnailUrl, color);
  const cleanups: VoidFunction[] = [];
  if (onClick) {
    node.addEventListener('click', onClick);
    cleanups.push(() => node.removeEventListener('click', onClick));
  }
  return { node, destroy: () => cleanups.forEach(c => c()) };
}
```

빌더는 **DOM 조립까지만** 책임지고, overlay 마운트(`OverlayView`/`CustomOverlay`)는 호출부에 남긴다.
이 선을 넘어 마운트까지 빌더에 넣으려는 순간 provider SDK 차이가 새어 들어온다.

### 채택되지 않은 후보

- **콘텐츠 헬퍼까지 새로 설계** → 불필요. 헬퍼는 이미 존재했고, 클러스터가 호출만 하게 고치면 끝이었다. 인라인 우회를 헬퍼 호출로 바꾸자 크기·offset 불일치 버그도 함께 사라졌다.
- **provider 간(Google↔Kakao) DOM 빌더 통합** → 거부. 썸네일 node 조립은 닮았지만, 마운트가 `OverlayView`(클래스 상속) vs `CustomOverlay`(생성자 옵션)로 갈려 공통 베이스를 만들면 깨진다.

---

## 2. OverlayView 확장 클래스를 팩토리로 추출

### 문제 정의 및 개선 아이디어

Google 쪽에서 `class extends google.maps.OverlayView`가 **함수·컴포넌트 내부에 6벌** 흩어져 있었다(썸네일·라벨·툴팁·클러스터 핀 등).
전부 "node를 좌표에 고정하고 `draw`에서 위치를 갱신"하는 동일 패턴인데, `pane`(표시 레이어)과 `offsetY`만 달랐다.

클래스를 모듈 최상단으로 끌어올릴 수 없는 제약이 있었다 — `google.maps.OverlayView`는 **런타임에 SDK가 로드된 뒤에만** 존재하므로, 최상단 `class extends`는 import 시점에 터진다.

개선 아이디어: 클래스 선언을 **팩토리 함수 본문 안**에 두어(호출 시점 = SDK 로드 후) 모듈 레벨에 export하고, 클로저로 잡던 값(`node`, `position`, `pane`, `offsetY`)은 인자로 받는다.

### 이전 → 이후

```ts
// 이전 — 호출 지점마다 OverlayView 클래스 재정의 (6벌)
class ThumbnailOverlay extends google.maps.OverlayView {
  onAdd() { this.getPanes()?.overlayMouseTarget.appendChild(node); }
  draw() { /* fromLatLngToDivPixel → node.style.left/top */ }
  onRemove() { node.parentNode?.removeChild(node); }
}
const overlay = new ThumbnailOverlay();
```

```ts
// 이후 — 팩토리 하나, 차이는 인자로
export function createPositionedOverlay({ node, position, pane, offsetY = 0 }) {
  class PositionedOverlay extends google.maps.OverlayView { /* 단일 구현 */ }
  return new PositionedOverlay();
}

const overlay = createPositionedOverlay({ node, position: { lat, lng }, pane: 'overlayMouseTarget', offsetY: -8 });
```

라벨/툴팁의 `onAdd`에서 div를 만들던 부분은 **node를 호출부에서 만들어 넘기는 방식**(`createLabelNode`/`createTooltipNode`)으로 바꿔 같은 팩토리로 수렴시켰다.

### 채택되지 않은 후보

- **클래스 선언을 모듈 top-level로 이동** → 거부. `google` 전역 미로드 시점에 터진다. 반드시 "팩토리 함수 본문에 선언"이어야 한다.
- **provider 공통 오버레이 추상화** → 거부. Kakao는 `OverlayView`가 없고 `CustomOverlay`라 시그니처만 닮았을 뿐 구현이 다르다. 팩토리는 Google 내부에만 둔다.

---

## 3. 클러스터 그룹핑 알고리즘을 ToPixel 주입으로 통합

### 문제 정의 및 개선 아이디어

Google/Kakao의 `createClusters`가 **그룹핑 루프는 완전히 동일**한데 파일만 따로였다.
유일한 차이는 "좌표 → 픽셀" 변환 한 조각이었다.

- Google: Web Mercator 직접 계산(`latLngToPixel(coord, zoom)`)
- Kakao: SDK projection(`map.getProjection().pointFromCoords(...)`)

개선 아이디어: 그룹핑 알고리즘을 provider 무관 순수 함수로 빼고(`cluster.core.ts`), **차이나는 변환 함수만 주입**한다. 거창한 추상 레이어가 아니라 함수 하나(`ToPixel`)면 충분했다.

부수적으로 `Cluster.center` 타입을 통일했다. Kakao는 center가 `kakao.maps.LatLng`(SDK 객체)였는데, **데이터 구조에 SDK 객체가 박혀 있는 것이 비정상**이라 plain `Coordinate`로 낮추고, `LatLng` 래핑은 소비 시점(overlay 마운트)으로 미뤘다.

### 이전 → 이후

```ts
// 이전 — provider별로 그룹핑 루프 전체가 중복 (~35줄씩)
//   Google: createClusters(markers, zoom, gridSize)
//   Kakao:  createClusters(markers, map, gridSize)  + center: kakao.maps.LatLng
```

```ts
// 이후 — 그룹핑은 공통, 변환만 주입
// cluster.core.ts
export function clusterMarkers(markers, toPixel: ToPixel, gridSize): Cluster[] { /* 그룹핑 */ }

// google
clusterMarkers(markers, coord => latLngToPixel(coord, zoom), gridSize);
// kakao
clusterMarkers(markers, coord => projection.pointFromCoords(new kakao.maps.LatLng(coord.lat, coord.lng)), gridSize);
```

### 채택되지 않은 후보

- **클래스/인터페이스 계층의 추상 레이어** → 과설계. 차이가 함수 하나뿐이라 DI 한 개로 족했다.
- **`center`를 SDK 객체로 유지** → 거부. 공통 모듈이 특정 provider 타입에 의존하게 된다. plain 값으로 통일하는 게 모듈 경계상 옳다.

---

## 4. 클러스터 entry 재조정 로직을 공통 훅으로

### 문제 정의 및 개선 아이디어

`*MapClusterOverlays`의 useEffect가 양 provider에서 거의 글자까지 동일했다 —
"id 기준으로 사라진 클러스터는 정리하고, 새 클러스터만 생성, 언마운트 시 전체 정리".
차이는 `buildEntry` 호출 방식뿐이었다.

개선 아이디어: 재조정 알고리즘을 `useReconcileClusterEntries(clusters, renderCluster)` 훅으로 빼고, **클러스터를 어떻게 그리는지는 콜백으로 주입**한다.

이 과정에서 entry 모델도 단순화했다. 처음엔 `{ overlays, markers, cleanups }` 객체로 모았다가, **렌더 함수가 cleanup 함수(`() => void`)를 직접 반환**하는 형태로 바꿨다. 정리란 결국 "그릴 때 만든 것들을 되돌리는 일" 하나이므로, 묶음 객체보다 클로저 하나가 명확하다.

### 이전 → 이후

```ts
// 이전 — 양 provider에 동일한 재조정 useEffect + entriesRef 보일러플레이트
useEffect(() => {
  for (const [id, entry] of entriesRef.current) { if (!next.has(id)) { destroyEntry(entry); ... } }
  for (const [id, cluster] of next) { if (!entriesRef.current.has(id)) entriesRef.current.set(id, buildEntry(...)); }
}, [clusters]);
```

```ts
// 이후 — 훅 한 줄, 렌더는 주입
useReconcileClusterEntries(
  clusters,
  cluster => renderCluster({ cluster, map, onClick: handleClick }),
);

// 렌더 함수는 cleanup을 반환
function renderClusterGroupEntry(...): VoidFunction {
  // ...overlay.setMap(map)...
  return () => { overlay.setMap(null); content.removeEventListener('click', handler); };
}
```

### 채택되지 않은 후보

- **`ClusterEntry { overlays, markers, cleanups }` 묶음 유지** → 단순화로 폐기. SDK 타입(`OverlayView[]` vs `CustomOverlay[]`)이 달라 공통화가 번거로웠고, 결국 전부 `setMap(null)` 한 번이라 cleanup 클로저로 통일하는 게 깔끔했다.

---

## 5. 마커 렌더링 통합 — 컴포넌트는 어댑터, 렌더는 명령형 단일 진실

### 문제 정의 및 개선 아이디어

같은 provider 안에서 마커 그리기가 여전히 두 갈래였다.

- 컴포넌트(`*MapMarker`): React 선언형(`useMemo`/`useEffect`, 서브컴포넌트 `Marker`/`ThumbnailMarker`)
- 클러스터(`cluster.utils`): 명령형 `renderSingleMarker`

둘은 같은 일(썸네일/일반/라벨/툴팁 그리기)을 하면서 미묘하게 달랐다(클러스터 마커엔 툴팁·zoom 반응이 없었다).

개선 아이디어: 명령형 `renderMarker(md, map[, zoom])`를 **단일 진실**로 두고,
**컴포넌트는 `MarkerProps`(외부 인터페이스) → `MarkerData`(내부 구조)를 변환하는 어댑터** 역할만 한 뒤 effect로 호출한다.

핵심 경계: `lat`/`lng` 평면을 받는 `MarkerProps`는 **외부 인터페이스**, `position` 객체를 쓰는 `MarkerData`는 **내부 데이터 구조**다. 이 변환 책임을 컴포넌트가 가져간다.

### 이전 → 이후

```tsx
// 이전 — 컴포넌트가 선언형으로 직접 렌더 (Marker/ThumbnailMarker 서브컴포넌트)
if (props.thumbnailUrl) return <ThumbnailMarker {...props} />;
return <Marker {...props} />;
```

```tsx
// 이후 — 컴포넌트는 어댑터 + effect 호출만
function toMarkerData(props: MarkerProps): Omit<MarkerData, 'id'> {
  return { ...props, position: { lat: props.lat, lng: props.lng }, onClick: () => props.onClick?.(props), ... };
}

export default function KakaoMapMarker(props: MarkerProps) {
  const markerData = toMarkerData(props);
  useEffect(() => {
    if (config.clustering || map == null) return;
    return renderMarker(markerData, map, zoom);
  }, [config.clustering, map, zoom, ...Object.values(omit(props, ['onClick', 'onContextMenu']))]);
  return null;
}
```

클러스터의 단일 마커도 `renderMarker`를 경유하게 되어, **툴팁·라벨·zoom 반응을 자동으로 얻는** 부수 개선이 따라왔다.

### 채택되지 않은 후보

- **`renderMarker`가 `MarkerData`(id 포함)를 받게** → 거부. 컴포넌트엔 id가 없어 `id: ''` 가짜 값을 끼워야 했다. 렌더는 id를 안 쓰므로 입력을 `Omit<MarkerData, 'id'>`로 낮춰 가짜 값을 없앴다.
- **컴포넌트가 `MarkerProps`를 그대로 renderMarker에 전달** → 거부. 외부 인터페이스(`lat/lng`)와 내부 구조(`position`)의 경계가 무너진다. 어댑터로 분리해야 양쪽이 독립적으로 변할 수 있다.
- **effect deps를 props 원시값으로 수동 나열** → 개선됨. prop 추가 시 빠뜨리기 쉬워, `omit(props, [함수 prop])`으로 자동 생성하도록 바꿨다(함수 prop은 매 렌더 새 참조라 제외).

### 부수 결정 — export 최소화

통합 후 `marker.renderers`에서 외부에 필요한 것은 `renderMarker`와 그룹 핀용 함수뿐이었다.
나머지(콘텐츠/노드 생성 헬퍼)는 전부 내부 호출로만 쓰여 `export`를 제거했고, 아무도 안 쓰던 함수(`nomalizeBound` 등)는 삭제했다.
파일명도 역할에 맞게 `*Map.utils.ts → marker.renderers.tsx`로 바꿨다.

---

## 6. 디버깅 사례 — "통합으로 드러난 회귀가 아니라, 원래 있던 버그"

리팩토링 중 발견·수정한 버그들. 공통 교훈은 **"증상이 통합 지점에 보여도 원인은 다른 곳일 수 있다 — 회귀 커밋부터 이분 탐색으로 특정한다"**.

### 6-1. 줌·드래그 시 지도가 겹쳐 렌더링

- **증상**: 줌/드래그할 때마다 이전 지도 타일 위에 새 지도가 겹침.
- **원인**: 맵 컨테이너를 `state(callback ref)` → `useRef`로 바꾸면서, callback ref가 DOM 생명주기와 맵 생성을 묶어주던 효과를 잃었다. `[]` deps 맵 생성 effect가 같은 컨테이너에 맵을 중복 생성.
- **수정**: 컨테이너를 다시 state(callback ref)로 되돌림. effect 내 동기 `setState` 경고는 `map`을 `useVariation`(getter/setter)으로 감싸 회피.
- **교훈**: lint 경고를 피하려 `state → ref`로 바꾼 것이 회귀의 원인이었다. 경고 회피와 동작 보존을 동시에 만족하는 길(상태 모델 변경)을 찾아야 했다.

### 6-2. 클러스터 분할 시 숫자·클릭이 갱신되지 않음 (Kakao)

- **증상**: 클러스터가 11 → 9+2로 쪼개져도 숫자 라벨이 11에서 안 바뀌고, 클릭 확대가 "가끔" 안 됨.
- **원인**: Kakao의 `cluster.id`를 **첫 마커 id 하나(`cluster_${marker.id}`)** 로만 만들어서, 구성이 바뀌어도 첫 마커가 같으면 id가 동일 → 재조정 로직이 옛 entry를 잘못 재사용.
- **수정**: Google과 동일하게 **구성원 전체 id를 정렬·조인**(`cluster_${정렬된 id들}`)한 안정 id로 변경. id가 React `key`처럼 "클러스터 정체성"을 온전히 담아야 재조정이 올바로 동작한다.
- **교훈**: "코드가 거의 같은데 동작이 다르다"면 id 생성 규칙처럼 **정체성을 정하는 한 줄**을 의심한다.

### 6-3. 클러스터 줌 흔들림 — 해결하지 못한 것의 기록

- **증상**: 줌 시 클러스터 핀이 한 번 툭 튐.
- **시도 1 (필터 순서)**: Kakao가 "보이는 마커만 필터 → 클러스터링"이라 경계 마커가 들락날락. Google처럼 "전체 클러스터링 → 보이는 클러스터만 그리기"로 바꿈 → 경계 흔들림은 줄었으나 "툭 튐"은 남음.
- **시도 2 (center 안정화)**: center를 구성원 평균 → 대표 마커(id 최소) 좌표로 고정 시도 → **오히려 악화**. 평균은 그룹 중심 근처라 점프 폭이 작은데, 대표 좌표는 그룹 한쪽 끝이라 대표 마커가 바뀌면 더 크게 튄다.
- **결론**: "툭 튐"은 버그가 아니라 **줌 레벨마다 클러스터가 재구성되는 구조적 특성**이다. center를 어떻게 잡아도 사라지지 않고, 없애려면 옛 핀 → 새 핀 위치 보간(애니메이션)이 필요하다. 직접 구현 클러스터링에 매끄러운 애니메이션을 붙이는 비용이 커서 **보류**.
- **교훈**: 모든 "흔들림"이 고쳐야 할 버그는 아니다. 두 번의 실패한 가설(필터·center)이 "이건 위치 계산 문제가 아니라 재구성 문제"임을 증명했다.
