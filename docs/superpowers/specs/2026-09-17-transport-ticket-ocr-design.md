# 탑승권 운항 정보 설계

`TransportOperationalInfoSection`의 터미널·게이트·좌석은 하드코딩이다.
이 값들을 사용자의 탑승권에서 얻는다.

## 문제

```ts
const INFORMATION_CARDS = [
  ['터미널', '2'],
  ['게이트', '23'],
  ['좌석(나)', '32A'],
] as const
```

세 값 모두 어디에서도 오지 않는다. 좌석은 입력받는 곳조차 없다.

## 값의 출처

터미널·게이트는 두 곳에서 얻을 수 있고, **둘은 다른 것이다.**

| 출처 | 의미 | 성질 |
| --- | --- | --- |
| 탑승권 | 발권 시점의 예정 | 정적. 사용자 소유 |
| 인천공항 API | 지금 이 순간 | 변동. 외부 소유 |

정의서 원칙 6번이 이 둘을 섞지 말라고 한다 — "예정 정보와 실시간 정보를
분리한다. 외부 응답으로 원본을 덮어쓰지 않는다."

**이 문서는 탑승권만 다룬다.** 실시간 값은 `TransportRealtimeInfoSection`이
이미 `useFlightStatus`로 가져와 자기 영역에서 보여주고 있고, 건드리지 않는다.

두 섹션은 서로를 참조하지 않는다. 우선순위 규칙도, 덮어쓰기도 없다.

## 저장 위치

`trip_transport_tickets`에 담는다. 교통편(`trip_transports`)이 아니다.

좌석·게이트·터미널은 **탑승권에 인쇄된 값**이다. 티켓 행이 이미 그 이미지를
갖고 있으므로, 같은 행에 두면 값과 근거가 한 자리에 있다. OCR이 붙을 자리도
여기다 — 추출 대상 이미지와 추출 결과가 같은 행이다.

교통편에 두면 일행이 한 값을 공유하게 되어 서로 덮어쓴다. 티켓 행은 이미
`member_id`를 가지므로 "내 탑승권의 좌석"이 자연히 나온다.

```sql
ALTER TABLE "public"."trip_transport_tickets"
  ADD COLUMN IF NOT EXISTS "seat" "text",
  ADD COLUMN IF NOT EXISTS "terminal" "text",
  ADD COLUMN IF NOT EXISTS "gate" "text";
```

`image`는 필수로 유지한다. 세 값이 모두 이미지에서 나오므로 이미지 없는
행에는 담을 것이 없다. `toTicket`의 이미지 필터도 그대로 둔다.

체크인 전에는 탑승권이 없어 값을 적어둘 수 없다. 감수한다 — 이 값들을 보는
시점은 대부분 공항이고, 그때는 탑승권이 손에 있다.

## 추출

### 시점

**티켓 업로드 시 1회.** 조회 시점에 추출하지 않는다.

조회 시 추출은 실패를 기록할 곳이 없어 못 읽는 티켓에 대해 화면을 열 때마다
반복한다. 일행이 동시에 열면 같은 이미지를 여러 번 읽고 여러 번 갱신한다.
업로드는 한 번만 일어나므로 이 문제들이 생기지 않는다.

### 위치

Edge Function 하나로 웹·앱이 같은 경로를 쓴다.

앱은 온디바이스 OCR(ML Kit)이 가능하지만 웹에는 대응물이 없다. 플랫폼마다
구현을 두면 같은 탑승권이 다른 결과를 내고, 웹이 기준이라는 원칙과 어긋난다.
저빈도 작업이라 클라우드 호출 비용이 문제가 되지 않는다.

업로드 형식이 플랫폼마다 다르다 — 앱은 `.jpg`, 웹은 `.webp`다. Edge Function은
스토리지 URL을 받으므로 양쪽 모두 처리할 수 있어야 한다.

### 실패

추출 실패는 해당 값을 `null`로 둔다. 업로드와 등록에는 영향을 주지 않는다
(정의서 원칙 5).

**확신이 없으면 넣지 않는다.** 터미널은 `T2`·`2`·`제2여객터미널`, 게이트는
`27`·`27A`·`GATE 27`처럼 표기가 제각각이라 오인식이 잦다. 틀린 게이트를
보여주는 것은 빈 카드보다 나쁘다.

### 보조임

추출은 입력 보조다. 세 값 모두 사용자가 직접 고칠 수 있다.

`EditableText`가 웹·앱 양쪽에 있고 인터페이스가 같다
(`value`, `onSubmit(value: string)`). 카드 값에 그대로 쓴다.

사용자가 고친 값은 그대로 남는다. 추출이 업로드 시 1회뿐이므로 다시 덮일 일이
없다.

## 인터페이스

### 도메인

```ts
// tripTransport.types.ts
export interface TripTransportTicket {
  id: string
  transportId: string
  memberId?: string
  image: string
  seat?: string
  terminal?: string
  gate?: string
  createdAt: string
}
```

티켓 수정 API가 없다. `EditableText`의 제출을 받을 곳이 필요하다.

```ts
// tripTransport.api.ts
export type UpdateTripTransportTicket = {
  id: string
} & Partial<Pick<TripTransportTicket, 'seat' | 'terminal' | 'gate'>>

export async function updateTripTransportTicket(
  data: UpdateTripTransportTicket,
): Promise<TripTransportTicket>
```

`image`·`memberId`는 수정 대상이 아니다. 이미지를 바꾸는 것은 티켓을 다시
올리는 일이고, 소유자를 바꾸는 시나리오는 없다.

```ts
// useTripTransport.ts — 기존 addTicket/removeTicket 옆에 붙인다
const { mutateAsync: updateTicket } = useMutation({
  mutationFn: (params: UpdateTripTransportTicket) => updateTripTransportTicket(params),
  onSuccess: () => refetch(),
})
```

### Edge Function

**추출은 읽기만 한다. 저장하지 않는다.**

```
getTicketInfo(image) → { seat?: string, terminal?: string, gate?: string }
```

함수가 티켓 행을 직접 갱신하면 티켓이 이미 존재할 때만 쓸 수 있다. 추출을
부수효과 없는 읽기로 두면 티켓 행과 무관해져, 행이 생기기 전에도 부를 수 있다.

값의 저장은 앞에서 정한 `updateTripTransportTicket`이 맡는다. 추출과 저장이
갈라져 있고, 이어 붙이는 것은 호출부의 몫이다.

```
업로드   uploadImage → addTicket → getTicketInfo → updateTicket
```

`useTransportTicketUpload`에서 `addTicket` 직후에 잇는다. 결과를 기다리지
않으며, 실패해도 업로드는 이미 끝나 있다. 갱신은 `refetch`로 화면에 들어온다.

이 분리는 폼 prefill을 위한 자리를 남긴다 — 티켓 등록 폼에서 이미지를 고른
직후 `getTicketInfo`만 불러 입력란을 미리 채우는 경로다. **아직 설계하지
않았다.** 입력으로 무엇을 받을지(업로드 전 이미지인지 스토리지 URL인지)가
그 시점에 정해지며, 그에 따라 이 함수의 시그니처가 확정된다.

### 화면

`TransportOperationalInfoSection`의 카드 세 장을 유지한다. 하드코딩된 상수만
걷어낸다.

```ts
const { primaryTicket } = useTripTransportDetail({ tripId, transportId })
```

값은 `primaryTicket`에서 온다. 세 카드 모두 `EditableText`로 수정 가능하다.

티켓이 없으면 **섹션을 보여주지 않는다.**

값이 없는 이유가 "탑승권이 없다"이므로 탑승권 추가를 유도하고 싶어지지만,
바로 아래 `TransportTicketsSection`이 이미 그 유도를 하고 있다
(`hasNoTicket`일 때의 "탑승권 추가"). 두 섹션이 상세 화면에서 맞붙어 있어
같은 버튼이 둘 뜬다. 유도는 티켓 섹션의 책임으로 남긴다.

티켓은 있는데 세 값이 모두 비어 있는 경우(추출 실패)는 다르다. 이때는 카드를
빈 채로 보여준다 — 사용자가 눌러서 직접 채울 수 있어야 하기 때문이다.

인천 노선인지는 이 섹션과 무관하다. 어느 공항이든 탑승권만 있으면 동작한다.

## 검증

### 단위 — OCR 추출 (`ticketOcr.utils.ts`)

추출은 순수 함수로 분리한다. OCR 엔진이 준 텍스트에서 세 값을 뽑는 부분이
검증 대상이다.

```
it.todo('좌석 라벨 뒤의 값을 좌석으로 읽는다')
it.todo('터미널 표기가 "제2여객터미널" 이어도 "2" 로 읽는다')
it.todo('게이트가 영문자를 포함해도 그대로 읽는다')
it.todo('라벨이 없으면 해당 값을 비운다')
it.todo('같은 라벨이 여러 번 나오면 값을 비운다')
it.todo('빈 텍스트에서 세 값이 모두 비어 있다')
```

마지막 두 개가 "확신 없으면 넣지 않는다"를 지키는 지점이다.

### 단위 — 티켓 값 선택 (`tripTransport.utils.ts`)

```
it.todo('내 티켓의 좌석을 고른다')
it.todo('내 티켓이 없으면 공용 티켓의 좌석을 고른다')
it.todo('티켓이 없으면 비어 있다')
```

`findMyTicket`이 이미 이 규칙을 갖고 있어 재사용한다.

### 화면

`*.tsx`는 컴포넌트 테스트 인프라가 없다. 빌드와 실제 앱 확인으로 검증한다.

- 탑승권 있음 → 세 값 표시, 각각 수정 가능
- 탑승권 있고 추출 실패 → 빈 카드 표시, 직접 입력 가능
- 탑승권 없음 → 섹션 자체가 안 보이고, 티켓 섹션의 유도만 하나 뜬다
- 인천 아닌 노선 → 동일하게 동작

## 범위 밖

- **실시간 값과의 병합.** 탑승권 게이트와 API 게이트를 한 카드에서 비교해
  보여주는 것. 두 섹션을 분리해 둔 이유가 이것이며, 필요해지면 그때 설계한다.
- **기차·버스.** 탑승권 형식이 항공과 달라 추출 규칙을 공유할 수 없다.
  컬럼은 종류와 무관하므로 나중에 추출만 붙이면 된다.
- **일행 좌석 보기.** 각자 자기 좌석만 본다. 컬럼이 티켓 행에 있으므로
  필요해지면 조회만 넓히면 된다.
- **폼 prefill.** 티켓 등록 폼에서 이미지를 고른 직후 값을 미리 채우는 것.
  `getTicketInfo`를 읽기 전용으로 분리해 자리는 열어 뒀으나, 입력 형식이
  정해지지 않았다.
