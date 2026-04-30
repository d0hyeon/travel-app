# 표현 규칙

코드를 작성하는 중, 또는 커밋 전에 읽는다.
코드는 동작만 맞으면 되는 게 아니라, **의도가 읽혀야 한다**.

---

## 이름은 역할을 설명한다

이름은 코드를 읽는 사람이 구현을 따라가기 전에 의도를 먼저 파악하게 해야 한다.
좋은 이름은 값의 출처보다 쓰임을, 구현 방식보다 역할을 드러낸다.

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

## 조건은 의도를 드러낸다

조건식이 길어지면 boolean 변수나 함수로 의도를 이름 붙인다.

```ts
// ✗ — 읽는 사람이 조건의 의미를 직접 해석해야 함
if (member.role === 'host' && !member.deletedAt && trip.status !== 'archived') {
  ...
}

// ✓ — 조건이 무엇을 판단하는지 먼저 읽힘
const canManageTrip = member.role === 'host' && !member.deletedAt && trip.status !== 'archived'

if (canManageTrip) {
  ...
}
```

부정 조건이 겹치면 긍정 이름으로 바꿀 수 있는지 먼저 본다.

```ts
// ✗ — 이중 부정으로 의미가 늦게 읽힘
if (!isNotEditable) {
  ...
}

// ✓ — 상태가 직접 읽힘
if (isEditable) {
  ...
}
```

---

## 함수는 한 가지 판단을 담는다

함수 이름은 내부 절차보다 호출부에서 기대하는 결과나 행위를 표현한다.

```ts
// ✗ — 내부 구현 순서 중심
function filterAndSortMembers(members: Member[]) { ... }

// ✓ — 호출부가 필요한 의미 중심
function getOrderedActiveMembers(members: Member[]) { ... }
```

함수가 여러 이유로 바뀐다면 책임을 나눈다.
다만 분리한 뒤 호출부가 흐름을 다시 조립해야 한다면, 먼저 이름과 입력값을 다듬는다.

---

## 중간 값은 독자의 추론을 줄일 때 둔다

한 줄로 쓸 수 있어도 의미가 바로 읽히지 않으면 중간 값을 둔다.
반대로 이름이 `value`, `result`, `data`처럼 새 정보를 주지 못하면 중간 값이 오히려 방해가 된다.

```ts
// ✗ — 수식의 의도를 직접 계산해야 함
return members.filter((member) => member.role === 'host' && !member.deletedAt).length > 0

// ✓ — 무엇을 확인하는지 단계가 드러남
const activeHosts = members.filter((member) => member.role === 'host' && !member.deletedAt)

return activeHosts.length > 0
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

---

## 조기 반환으로 주요 흐름을 드러낸다

예외 상황을 먼저 처리하면 정상 흐름이 덜 들여쓰기 된다.

```ts
// ✗ — 정상 흐름이 조건문 안에 묻힘
function getTripTitle(trip?: Trip) {
  if (trip) {
    return trip.title.trim() || 'Untitled trip'
  }

  return 'Untitled trip'
}

// ✓ — 예외를 먼저 정리하고 정상 흐름을 남김
function getTripTitle(trip?: Trip) {
  if (!trip) return 'Untitled trip'

  return trip.title.trim() || 'Untitled trip'
}
```
