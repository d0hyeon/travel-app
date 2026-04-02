# 코드 스타일 가이드

## 아키텍처

- `app/` — 도메인 관심사. Feature Sliced 방식으로 도메인 > 세부 도메인 계층 구조
- `shared/` — 도메인 무관한 범용 모듈 (컴포넌트, 훅, 유틸)

---

## 계층 구조

모듈은 관심사에 따라 네 계층으로 분리된다.

| 계층 | 파일 패턴 | 책임 |
|------|-----------|------|
| 외부 어댑터 | `*.api.ts` | Supabase 등 외부 시스템과의 통신. DB row → 도메인 모델 변환 |
| 도메인 | `*.types.ts`, `*.utils.ts` | 비즈니스 로직과 도메인 모델 정의. 외부 의존 없는 순수 로직 |
| 데이터 | `use*.ts` | 데이터 조회·변환·상태 관리. 컴포넌트가 필요한 형태로 가공해서 제공 |
| UI | `*.tsx` | 화면 렌더링과 사용자 인터랙션만 담당 |
| 유틸 | `*.ts` | 도메인·UI 무관한 순수 함수 |

각 계층은 **소비자 친화적**이어야 한다 — 사용하는 쪽이 내부 구현을 알 필요 없이 인터페이스만으로 충분히 동작할 수 있어야 한다.

```ts
// ✓ — 훅이 필요한 형태로 가공해서 제공
const { data: members } = useTripMembers(tripId)

// ✗ — 소비자가 직접 변환 로직을 알아야 함
const { data: rows } = useTripMemberRows(tripId)
const members = rows.map(toMember)
```

---

## 모듈 책임

- 각 모듈은 하나의 명확한 책임만 가진다
- 인터페이스가 어색하게 느껴지면 책임 과중 신호 → 분리 검토
- 모듈 이름만으로 역할이 예측 가능해야 한다
- 단일 책임으로 분리된 모듈 중, 그저 구조화된 리소스를 만드는 모듈과 그 리소스를 입력 받아 최종 결과를 만들어내는 모듈이 협력하는 구조라면 강한 결합이 형성되어 변경을 어렵게 만드며 분리의 목적이 없다. 재사용하는게 아니라면 책임 재정의를 검토한다.

```ts
// X
const calculateSize = createBoxSizeCalculator(window.innerHeight)
const { initialSnap, height } = getInitialState({ calculateSize, ... }) // calculateSize는 결국 getInitialState에서만 쓰인다

// O
const { initialSnap, height } = getInitialState({ maxHeight: window.height, ... }) // calculateSize를 내부로 흡수
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

## 코드 작성 원칙

- 요청을 구현하기 전, 설계 원칙·확장성·인터페이스 적절성을 스스로 검토한다
- 더 나은 방안이 있거나 트레이드오프가 있으면 구현 전에 피드백한다
- 불필요한 추상화·미래 대비 코드는 작성하지 않는다
- 암묵적인 결합이나 의존이 없도록 한다.

