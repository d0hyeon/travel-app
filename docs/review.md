# 작업 후 자가 리뷰 기준

구현을 마친 뒤, 커밋 전에 아래 기준으로 스스로 검토한다.
각 항목은 "Yes면 통과, No면 재검토"다.

---

## 체크리스트

### 파일 위치
- [ ] 이 파일이 없어지면 어느 도메인이 망가지는가? → 그 도메인 안에 있는가
- [ ] 이 기능의 관련 파일(api·훅·UI)이 한 디렉토리에 모여 있는가
- [ ] 실제 소비처가 하나의 도메인뿐인데 상위에 올라가 있지는 않은가

### 모듈 경계
- [ ] 이 타입의 필드가 바뀌었을 때 영향받는 로직이 다른 도메인에 있지는 않은가
- [ ] 인터페이스(props·인자)에 소비자가 알 필요 없는 값이 노출되어 있지 않은가
- [ ] 내부에서 결정할 수 있는 상태를 호출부에서 관리하고 있지는 않은가

### 이름
- [ ] 파일·함수·변수 이름이 구현 기술이 아닌 역할을 표현하는가
- [ ] 파생 데이터의 이름이 원본과 어떻게 다른지 드러내는가

### 표현
- [ ] comparator 수식이 "무엇을 앞으로 보내려는가"로 읽히는가
- [ ] 불변 배열 메서드(`toSorted`, `toReversed`)를 우선 사용했는가

---

## 파일 위치 판단 원칙

### 소비처가 아닌 소유 주체 기준으로 배치한다

파일 위치는 "어디서 쓰이는가"가 아니라 **"누구의 책임인가"** 로 결정한다.

**사례 — `usePlacePhotos` 이동 (`explorer` → `place`)**

`usePlacePhotos`는 `PlaceExplorerDetailBottomSheet`에서만 쓰이고 있어 `explorer/` 안에 있었다.
그러나 "장소의 사진을 조회한다"는 책임은 `place` 도메인의 것이다.
`place` 도메인에서 재사용이 필요해졌을 때, `explorer`에 있었다면 잘못된 방향의 의존이 생겼을 것이다.

```
# 이전 — 소비처 기준
src/features/explorer/usePlacePhotos.ts

# 이후 — 소유 주체 기준
src/features/place/usePlacePhotos.ts
```

**판단 질문:** "이 파일이 없어지면 어느 도메인이 망가지는가?" → 그 도메인에 둔다.

---

### 관련 파일은 한 디렉토리에 응집한다

하나의 개념을 구성하는 api·훅·UI가 여러 디렉토리에 흩어져 있으면
변경할 때 파일을 찾아 헤매고 참조 방향도 뒤얽힌다.

**사례 — 추천 장소를 `trip-recommend/`로 응집**

추천 장소 기능이 세 도메인에 분산되어 있었다.

```
# 이전 — 분산
src/features/place/recommended-place.api.ts        ← "장소 데이터를 다루니까"
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
하지만 추천 장소는 여행(trip) 컨텍스트 안에서만 의미 있는 파생 개념이다.
데이터 원천(`place`)과 비즈니스 개념(`trip-recommend`)을 혼동하지 않는다.

**판단 질문:** "이 기능의 모든 파일을 찾으려면 몇 곳을 열어야 하는가?" → 하나면 잘 응집된 것이다.

---

### 소비 맥락이 하나로 특정되면 그 안으로 이동한다

범용으로 설계했지만 실제로 한 곳에서만 쓰인다면,
`shared/`나 상위 도메인에 두는 것은 과도한 일반화다.

**사례 — `PlaceForm`을 `trip-place-form/`으로 이동**

`PlaceForm`과 오버레이 훅이 `place/` 도메인에 있었다.
실제 소비처는 `trip-place` 하나뿐이었고, `place/PlaceForm`은 공개 인터페이스처럼 보였지만 실제로는 `trip-place`의 내부 구현이었다.

```
# 이전 — 범용처럼 보이는 위치
src/features/place/PlaceForm.tsx
src/features/place/usePlaceFormOverlay.tsx

# 이후 — 소비 맥락 위치
src/features/trip/trip-place/trip-place-form/PlaceForm.tsx
src/features/trip/trip-place/trip-place-form/useTripPlaceFormOverlay.tsx
```

**판단 질문:** "이 파일을 다른 도메인이 실제로 쓰는가?" → No라면 소비처 안으로 이동한다.

---

## 모듈 경계 판단 원칙

### 도메인 타입은 해당 도메인의 관심사만 가진다

**사례 — `Place` 타입에서 `scheduledDate` 제거**

```ts
// 이전 — route 도메인의 관심사가 Place 타입에 혼입
interface Place {
  scheduledDate?: string  // "언제 방문할지"는 route가 결정하는 것
}

// 이후 — Place는 장소 자체의 속성만
interface Place {
  // scheduledDate 없음. 일정 날짜는 route에서 관리
}
```

**판단 질문:** "이 필드가 바뀌면 어느 도메인의 로직이 영향받는가?" → 그 도메인의 타입에 두어야 한다.

---

### 내부에서 결정할 수 있는 것은 인터페이스로 노출하지 않는다

**사례 A — `RecommendedMarkers` props 단순화**

```tsx
// 이전 — 소비자가 선택 상태를 직접 제어
<RecommendedMarkers
  tripId={tripId}
  bounds={mapBounds}
  selectedPlaceId={null}
  onSelect={() => {}}
  onOpen={(place) => openRecommendedDialog({ place, tripId })}
/>

// 이후 — 소비자는 "클릭 시 무엇을 할지"만 결정
<RecommendedMarkers
  tripId={tripId}
  bounds={mapBounds ?? undefined}
  onClick={(place) => openRecommendedDialog({ place, tripId })}
/>
```

`selectedPlaceId`와 `onSelect`는 컴포넌트 내부에서 관리해야 할 선택 상태였다.

**사례 B — `StatisticsBarChart` 툴팁 캡슐화**

```tsx
// 이전 — 툴팁 열림 여부를 호출부가 관리
<StatisticsBarChart
  labelTooltipOpen={openRank === group.rank}
  onLabelClick={() => setOpenRank(...)}
/>

// 이후 — 컴포넌트가 내부 useState + ClickAwayListener로 자체 관리
<StatisticsBarChart
  labelTooltip={group.overflow > 0 ? group.names.join(', ') : undefined}
/>
```

**판단 질문:** "이 prop이 없어도 컴포넌트가 올바르게 동작할 수 있는가?" → Yes라면 제거한다.

---

## 이름 판단 원칙

### 이름은 구현 방식이 아닌 역할을 표현한다

**사례 — `mapType` → `service`**

```ts
// 이전 — "지도의 종류"로 읽힘
<PlaceSearchDialog mapType="google" />

// 이후 — "장소 검색 서비스 제공자"로 읽힘
<PlaceSearchDialog service="google" />
```

`mapType`은 지도 렌더링 방식을 연상시키지만, 실제 역할은 어떤 외부 서비스로 장소를 검색할지 결정하는 것이다.

**판단 질문:** "이름만 보고 이 값이 무엇을 제어하는지 알 수 있는가?" → No라면 이름을 바꾼다.
