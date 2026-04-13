# 코드 스타일 가이드

## 아키텍처

- `app/` — 도메인 관심사. Feature Sliced 방식으로 도메인 > 세부 도메인 계층 구조
- `shared/` — 도메인 무관한 범용 모듈 (컴포넌트, 훅, 유틸)

---

## 계층 구조

모듈은 관심사에 따라 네 계층으로 분리된다.

| 계층        | 파일 패턴                  | 책임                                                               |
| ----------- | -------------------------- | ------------------------------------------------------------------ |
| 외부 어댑터 | `*.api.ts`                 | Supabase 등 외부 시스템과의 통신. DB row → 도메인 모델 변환        |
| 도메인      | `*.types.ts`, `*.utils.ts` | 비즈니스 로직과 도메인 모델 정의. 외부 의존 없는 순수 로직         |
| 데이터      | `use*.ts`                  | 데이터 조회·변환·상태 관리. 컴포넌트가 필요한 형태로 가공해서 제공 |
| UI          | `*.tsx`                    | 화면 렌더링과 사용자 인터랙션만 담당                               |
| 유틸        | `*.ts`                     | 도메인·UI 무관한 순수 함수                                         |

각 계층은 **소비자 친화적**이어야 한다 — 사용하는 쪽이 내부 구현을 알 필요 없이 인터페이스만으로 충분히 동작할 수 있어야 한다.

```ts
// ✓ — 훅이 필요한 형태로 가공해서 제공
const { data: members } = useTripMembers(tripId);

// ✗ — 소비자가 직접 변환 로직을 알아야 함
const { data: rows } = useTripMemberRows(tripId);
const members = rows.map(toMember);
```

---

## 모듈 책임

- 각 모듈은 하나의 명확한 책임만 가진다
- 인터페이스가 어색하게 느껴지면 책임 과중 신호 → 분리 검토
- 모듈 이름만으로 역할이 예측 가능해야 한다
- 리소스를 만드는 모듈과 그 리소스로 최종 결과를 만들어내는 모듈이 항상 분리되어야 하는 것은 아니다.
  - 두 모듈이 강하게 결합되어 함께 바뀐다면, 분리보다 책임 재정의를 먼저 검토한다.
  - 분리의 결과로 호출 흐름이 더 난해해진다면 추상화가 과한 신호다
- 추상화는 구현을 숨기는 것보다 책임의 경계를 분명하게 드러내는 데 목적이 있다.
- 추상화한 뒤 오히려 호출 흐름이 더 난해해지거나, 이름만으로 역할을 이해할 수 없다면 과한 추상화 신호다.

```ts
// X
const calculateSize = createBoxSizeCalculator(window.innerHeight)
const { initialSnap, height } = getInitialState({ calculateSize, ... }) // calculateSize는 결국 getInitialState에서만 쓰인다

// O
const { initialSnap, height } = getInitialState({ maxHeight: window.height, ... }) // calculateSize를 내부로 흡수
```

```tsx
// X
type UseInputValue = { meassge?: string; onChange: (e: InputEvent) => void }
function useInput(rules: Rules): UseInputValue
function Field(props: UseInputValue) { ... }

// O
function Field(props: InputProps & Rules) { ... }
```

---

## 수행형 모듈

값을 제공하는 모듈과, 어떤 동작을 수행하는 모듈은 구분해서 설계한다.

- 값을 제공하는 모듈은 결과물이나 상태를 기준으로 설명한다.
- 동작을 수행하는 모듈은 결과보다 행위를 기준으로 설명한다.
- 수행형 모듈의 이름은 "무엇이 만들어지는가"보다 "무엇을 하는가"가 드러나야 한다.

```ts
// X
useRenderedRegionFeatures();

// O
useApplyRegionStyle();
useSyncRegionFeatures();
```

흐름을 더 잘 드러낼 수 있다면, 애매한 중간 추상화 하나를 두는 것보다 호출부에 직접 풀어쓰는 편이 낫다.

```ts
// X
useRenderedRegionFeatures(props);

// O
useAsyncEffect(async () => {
  const collection = await fetchBoundary();
  replaceFeatures(collection);
}, [props]);
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
  tripId: string;
}
```

**확장은 의도적으로 차단할 수 있다** — 구현이 복잡해지거나 오해 여지가 있을 때.
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

> 이 프로젝트에서는 React Query 캐싱 덕분에 ID 기반 조회를 중복 요청 없이 구현할 수 있다.

**예외**: 데이터 레이어(React Query, API)에 의존하지 않는 순수 표현 컴포넌트는 데이터를 직접 받아도 된다.
도메인 데이터를 조회할 수 없는 환경(Storybook 등)에서도 독립적으로 동작해야 하는 컴포넌트가 이에 해당한다.

---

## 캡슐화

내부에서 해결할 수 있는 것은 인터페이스로 드러내지 않는다.
호출부가 알 필요 없는 정보는 모듈 스스로 결정한다.

```ts
// ✗ — 호출부가 알 필요 없는 값을 요구
function createUser(createdAt: Date) { ... }

// ✓ — 내부에서 직접 결정
function createUser() { const createdAt = new Date(); ... }
```

외부에서 알필요가 있는 정보는 열려 있어야 한다.

```ts
export const CreateUserErrorType = {
  유효성: 0001,
  중복: 0002,
  ...
} as const;
export type CreateUserErrorType = typeof CreateUserErrorType[keyof typeof CreateUserErrorType];

/** thorws {CreateUserErrorType} - 도메인 규칙에 의거한 에러 **/
export function createUser()
createUser.isDefinedError = (error: unknown): error is CreateUserErrorType => {
  ...
}

```

---

## 의존성 노출

의존성을 드러낼지 숨길지는 **"호출부가 관여해야 할 이유가 있는가"** 로 판단한다.

**숨긴다** — 모듈이 책임져야 할 규칙이거나, 호출 맥락과 무관하게 항상 같은 값인 경우

```ts
// createdAt이 "지금"이어야 한다는 건 createUser의 규칙 → 호출부가 알 필요 없음
function createUser() { const createdAt = new Date(); ... }
```

**드러낸다** — 호출하는 맥락마다 달라지는 결정이거나, 외부에서 제어해야 할 이유가 있는 경우

```ts
// 날짜 범위는 호출부가 결정해야 할 값
function fetchExpenses(startDate: Date, endDate: Date) { ... }

// 호출부에 따라 결과가 달라질수 있다 (폴더링, 네이밍을 통한 표현)
// something/DateField → something/something-form/SomethingDateField
function DateField() { // → SomethingDateField
  const { control } = useFormContext()
  const conttoller = useController({ control });
}
```

판단이 어렵다면 두 가지를 확인한다:

- 이 값을 **누가 알아야 할 책임**이 있는가?
- 테스트나 다른 맥락에서 **이 값을 바꿔야 할 이유**가 생길 수 있는가?

정답이 없는 트레이드오프이며, 설계자의 맥락 이해에 달려 있다.

---

---

## 표현의 명확성

코드는 동작만 맞으면 되는 게 아니라, **의도가 읽혀야 한다**.
변수명·메서드 선택·상수화는 "이 코드가 무엇을 하려는가"를 드러내는 수단이다.

### 불변 배열 조작

원본을 건드리지 않는 배열 메서드를 우선 사용한다.

```ts
// ✗ — 스프레드로 복사 후 sort. 의도가 두 단계로 분리됨
const sorted = [...members].sort((a, b) => ...)

// ✓ — 불변 정렬 의도가 메서드 이름 자체에 담김
const sorted = members.toSorted((a, b) => ...)
```

### 변수명은 역할을 설명한다

파생 데이터의 변수명은 **원본과 어떻게 다른지**가 드러나야 한다.
`sorted`처럼 가공 방식만 설명하는 이름은 역할을 숨긴다.

```ts
// ✗ — 어떻게 만들었는지만 설명
const sorted = members.toSorted(...)

// ✓ — 왜 이 순서인지, 무엇을 위한 배열인지 드러남
const orderedMembers = members.toSorted(...)
```

### 정렬 comparator — 의도를 수식으로 표현

comparator 내부의 수식은 **"무엇을 앞으로 보내려는가"** 가 읽혀야 한다.

```ts
// ✗ — 두 항을 빼는 구조라 읽는 사람이 직접 계산해야 함
members.toSorted((a, b) => (b.isHost ? 1 : 0) - (a.isHost ? 1 : 0));

// ✓ — a가 호스트면 앞으로, 아니면 그대로 — 의도가 바로 읽힘
members.toSorted((a, b) => (a.isHost ? -1 : 0));
```

### 정렬 기준이 도메인 의미를 가질 때 — 상수로 명시

`-1 / 0` 같은 매직 넘버보다, 의도를 이름으로 표현한 상수가 낫다.
특히 정렬 기준이 여러 곳에서 쓰이거나, 비즈니스 규칙에서 비롯된 경우.

```ts
// ✗ — -1이 "앞으로"라는 걸 읽는 사람이 알아야 함
members.toSorted((a, b) => (a.isHost ? -1 : 0));

// ✓ — 정렬 의도가 이름으로 드러남
const Sort = { Shift: -1, Maintain: 0 } as const;
members.toSorted((a, b) => (a.isHost ? Sort.Shift : Sort.Maintain));
```

> `SortCommand`처럼 도메인 무관한 순수 상수는 `shared/utils/`에 둔다.
> `*.utils.ts`는 도메인 비즈니스 로직 전용이므로 혼용하지 않는다.

## 코드 작성 원칙

- 요청을 구현하기 전, 설계 원칙·확장성·인터페이스 적절성을 스스로 검토한다
- 궁금한 점이나 결정이 필요한 문제가 있다면 질문한다.
- 더 나은 방안이 있거나 트레이드오프가 있으면 구현 전에 피드백한다
- 불필요한 추상화·미래 대비 코드는 작성하지 않는다
- 암묵적인 결합이나 의존이 없도록 한다.
- 주석은 구현 배경 설명보다, 현재 구조를 다시 검토해야 하는 조건과 전환 신호를 남기는 데 사용한다.
