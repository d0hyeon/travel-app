# 작업 전 행동 지침

작업을 시작하기 전에 읽는다.
구현 방향, 파일 위치, 이름 짓기를 결정할 때 이 문서를 기준으로 삼는다.

---

## Git 컨벤션

- **커밋은 역할 단위로 세분화한다** — 기능 구현·스타일 수정·리팩토링·문서 등 역할이 다르면 커밋을 분리한다
- **기능 단위 작업은 브랜치를 생성한다** — `main`에 직접 커밋하지 않고, 기능별 브랜치(`feat/...`, `fix/...` 등)를 따서 작업한다

---

## 작업 태도

- 요청을 구현하기 전, 설계 원칙·확장성·인터페이스 적절성을 스스로 검토한다
- 궁금한 점이나 결정이 필요한 문제가 있다면 질문한다
- 더 나은 방안이 있거나 트레이드오프가 있으면 구현 전에 피드백한다
- 불필요한 추상화·미래 대비 코드는 작성하지 않는다
- 암묵적인 결합이나 의존이 없도록 한다
- 주석은 구현 배경 설명보다, 현재 구조를 다시 검토해야 하는 조건과 전환 신호를 남기는 데 사용한다

---

## 계층 구조

모듈은 관심사에 따라 네 계층으로 분리된다.

| 계층 | 파일 패턴 | 책임 |
|------|-----------|------|
| 외부 어댑터 | `*.api.ts` | Supabase 등 외부 시스템과의 통신. DB row → 도메인 모델 변환 |
| 도메인 | `*.types.ts`, `*.utils.ts` | 비즈니스 로직과 도메인 모델 정의. 외부 의존 없는 순수 로직 |
| 데이터 | `use*.ts` | 데이터 조회·변환·상태 관리. 컴포넌트가 필요한 형태로 가공해서 제공 |
| UI | `*.tsx` | 화면 렌더링과 사용자 인터랙션만 담당 |

각 계층은 **소비자 친화적**이어야 한다 — 사용하는 쪽이 내부 구현을 알 필요 없이 인터페이스만으로 충분히 동작할 수 있어야 한다.

```ts
// ✓ — 훅이 필요한 형태로 가공해서 제공
const { data: members } = useTripMembers(tripId)

// ✗ — 소비자가 직접 변환 로직을 알아야 함
const { data: rows } = useTripMemberRows(tripId)
const members = rows.map(toMember)
```

---

## 모듈 설계

- 각 모듈은 하나의 명확한 책임만 가진다
- 모듈 이름만으로 역할이 예측 가능해야 한다
- 인터페이스가 어색하게 느껴지면 책임 과중 신호 → 분리 검토
- 추상화는 구현을 숨기는 것보다 책임의 경계를 분명하게 드러내는 데 목적이 있다
- 추상화한 뒤 오히려 호출 흐름이 더 난해해지거나, 이름만으로 역할을 이해할 수 없다면 과한 추상화 신호다

두 모듈이 강하게 결합되어 함께 바뀐다면, 분리보다 책임 재정의를 먼저 검토한다.

```ts
// ✗ — calculateSize는 결국 getInitialState에서만 쓰인다
const calculateSize = createBoxSizeCalculator(window.innerHeight)
const { initialSnap, height } = getInitialState({ calculateSize, ... })

// ✓ — calculateSize를 내부로 흡수
const { initialSnap, height } = getInitialState({ maxHeight: window.innerHeight, ... })
```

### 수행형 모듈

값을 제공하는 모듈과 동작을 수행하는 모듈을 구분해서 설계한다.
수행형 모듈의 이름은 "무엇이 만들어지는가"보다 "무엇을 하는가"가 드러나야 한다.

```ts
// ✗
useRenderedRegionFeatures()

// ✓
useApplyRegionStyle()
useSyncRegionFeatures()
```

흐름을 더 잘 드러낼 수 있다면, 애매한 중간 추상화보다 호출부에 직접 풀어쓰는 편이 낫다.

```ts
// ✗
useRenderedRegionFeatures(props)

// ✓
useAsyncEffect(async () => {
  const collection = await fetchBoundary()
  replaceFeatures(collection)
}, [props])
```

---

## 컴포넌트 인터페이스

**이름은 UI 형태를 표현한다**

```
TripListItem, TripForm, TripTable  ✓
TripComponent, TripWidget          ✗
```

**props 이름은 DOM 표준을 따른다**

```tsx
// ✓
<SomethingForm defaultValue={...} onSubmit={...} />

// ✗
<SomethingForm something={...} onNext={...} />
```

**Box 기반 컴포넌트는 `BoxProps`를 확장해 스타일 재정의를 허용한다**

```tsx
interface Props extends BoxProps {
  tripId: string
}
```

확장은 의도적으로 차단할 수 있다 — 구현이 복잡해지거나 오해 여지가 있을 때.
반쪽짜리 확장(일부만 동작)이라면 차단하는 게 낫다.

---

## 데이터 의존성

컴포넌트는 식별자(ID)만으로 스스로 동작할 수 있어야 한다.
호출부는 *무엇을 렌더링할지*만 알면 되고, *어떻게 데이터를 가져올지*는 컴포넌트의 책임이다.

```tsx
// ✓ — 컴포넌트가 필요한 것만 의존
<TripMemberChip memberId={id} />

// ✗ — 호출부가 데이터 구조까지 알아야 함
<TripMemberChip member={member} />
```

> React Query 캐싱 덕분에 ID 기반 조회를 중복 요청 없이 구현할 수 있다.

예외: 데이터 레이어에 의존하지 않는 순수 표현 컴포넌트는 데이터를 직접 받아도 된다.

---

## 반응형 컴포넌트

모바일/데스크탑 파일을 분리하고 래퍼에서 `useIsMobile()`로 분기한다.
**수정 시 `.mobile.tsx`와 `.desktop.tsx` 양쪽 모두 확인할 것.**

```
TripDetailPage.tsx          ← 분기 래퍼
TripDetailPage.mobile.tsx   ← 모바일 구현
TripDetailPage.desktop.tsx  ← 데스크탑 구현
```

---

## 표현의 명확성

코드는 동작만 맞으면 되는 게 아니라, **의도가 읽혀야 한다**.

### 이름은 역할을 설명한다

파생 데이터의 변수명은 원본과 어떻게 다른지가 드러나야 한다.

```ts
// ✗ — 어떻게 만들었는지만 설명
const sorted = members.toSorted(...)

// ✓ — 무엇을 위한 배열인지 드러남
const orderedMembers = members.toSorted(...)
```

prop 이름이 구현 기술을 드러내면 역할보다 수단이 앞서게 된다.

```ts
// ✗ — 지도 렌더링 방식을 연상시키는 이름
<PlaceSearchDialog mapType="google" />

// ✓ — 장소 검색 서비스 제공자를 표현하는 이름
<PlaceSearchDialog service="google" />
```

### 불변 배열 조작

```ts
// ✗ — 의도가 두 단계로 분리됨
const sorted = [...members].sort((a, b) => ...)

// ✓ — 불변 정렬 의도가 메서드 이름에 담김
const sorted = members.toSorted((a, b) => ...)
```

### 정렬 comparator

```ts
// ✗ — 읽는 사람이 직접 계산해야 함
members.toSorted((a, b) => (b.isHost ? 1 : 0) - (a.isHost ? 1 : 0))

// ✓ — 의도가 바로 읽힘
const Sort = { Shift: -1, Maintain: 0 } as const
members.toSorted((a, b) => (a.isHost ? Sort.Shift : Sort.Maintain))
```

> 도메인 무관한 순수 상수는 `shared/utils/`에 둔다. `*.utils.ts`는 도메인 비즈니스 로직 전용이므로 혼용하지 않는다.
