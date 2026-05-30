# 테스트 가이드

이 프로젝트의 테스트 전략, 도구 설정, 케이스 작성 방법을 정리한 문서.

---

## 테스트 계층 구조

```
E2E 테스트 (Playwright)
  └─ 실제 브라우저 + MSW Mock 서버
     느리다. 사용자 시나리오 전체를 검증한다.
     대상: 핵심 사용자 흐름, 여러 페이지에 걸친 흐름

통합 테스트 (Vitest)
  └─ 두 모듈이 유기적으로 협력하는 흐름을 검증한다
     브라우저·DB 없음. 빠르다.
     대상: 비즈니스 로직 파이프라인, 두 모듈의 연결이 검증 대상인 경우

단위 테스트 (Vitest)
  └─ 모듈 하나의 책임을 검증한다. 의존성은 mock으로 제어한다.
     가장 빠르다.
     대상: 순수 함수, 훅, 컴포넌트 — 단독으로 검증 가능한 모든 모듈
```

### 단위 vs 통합 판단 기준

**단위 테스트** — 모듈 하나의 책임을 검증한다. 의존성이 있어도 mock으로 제어 가능하면 단위다.

```
useExpenses가 payments 합계로 totalAmount를 계산하는가?
→ createExpense가 올바른 인자로 불렸는지만 보면 됨
→ React Query를 mock해도 검증 가능 → 단위
```

**통합 테스트** — 두 모듈의 연결 자체가 검증 대상일 때. mock하면 검증할 수 없는 흐름.

```
calculateBalancesInKRW + calculateSettlements가 협력해서 정산 결과를 만드는가?
→ 두 함수 중 하나를 mock하면 흐름 자체가 사라짐 → 통합
```

> 의존성 유무가 아니라 **"mock하면 검증 대상이 사라지는가"** 로 판단한다.

---

## 무엇을 검증하는가

테스트는 "코드가 어떻게 구현되었는가"가 아니라 **"사용자에게 어떤 동작을 보장해야 하는가"** 를 검증한다.

### 좋은 테스트

실제 서비스 규칙이나 사용자 경험을 검증한다. 요구사항이 바뀌지 않는 한 리팩터링 과정에서도 안정적으로 유지된다.

```
✓ payments 합계가 totalAmount로 자동 계산된다
✓ 해외 여행이면 isOverseas가 true이다
✓ 여행 정보를 수정하면 캐시가 즉시 갱신된다
✓ 지출을 삭제하면 목록에서도 제거된다
✓ 환율이 적용된 정산 결과가 올바르다
```

### 지양하는 테스트

단순히 값을 전달하거나 반환하는지만 검증한다. 실패해도 어떤 요구사항이 깨진 건지 파악하기 어렵다.

```
✗ 지출 목록을 반환한다
✗ 응답을 그대로 반환한다
✗ 지출이 없으면 빈 배열을 반환한다
```

### 작성 전 체크리스트

- 이 테스트가 실패하면 실제 사용자에게 영향이 있는가?
- 이 테스트가 실패하면 어떤 요구사항이 깨졌는지 설명할 수 있는가?
- 내부 구현을 리팩터링해도 이 테스트는 유지되어야 하는가?

셋 모두 "예"이면 좋은 테스트다.

---

## 단위 테스트 — 훅 (renderHook)

### 언제 쓰는가

훅 하나의 책임을 검증할 때. API 레이어는 vi.spyOn으로 mock하고, 훅 내부 로직(파생 계산, 캐시 조작)을 검증한다.

```
✓ 적합한 케이스
  - 훅이 반환하는 파생 데이터 (isOverseas, totalAmount 자동 계산)
  - mutation 호출 시 올바른 인자가 전달되는가
  - fetch 결과를 정상적으로 반환하는가

✗ 부적합한 케이스 (→ 통합 테스트로)
  - 두 훅이 협력하는 흐름
  - mutation 성공 후 캐시 갱신 → 다른 훅의 data가 바뀌는가
```

### 설정 — createWrapper

[src/test-utils/wrapper.tsx](../src/test-utils/wrapper.tsx)

`renderHook`에 React Query 컨텍스트를 제공하는 wrapper. 테스트마다 새 `QueryClient`를 만들어 캐시 오염을 막는다.

```typescript
import { createWrapper } from '~test-utils/wrapper'

const { result } = renderHook(() => useTrip('trip-001'), {
  wrapper: createWrapper(),
})
```

`useSuspenseQuery`를 쓰는 훅은 에러 시 throw하므로, 에러 검증이 필요하면 `onError` 콜백을 전달한다.

```typescript
const caughtErrors: Error[] = []

const { result } = renderHook(() => useTrip('trip-999'), {
  wrapper: createWrapper({ onError: (e) => caughtErrors.push(e) }),
})

await waitFor(() => expect(caughtErrors).toHaveLength(1))
```

### vi.spyOn — API 레이어 mock

Supabase 네트워크 요청을 차단하고 원하는 응답을 반환한다. 함수 자체는 실제로 import되므로 호출 여부·인자를 검증할 수 있다.

```typescript
import * as tripApi from '../trip.api'

vi.spyOn(tripApi, 'getTripById').mockResolvedValue(MOCK_TRIP)
// 에러 케이스
vi.spyOn(tripApi, 'getTripById').mockRejectedValue(new Error('찾을 수 없는 여행'))
```

`beforeEach`에서 `vi.restoreAllMocks()`를 호출해 테스트 간 spy 상태를 초기화한다.

### 테스트 구조 — AAA 패턴

```typescript
it('해외 목적지면 isOverseas가 true이다', async () => {
  // Arrange
  vi.spyOn(tripApi, 'getTripById').mockResolvedValue(MOCK_TRIP)

  // Act
  const { result } = renderHook(() => useTrip('trip-001'), {
    wrapper: createWrapper(),
  })

  // Assert
  await waitFor(() => expect(result.current.data).toBeDefined())
  expect(result.current.data.isOverseas).toBe(true)
})
```

비동기 상태 변화는 `waitFor`로 감싼다. mutation처럼 명령형 호출은 `act`로 감싼다.

```typescript
act(() => {
  result.current.create({ ... })
})

await waitFor(() => expect(result.current.data).toHaveLength(2))
```

---

## 통합 테스트 — 비즈니스 로직 파이프라인

### 언제 쓰는가

두 함수·모듈이 협력해서 결과를 만드는 흐름을 검증할 때. 어느 한 쪽을 mock하면 검증 대상이 사라진다.

```
✓ 적합한 케이스
  - calculateBalancesInKRW → calculateSettlements 파이프라인
  - 환율 변환 + 정산 계산이 함께 쓰이는 경우
  - DB row → toTrip() → 도메인 모델 변환 체인

✗ 부적합한 케이스
  - 함수 하나의 입출력 검증 → 단위 테스트
  - Supabase 실제 연결 → E2E 또는 mock
```

### 테스트 구조 — AAA 패턴

```typescript
it('A가 전액 냈을 때 B가 절반을 A에게 준다', () => {
  // Arrange
  const members = [memberA, memberB]
  const expenses = [makeExpense({ ... })]

  // Act: 두 함수가 협력하는 흐름
  const balances = calculateBalancesInKRW(members, expenses)
  const settlements = calculateSettlements(balances)

  // Assert
  expect(settlements[0]).toEqual({ from: 'B', to: 'A', amount: 50_000 })
})
```

### 픽스처 패턴

반복 사용하는 데이터는 `make*` 팩토리 함수로 만든다. 테스트마다 필요한 필드만 오버라이드한다.

```typescript
function makeExpense(overrides: Partial<Expense> & Pick<Expense, 'payments' | 'splitAmong' | 'totalAmount'>): Expense {
  return {
    id: crypto.randomUUID(),
    tripId: 'trip-001',
    description: '테스트 지출',
    currency: 'KRW',
    createdAt: '2025-07-01T00:00:00Z',
    ...overrides,
  }
}
```

---

## 단위/통합 테스트 공통

### 도구

| 항목 | 선택 | 이유 |
|------|------|------|
| 프레임워크 | Vitest 3 | Vite 7 설정 공유, path alias 자동 지원 |
| 환경 | happy-dom | 브라우저 없이 DOM API 제공 |
| React 렌더링 | @testing-library/react | renderHook, waitFor, act |

### 파일 위치

```
src/features/<domain>/__tests__/<target>.integration.test.ts
src/features/<domain>/__tests__/<target>.test.ts
```

도메인 내부에 둔다. 테스트 대상과 같은 디렉토리에서 관리하면 변경 시 함께 찾을 수 있다.

### 실행 명령

```bash
yarn test           # 전체 실행 (CI용)
yarn test:watch     # 파일 변경 감지 모드 (개발 중)
yarn test:ui        # 브라우저 UI로 결과 확인
```

### 설정 파일

[vitest.config.ts](../vitest.config.ts) — `src/**/*.test.ts` 만 대상으로 하고 `e2e/`는 제외한다.

### 현재 테스트 목록

| 파일 | 분류 | 케이스 |
|------|------|--------|
| `expense/__tests__/settlement.integration.test.ts` | 통합 | A가 전액 냈을 때 B가 절반을 돌려준다 외 11개 |
| `expense/__tests__/useExpenses.test.ts` | 단위 | payments 합계가 totalAmount로 자동 계산된다 |
| | | 지출을 추가하면 목록 맨 앞에 즉시 반영된다 |
| | | 지출을 삭제하면 목록에서 즉시 제거된다 |
| `trip/__tests__/useTrip.integration.test.ts` | 단위 | 해외 목적지면 isOverseas가 true이다 |
| | | 국내 목적지면 isOverseas가 false이다 |
| | | 여행 정보를 수정하면 캐시가 즉시 갱신된다 |
| | | 존재하지 않는 여행에 접근하면 에러가 전파된다 |

> 파일명의 `integration`은 이전 네이밍 관습. 현재 기준으로 settlement는 통합, useExpenses/useTrip는 단위에 해당한다.

---

## E2E 테스트

### 도구

| 항목 | 선택 | 이유 |
|------|------|------|
| 프레임워크 | Playwright | 자동 대기, 네트워크 인터셉트, 빠름 |
| Mock | MSW (Mock Service Worker) | Supabase 요청을 브라우저 레이어에서 인터셉트 |
| Auth Mock | Playwright `storageState` | Supabase localStorage 세션 직접 주입 |

### 파일 위치

```
e2e/
  helpers/
    auth-setup.ts    ← globalSetup: 인증 세션 localStorage 주입
  <feature>.spec.ts  ← 테스트 파일

src/
  mocks/
    handlers.ts      ← MSW 핸들러 (Supabase 요청 Mock 응답 정의)
    browser.ts       ← MSW worker 설정

public/
  mockServiceWorker.js  ← MSW Service Worker (msw init으로 생성)
```

### 실행 명령

```bash
yarn test:e2e                      # 전체 실행
yarn test:e2e --project=mobile     # 모바일(390×844) 뷰포트만
yarn test:e2e --project=desktop    # 데스크탑만
yarn test:e2e:ui                   # Playwright UI 모드
yarn test:e2e --headed             # 브라우저 창 보면서 실행
yarn test:e2e --debug              # 디버그 모드
```

### 설정 파일

[playwright.config.ts](../playwright.config.ts)

주요 설정:
- `globalSetup`: auth-setup.ts로 세션 미리 준비
- `storageState`: 모든 테스트에 인증 상태 자동 주입
- `webServer`: `--mode test` 플래그로 `.env.test`(VITE_MSW=true) 로드
- `timeout: 15_000`: 4개 worker 동시 시작 시 여유 확보

### MSW 동작 원리

```
앱 시작 (src/app/entry.client.tsx)
  ↓ VITE_MSW=true 감지
  ↓ worker.start() 완료 대기
  ↓ 앱 마운트
  ↓ 이후 모든 fetch → Service Worker 인터셉트
  ↓ handlers.ts에서 Mock 응답 반환
```

`worker.start()`가 완료된 후 앱이 마운트되므로 **첫 번째 요청부터** MSW가 가로챈다.

`entry.client.tsx`는 반드시 `src/app/` 안에 있어야 한다. React Router 7의 `appDirectory` 설정 때문에 `src/` 루트에 두면 인식되지 않는다.

### Handler 작성 패턴

```typescript
// src/mocks/handlers.ts
http.get('*/rest/v1/trips', ({ request }) => {
  const isSingle = request.headers.get('accept')?.includes('vnd.pgrst.object')
  return HttpResponse.json(isSingle ? MOCK_TRIP_ROW : [MOCK_TRIP_ROW])
})
```

Supabase `.single()` 호출은 `Accept: application/vnd.pgrst.object+json` 헤더를 보낸다. 이 헤더 유무로 단일 객체/배열 응답을 분기한다.

### 무엇을 E2E로 쓰는가

```
✓ 써야 하는 것
  - 핵심 사용자 여정 (탭 네비게이션, 폼 제출, 정산 흐름)
  - 여러 페이지에 걸친 흐름
  - URL 상태 유지 (query param, 새로고침)
  - 모바일/데스크탑 반응형 분기

✗ 쓰면 안 되는 것
  - 계산 로직 → 통합 테스트
  - API 응답 파싱 → 단위/통합 테스트
  - 모든 엣지 케이스 → 단위/통합 테스트
```

### 현재 테스트 목록

| 파일 | 대상 | 케이스 수 |
|------|------|----------|
| `e2e/trip-detail-tabs.spec.ts` | TripDetailPage 탭 네비게이션 | 4개 |

### 디버깅 팁

실패 시 `test-results/` 폴더에 스크린샷과 에러 컨텍스트가 저장된다.

```bash
# 실패한 테스트만 재실행
yarn test:e2e --last-failed

# 특정 테스트 파일만
yarn test:e2e e2e/trip-detail-tabs.spec.ts
```

---

## 공통 원칙

### 테스트 독립성

각 테스트는 서로 독립적이어야 한다. 이전 테스트 상태가 다음 테스트에 영향을 주지 않아야 한다.

- Vitest: `beforeEach`에서 `vi.restoreAllMocks()`로 spy 상태를 초기화한다. `createWrapper()`로 테스트마다 새 QueryClient를 만든다.
- Playwright: 테스트마다 새 브라우저 컨텍스트를 생성한다. `storageState`로 auth 상태만 공유한다.

### Locator 우선순위 (Playwright)

```
1. getByRole('button', { name: '추가' })   ← 접근성 기반, 가장 안정적
2. getByText('도쿄 여행')                   ← 텍스트 기반
3. getByTestId('add-trip-button')          ← data-testid 속성
4. locator('.add-button')                  ← CSS 선택자, 가장 취약
```

`getByText`는 부분 문자열 매칭으로 여러 요소에 걸릴 수 있다. strict mode violation이 발생하면 `getByRole`로 범위를 좁힌다.

### 환경변수 관리

| 파일 | 용도 |
|------|------|
| `.env` | 실제 Supabase 연결 (개발/프로덕션) |
| `.env.test` | MSW 활성화 (`VITE_MSW=true`) |

`.env.test`는 커밋한다. `.env`는 커밋하지 않는다.
