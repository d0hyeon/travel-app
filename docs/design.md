# 설계 원칙

설계 결정이 필요한 순간에 읽는다.
파일 위치, 모듈 경계, 인터페이스를 결정할 때 이 문서를 기준으로 삼는다.

---

## 계층 구조

`features/`는 도메인 관심사, `shared/`는 도메인 무관한 범용 모듈(컴포넌트, 훅, 유틸)을 담는다.

모듈은 관심사에 따라 다섯 계층으로 분리된다.

| 계층        | 파일 패턴                  | 책임                                                               |
| ----------- | -------------------------- | ------------------------------------------------------------------ |
| 외부 어댑터 | `*.api.ts`                 | Supabase 등 외부 시스템과의 통신. DB row → 도메인 모델 변환        |
| 도메인      | `*.types.ts`, `*.utils.ts` | 비즈니스 로직과 도메인 모델 정의. 외부 의존 없는 순수 로직         |
| 데이터      | `use*.ts`                  | 데이터 조회·변환·상태 관리. 컴포넌트가 필요한 형태로 가공해서 제공 |
| UI          | `*.tsx`                    | 화면 렌더링과 사용자 인터랙션만 담당                               |
| 유틸        | `shared/utils/*.ts`        | 도메인·UI 무관한 순수 함수                                         |

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
분리는 각 모듈을 **독립적으로 이해할 수 있을 때** 비로소 가치가 있다.
나눈 뒤 호출부가 두 모듈의 관계를 머릿속에서 다시 조립해야 한다면, 분리 전보다 복잡해진 것이다.

```ts
// ✗ — calculateSize가 getInitialState 안에서만 쓰인다
//     두 함수를 따로 읽어서는 전체 의도를 파악할 수 없다
const calculateSize = createBoxSizeCalculator(window.innerHeight)
const { initialSnap, height } = getInitialState({ calculateSize })

// ✓ — 호출부만 읽어도 의도가 완결된다
const { initialSnap, height } = getInitialState({ maxHeight: window.innerHeight })
```

### 캡슐화

내부에서 결정할 수 있는 것은 인터페이스로 드러내지 않는다.
의존성을 드러낼지 숨길지는 **"호출부가 관여해야 할 이유가 있는가"** 로 판단한다.

**숨긴다** — 모듈이 책임져야 할 규칙이거나, 호출 맥락과 무관하게 항상 같은 값인 경우

```ts
// ✗ — createdAt은 createUser의 규칙 → 호출부가 알 필요 없음
function createUser(createdAt: Date) { ... }

// ✓ — 내부에서 직접 결정
function createUser() { const createdAt = new Date(); ... }
```

**드러낸다** — 호출하는 맥락마다 달라지는 결정이거나, 외부에서 제어해야 할 이유가 있는 경우

```ts
// 날짜 범위는 호출부가 결정해야 할 값
function fetchExpenses(startDate: Date, endDate: Date) { ... }

// 에러 종류는 호출부가 핸들링해야 할 정보 → 타입으로 명시적으로 열어둔다
export const CreateUserErrorType = { 유효성: 1001, 중복: 1002 } as const
export type CreateUserErrorType = typeof CreateUserErrorType[keyof typeof CreateUserErrorType]

/** throws {CreateUserErrorType} */
export function createUser() { ... }
createUser.isDefinedError = (error: unknown): error is CreateUserErrorType => { ... }
```

판단이 어렵다면 두 가지를 확인한다:
- 이 값을 **누가 알아야 할 책임**이 있는가?
- 다른 맥락에서 **이 값을 바꿔야 할 이유**가 생길 수 있는가?

### 수행형 모듈

값을 제공하는 모듈과 동작을 수행하는 모듈을 구분해서 설계한다.
수행형 모듈의 이름은 "무엇이 만들어지는가"보다 "무엇을 하는가"가 드러나야 한다.

```ts
// ✗ — 결과물 이름 중심
useRenderedRegionFeatures()

// ✓ — 행위 중심
useApplyRegionStyle()
useSyncRegionFeatures()
```

흐름을 더 잘 드러낼 수 있다면, 애매한 중간 추상화보다 호출부에 직접 풀어쓰는 편이 낫다.

```ts
// ✗ — 내부 흐름이 숨겨짐
useSyncRegionFeatures(props)

// ✓ — 무엇을 가져와서 무엇을 하는지 한눈에 읽힘
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
