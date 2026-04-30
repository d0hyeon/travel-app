# 모듈 분리 & 정의 방법론

> **언제 읽어야 하는가**
> - 새 파일을 어느 디렉토리에 둘지 결정할 때
> - 훅·컴포넌트·API 파일의 책임 범위를 나눌 때
> - 기존 코드를 어디서 참조·재사용할지 판단할 때
>
> → 기획·설계가 완료되고 **구현 위치를 결정하는 순간**, 이 문서를 펼친다.

---

## 원칙 1 — 소유 주체가 명확한 도메인에 둔다

파일의 위치는 "어디서 쓰이는가"보다 **"누구의 책임인가"** 로 결정한다.
소비처가 여럿이더라도, 데이터를 정의·소유하는 도메인에 파일을 둔다.

### 사례: `usePlacePhotos` 이동 (`explorer` → `place`)

`usePlacePhotos`는 `PlaceExplorerDetailBottomSheet`에서만 쓰이고 있었기 때문에 `explorer/` 안에 있었다.
하지만 "장소의 사진을 조회한다"는 책임은 `explorer`가 아니라 `place` 도메인의 것이다.

```
# 이전
src/features/explorer/usePlacePhotos.ts  ← 소비처 기준 배치

# 이후
src/features/place/usePlacePhotos.ts     ← 소유 주체 기준 배치
```

`place` 도메인의 다른 컴포넌트가 이 훅을 쓰게 되었을 때, `explorer`에 있었다면 잘못된 방향의 의존이 생겼을 것이다.

**판단 기준:** "이 파일이 없어지면 어느 도메인이 망가지는가?" → 그 도메인에 둔다.

---

## 원칙 2 — 흩어진 관심사는 하나의 모듈로 응집한다

하나의 개념(Feature)을 구성하는 API·훅·UI가 여러 디렉토리에 흩어져 있다면,
변경할 때 파일을 찾아 헤매게 되고 참조 방향도 뒤얽힌다.
관련 파일은 한 디렉토리 아래에 모아 **변경 반경을 좁힌다**.

### 사례: 추천 장소를 `trip-recommend/`로 응집

추천 장소 기능이 세 도메인에 분산되어 있었다.

```
# 이전 — 분산
src/features/place/recommended-place.api.ts
src/features/trip/trip-place/RecommendedPlaceBrowser.tsx
src/features/trip/trip-place/RecommendedPlaceDetailOverlay.tsx
src/features/trip/trip-place/useRecommendedPlaces.ts
src/features/trip/trip-basic-info/RecommendedPlacesSection.tsx

# 이후 — 응집
src/features/trip/trip-recommend/
  ├── trip-recommend.api.ts
  ├── useRecommendedPlaces.ts
  ├── RecommendedMarkers.tsx
  ├── RecommendedPlaceDetailOverlay.tsx
  └── RecommendedPlaceListSection.tsx
```

`recommended-place.api.ts`가 `place/` 안에 있었던 이유는 "장소 데이터를 다루니까"였다.
하지만 추천 장소는 **여행(trip) 컨텍스트 안에서만 의미**가 있는 파생 개념이다.
데이터 원천(`place`)과 비즈니스 개념(`trip-recommend`)을 혼동하지 않는다.

**판단 기준:** "이 기능의 모든 파일을 찾으려면 몇 곳을 열어야 하는가?" → 하나면 잘 응집된 것이다.

---

## 원칙 3 — 소비 맥락이 특정되면 그 맥락 안으로 이동한다

범용으로 설계했지만 실제로는 한 곳에서만 쓰이는 모듈은,
괜히 `shared/`나 상위 도메인에 두는 것보다 소비처 가까이 두는 것이 낫다.
"나중에 재사용할 수도 있으니"라는 이유로 외부에 두는 것은 과도한 일반화다.

### 사례: `PlaceForm`을 `trip-place-form/`으로 이동

`PlaceForm`과 `usePlaceFormOverlay`는 `place/` 도메인에 있었다.
"장소 폼이니까 place 도메인"이라는 논리였지만, 실제 소비처는 `trip-place` 뿐이었다.

```
# 이전 — 범용 위치
src/features/place/PlaceForm.tsx
src/features/place/usePlaceFormOverlay.tsx

# 이후 — 소비 맥락 위치
src/features/trip/trip-place/trip-place-form/PlaceForm.tsx
src/features/trip/trip-place/trip-place-form/useTripPlaceFormOverlay.tsx
```

`place/PlaceForm`은 `place` 도메인의 공개 인터페이스처럼 보이지만,
실제로는 `trip-place`의 내부 구현이었다. 위치가 그 사실을 숨기고 있었던 것이다.

**판단 기준:** "이 파일을 `place/` 밖의 다른 도메인이 사용하는가?" → No라면 소비처 안으로 이동한다.

---

## 원칙 4 — 인터페이스는 소비자 관점에서 최소화한다

컴포넌트·훅의 props나 인자가 많을수록, 소비자가 알아야 할 내부 구현이 많다는 신호다.
내부에서 결정할 수 있는 것은 인터페이스로 드러내지 않는다.

### 사례 A: `RecommendedMarkers` props 단순화

```tsx
// 이전 — 소비자가 선택 상태와 이벤트를 모두 제어
<RecommendedMarkers
  tripId={tripId}
  bounds={mapBounds}
  selectedPlaceId={null}
  onSelect={() => {}}
  onOpen={(place) => openRecommendedDialog({ place, tripId })}
/>

// 이후 — 소비자는 "클릭했을 때 무엇을 할지"만 결정
<RecommendedMarkers
  tripId={tripId}
  bounds={mapBounds ?? undefined}
  onClick={(place) => openRecommendedDialog({ place, tripId })}
/>
```

`selectedPlaceId`와 `onSelect`는 컴포넌트 내부에서 관리해야 할 선택 상태였다.
소비자가 그 상태를 가지고 있을 이유가 없으므로 제거했다.

### 사례 B: `StatisticsBarChart` 툴팁 캡슐화

```tsx
// 이전 — 툴팁 열림 여부를 호출부가 관리
<StatisticsBarChart
  labelTooltipOpen={openRank === group.rank}
  onLabelClick={() => setOpenRank(...)}
/>

// 이후 — 클릭하면 열리는 동작은 차트가 스스로 결정
<StatisticsBarChart
  labelTooltip={group.overflow > 0 ? group.names.join(', ') : undefined}
/>
```

"툴팁을 열고 닫는 것"은 `StatisticsBarChart`가 책임져야 할 동작이다.
호출부는 "어떤 내용을 보여줄지"만 결정하면 된다.

**판단 기준:** "이 prop이 없어도 컴포넌트가 올바르게 동작할 수 있는가?" → Yes라면 제거한다.

---

## 원칙 5 — 이름은 역할을 표현한다, 구현 방식이 아니라

prop 이름이나 파일 이름이 구현 기술을 드러내면, 역할보다 수단이 앞서게 된다.
이름은 **"무엇을 하는가"** 를 표현해야 한다.

### 사례: `mapType` → `service`

```ts
// 이전 — 지도 렌더링 방식을 연상시키는 이름
<PlaceSearchDialog mapType="google" />

// 이후 — 장소 검색 서비스 제공자를 표현하는 이름
<PlaceSearchDialog service="google" />
```

`mapType`은 "지도의 종류"처럼 읽힌다. 하지만 이 prop의 실제 역할은 어떤 외부 서비스로 장소를 검색할지 결정하는 것이다.
이름이 역할을 숨기면 사용하는 쪽에서 오해가 생긴다.

**판단 기준:** "이름만 보고 이 값이 무엇을 제어하는지 알 수 있는가?" → No라면 이름을 바꾼다.

---

## 원칙 6 — 도메인 타입은 책임 범위에 맞는 필드만 가진다

타입에 필드를 추가하기 전에 "이 값은 이 도메인이 소유해야 하는가?"를 묻는다.
다른 도메인의 관심사가 섞이면 타입 경계가 흐려지고 의존이 뒤얽힌다.

### 사례: `Place` 타입에서 `scheduledDate` 제거

```ts
// 이전 — route 도메인의 관심사가 Place 타입에 혼입
interface Place {
  scheduledDate?: string // ISO date  ← route 도메인의 것
}

// 이후 — Place는 장소 자체의 속성만 가짐
interface Place {
  // scheduledDate 없음. 일정 날짜는 route에서 관리
}
```

"언제 방문할지"는 여행 경로(route)가 결정하는 것이지, 장소(place) 자체의 속성이 아니다.
두 도메인의 관심사가 한 타입에 섞이면, 어느 쪽도 타입을 단독으로 소유할 수 없게 된다.

**판단 기준:** "이 필드가 바뀌면 어느 도메인의 로직이 영향받는가?" → 그 도메인의 타입에 두어야 한다.

---

## 체크리스트 — 구현 위치를 결정할 때

새 파일을 만들기 전에 아래를 확인한다.

- [ ] **소유 주체**: "이 로직이 없어지면 어느 도메인이 망가지는가?" → 그 도메인에 둔다
- [ ] **응집**: "이 기능의 관련 파일이 몇 곳에 흩어져 있는가?" → 하나의 디렉토리로 모을 수 있는가
- [ ] **소비 범위**: "이 파일을 실제로 쓰는 곳이 여러 도메인인가, 하나인가?" → 하나라면 그 안으로 이동
- [ ] **인터페이스**: "소비자가 알 필요 없는 것을 props로 노출하고 있지 않은가"
- [ ] **이름**: "파일·prop 이름이 구현 기술이 아닌 역할을 표현하는가"
- [ ] **타입 필드**: "이 필드의 변경이 다른 도메인 로직에 영향을 주는가" → 준다면 타입 위치를 재검토
