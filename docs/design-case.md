# 설계 사례 문서

## 리팩토링 사례

### 1. 역할 불명확한 훅은 쪼개기보다 책임을 다시 정의한다

**상황**
`KakaoMap` 내부에 `useKakaoMap`이라는 훅이 있었다.
지도 인스턴스 생성, 이벤트 등록, bounds 수집, 마커 등록 등 여러 일을 하고 있었고,
"이 훅이 어떤 역할인지 이름만으로 알 수 없다"는 피드백이 나왔다.

**피드백**

> "어떤 역할을 가져가는지 명확히 보이지 않다."

**결론**
역할이 명확히 분리되는 것(`useBoundsFocus`, `useMarkerRegistry`)은 독립 모듈로 뽑고,
나머지는 훅으로 추상화하지 않고 컴포넌트에 직접 풀어썼다.
억지로 훅으로 묶으면 호출부가 두 모듈의 관계를 머릿속에서 다시 조립해야 하기 때문이다.

```ts
// ✗ — 무엇을 하는지 이름만으로 알 수 없음
const { map, extendBound, ... } = useKakaoMap(container)

// ✓ — 각 모듈이 하나의 명확한 책임을 가짐
const { collect: extendBound, focus: focusBounds } = useBoundsFocus(map);
const { registryRef, registerMarker, unregisterMarker } = useMarkerRegistry();
```

### 2. 하나의 기능을 일반적인 상황으로 투영할 수 있다면 승계한다.

**상황**
Map컴포넌트를 역할별 모듈로 분리하던 중 `useKakaoMapAutoFocus` 훅이 생성됨

Map 자식 컴포넌트에서 extendsBound (지도 뷰포트 포커싱 시 특정 노드 포함시키는 함수)가 여러번 호출될 수 있는데,

- 마커 좌표들을 bounds에 누적
- 최초 1회만 setBounds 호출
  두가지 역할을 가진다.

**피드백**

> "역할을 상태관리에 집중해서 구글맵과도 같이 쓸수 없을까?"
> "특정 주제를 엮지말고, 이벤트 에미터와 같이 흐름제어로 바라보는건?"

**결론**
사실 "여러 번 호출되는 이벤트를 같은 프레임에 묶어서 한 번만 처리한다" 는 패턴

```ts
## useKakaoMapAutoFocus

## as-is
const boundsRef = useRef([]);
const scheduleIdRef = useRef(null);

const extendsBound = useCallback((coordinate) => {
  ref.current.push(coordinate);

  cancelAnimationFrame(scheduleIdRef.current);
  scheduleIdRef.current = requestAnimationFrame(() => {
    const bounds = new kakao.maps.LatLngBounds();
    coordinates.forEach(({ lat, lng }) => {
      bounds.extend(new kakao.maps.LatLng(lat, lng))
    });
    boundsRef.current = bounds;
    map.setBounds(bounds);
  })
}, [])

## to-be
const extendsBound = useBatchCallback<Coordinate>((coordinates) => {
  const bounds = new kakao.maps.LatLngBounds();
  coordinates.forEach(({ lat, lng }) => {
    bounds.extend(new kakao.maps.LatLng(lat, lng))
  });
  map.setBounds(bounds);
})
```
