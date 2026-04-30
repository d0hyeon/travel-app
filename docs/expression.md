# 표현 규칙

코드를 작성하는 중, 또는 커밋 전에 읽는다.
코드는 동작만 맞으면 되는 게 아니라, **의도가 읽혀야 한다**.

---

## 이름은 역할을 설명한다

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

---

## 불변 배열 조작

원본을 건드리지 않는 배열 메서드를 우선 사용한다.

```ts
// ✗ — 의도가 두 단계로 분리됨
const sorted = [...members].sort((a, b) => ...)

// ✓ — 불변 정렬 의도가 메서드 이름에 담김
const sorted = members.toSorted((a, b) => ...)
```

---

## 의미 기반 상수 활용

매직 넘버보다 의도를 이름으로 표현한 상수가 낫다.

```ts
// ✗ — 읽는 사람이 직접 계산해야 함
members.toSorted((a, b) => (b.isHost ? 1 : 0) - (a.isHost ? 1 : 0))

// ✓ — 의도가 바로 읽힘
const Sort = { Shift: -1, Maintain: 0 } as const
members.toSorted((a, b) => (a.isHost ? Sort.Shift : Sort.Maintain))
```

> 도메인 무관한 순수 상수는 `shared/utils/`에 둔다. `*.utils.ts`는 도메인 비즈니스 로직 전용이므로 혼용하지 않는다.
