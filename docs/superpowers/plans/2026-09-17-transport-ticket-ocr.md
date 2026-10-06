# 탑승권 운항 정보 추출 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `TransportOperationalInfoSection`의 하드코딩된 터미널·게이트·좌석을 사용자 탑승권에서 얻은 값으로 바꾼다.

**Architecture:** 세 값을 `trip_transport_tickets`의 컬럼으로 저장한다. OCR 추출은 부수효과 없는 읽기(`getTicketInfo`)로 Edge Function에 두고, 저장은 별도 API(`updateTripTransportTicket`)가 맡는다. 업로드 경로가 둘을 잇는다. 추출 실패는 값을 비우고 사용자가 `EditableText`로 직접 고친다.

**Tech Stack:** Supabase (Postgres, Edge Functions/Deno), TanStack Query, React Native + Emotion (앱), MUI (웹), Vitest

**Spec:** [docs/superpowers/specs/2026-09-17-transport-ticket-ocr-design.md](../specs/2026-09-17-transport-ticket-ocr-design.md)

## Global Constraints

- 시각·값 모두 기존 관례를 따른다. 새 라이브러리를 추가하지 않는다.
- 주석은 남기지 않는다. 배경은 커밋 메시지로 남긴다. 단, 판단 근거가 코드로
  드러나지 않는 곳(추출 실패 정책, 필터 유지 이유)만 예외로 한 줄 허용한다 —
  기존 `trip-transport` 코드가 이 관례를 쓴다.
- `image`는 필수로 유지한다. `toTicket`의 `if (row.image == null) return []`
  필터를 지우지 않는다.
- 실시간 정보(`useFlightStatus`, `TransportRealtimeInfoSection`)를 건드리지
  않는다. 탑승권 값과 실시간 값을 섞지 않는다.
- 웹이 기준이다. 웹과 앱의 동작을 다르게 만들지 않는다.
- 추출 실패는 `undefined`로 둔다. 확신 없는 값을 넣지 않는다.
- 커밋 단위: 목적이 다르면 나눈다. 테스트는 그 동작을 구현한 커밋에 포함한다.
- 커밋 메시지는 한글 한 문장, 스코프 활용. 예: `feat(trip-transport): ...`
- Edge Function 환경변수는 `GOOGLE_PLACES_API_KEY`를 쓴다.
  기존 `GOOGLE_PLACES_API_KEY`·`GOOGLE_DIRECTIONS_API_KEY`와 같은 관례다.

## 의사결정 기록

계획 수립 중 자율 판단한 것들이다. 실행자는 이 결정을 바꾸지 않는다.

| 결정 | 선택 | 근거 |
| --- | --- | --- |
| OCR 엔진 | Google Cloud Vision `TEXT_DETECTION` | Google API 키가 이미 둘 쓰여 구조 변화 없음. 월 1000건 무료 |
| 추출 로직 위치 | `packages/domains`의 순수 함수, Edge Function은 얇게 호출 | `flight-status`가 이미 쓰는 패턴. 순수 함수라 단위 테스트 가능 |
| 추출 호출 시점 | `addTicket` 직후, 결과 대기 없음 | 업로드 성공이 추출에 종속되지 않아야 함 (스펙 원칙 5) |
| `updateTicket` 대상 필드 | `seat`·`terminal`·`gate`만 | `image`·`memberId`를 바꾸는 시나리오가 없음 |

## File Structure

| 파일 | 책임 |
| --- | --- |
| `supabase/migrations/20260917040000_transport_ticket_operational_info.sql` | 세 컬럼 추가 |
| `packages/domains/src/modules/trip-transport/ticketInfo.utils.ts` | OCR 텍스트 → 세 값. 순수 함수 |
| `packages/domains/src/modules/trip-transport/__tests__/ticketInfo.utils.test.ts` | 위 함수의 단위 테스트 |
| `packages/domains/src/modules/trip-transport/ticketInfo.api.ts` | `getTicketInfo` — Edge Function 호출 |
| `supabase/functions/ticket-info/index.ts` | Vision API 호출 + 추출. 저장하지 않음 |
| `supabase/functions/ticket-info/extract.ts` | `ticketInfo.utils.ts`의 Deno 사본 |
| `tripTransport.types.ts` | `TripTransportTicket`에 세 필드 추가 |
| `tripTransport.api.ts` | `updateTripTransportTicket` 추가, `toTicket` 매핑 확장 |
| `useTripTransport.ts` | `updateTicket` 뮤테이션 추가 |
| `useTransportTicketUpload.ts` (앱) | 업로드 후 추출→저장 연결 |
| `TransportFormPage.tsx` (웹) | 같은 연결. 웹은 훅이 없고 여기서 직접 올린다 |
| `TransportOperationalInfoSection.tsx` (앱/웹 각 1) | 하드코딩 제거, `EditableText` 배선 |

`ticketInfo.utils.ts`를 도메인에 두고 Edge Function이 사본을 갖는다.
`flight-status`가 `incheonFlightStatus.utils.ts`와
`functions/flight-status-watch/incheonFlights.ts`로 같은 구조를 이미 쓴다.
Deno가 워크스페이스 패키지를 import 할 수 없어서다.

---

### Task 1: 마이그레이션 — 세 컬럼 추가

**Files:**
- Create: `supabase/migrations/20260917040000_transport_ticket_operational_info.sql`

**Interfaces:**
- Consumes: 없음
- Produces: `trip_transport_tickets.seat`, `.terminal`, `.gate` (모두 `text`, nullable)

- [ ] **Step 1: 마이그레이션 작성**

```sql
-- 탑승권에 인쇄된 값이다. 실시간 게이트 변경과는 다른 것이라
-- 외부 API 응답으로 이 컬럼을 덮지 않는다.
-- 세 값 모두 이미지에서 나오므로 image 없는 행에는 담을 것이 없다.

ALTER TABLE "public"."trip_transport_tickets"
  ADD COLUMN IF NOT EXISTS "seat" "text",
  ADD COLUMN IF NOT EXISTS "terminal" "text",
  ADD COLUMN IF NOT EXISTS "gate" "text";
```

- [ ] **Step 2: 적용 확인**

Run: `npx supabase db push` (또는 프로젝트의 마이그레이션 적용 명령)
Expected: 에러 없이 적용. 실패하면 로컬 Supabase가 안 떠 있는지 확인한다.

- [ ] **Step 3: 커밋**

```bash
git add supabase/migrations/20260917040000_transport_ticket_operational_info.sql
git commit -m "feat(trip-transport): 티켓에 터미널·게이트·좌석 컬럼을 둔다"
```

---

### Task 2: 추출 순수 함수

**Files:**
- Create: `packages/domains/src/modules/trip-transport/ticketInfo.utils.ts`
- Test: `packages/domains/src/modules/trip-transport/__tests__/ticketInfo.utils.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces:
  ```ts
  export interface TicketInfo {
    seat?: string
    terminal?: string
    gate?: string
  }
  export function extractTicketInfo(text: string): TicketInfo
  ```

- [ ] **Step 1: 검증 케이스 제목만 적는다**

인터페이스 결함을 먼저 드러내기 위해 제목부터 쓴다.

```ts
import { describe, it } from 'vitest'

describe('extractTicketInfo', () => {
  it.todo('좌석 라벨 뒤의 값을 좌석으로 읽는다')
  it.todo('터미널 표기가 "제2여객터미널" 이어도 "2" 로 읽는다')
  it.todo('게이트가 영문자를 포함해도 그대로 읽는다')
  it.todo('라벨이 없으면 해당 값을 비운다')
  it.todo('같은 라벨이 여러 번 나오면 값을 비운다')
  it.todo('빈 텍스트에서 세 값이 모두 비어 있다')
})
```

- [ ] **Step 2: 첫 케이스를 실제 테스트로 바꾼다**

```ts
import { describe, expect, it } from 'vitest'
import { extractTicketInfo } from '../ticketInfo.utils'

describe('extractTicketInfo', () => {
  it('좌석 라벨 뒤의 값을 좌석으로 읽는다', () => {
    const text = 'KOREAN AIR\nSEAT 32A\nICN → KIX'

    expect(extractTicketInfo(text).seat).toBe('32A')
  })

  it.todo('터미널 표기가 "제2여객터미널" 이어도 "2" 로 읽는다')
  it.todo('게이트가 영문자를 포함해도 그대로 읽는다')
  it.todo('라벨이 없으면 해당 값을 비운다')
  it.todo('같은 라벨이 여러 번 나오면 값을 비운다')
  it.todo('빈 텍스트에서 세 값이 모두 비어 있다')
})
```

- [ ] **Step 3: 올바른 이유로 실패하는지 확인**

Run: `pnpm --filter @waylog/domains exec vitest run src/modules/trip-transport/__tests__/ticketInfo.utils.test.ts`
Expected: FAIL — `extractTicketInfo` 가 없어서 import 에러

- [ ] **Step 4: 최소 구현**

```ts
export interface TicketInfo {
  seat?: string
  terminal?: string
  gate?: string
}

const LABEL = {
  seat: /(?:SEAT|좌석)\s*[:\s]\s*([0-9]{1,3}[A-K])\b/gi,
  terminal: /(?:TERMINAL|터미널)\s*[:\s]?\s*T?([0-9])\b|제\s*([0-9])\s*여객터미널/gi,
  gate: /(?:GATE|탑승구|게이트)\s*[:\s]?\s*([0-9]{1,3}[A-Z]?)\b/gi,
} as const

// 라벨이 여러 번 나오면 어느 것이 내 것인지 정할 수 없다.
// 틀린 게이트를 보여주는 것은 빈 카드보다 나쁘므로 비운다.
function matchOnce(text: string, pattern: RegExp): string | undefined {
  const matches = [...text.matchAll(pattern)]
  if (matches.length !== 1) return undefined

  const [captured] = matches[0].slice(1).filter((group) => group != null)
  return captured
}

export function extractTicketInfo(text: string): TicketInfo {
  return {
    seat: matchOnce(text, LABEL.seat),
    terminal: matchOnce(text, LABEL.terminal),
    gate: matchOnce(text, LABEL.gate),
  }
}
```

- [ ] **Step 5: 첫 테스트 통과 확인**

Run: `pnpm --filter @waylog/domains exec vitest run src/modules/trip-transport/__tests__/ticketInfo.utils.test.ts`
Expected: 1 passed, 5 todo

- [ ] **Step 6: 남은 다섯 케이스를 채운다**

```ts
  it('터미널 표기가 "제2여객터미널" 이어도 "2" 로 읽는다', () => {
    expect(extractTicketInfo('제2여객터미널').terminal).toBe('2')
    expect(extractTicketInfo('TERMINAL T2').terminal).toBe('2')
  })

  it('게이트가 영문자를 포함해도 그대로 읽는다', () => {
    expect(extractTicketInfo('GATE 27A').gate).toBe('27A')
  })

  it('라벨이 없으면 해당 값을 비운다', () => {
    const info = extractTicketInfo('SEAT 32A')

    expect(info.seat).toBe('32A')
    expect(info.gate).toBeUndefined()
    expect(info.terminal).toBeUndefined()
  })

  it('같은 라벨이 여러 번 나오면 값을 비운다', () => {
    expect(extractTicketInfo('GATE 27\nGATE 31').gate).toBeUndefined()
  })

  it('빈 텍스트에서 세 값이 모두 비어 있다', () => {
    expect(extractTicketInfo('')).toEqual({
      seat: undefined,
      terminal: undefined,
      gate: undefined,
    })
  })
```

- [ ] **Step 7: 전체 통과 확인**

Run: `pnpm --filter @waylog/domains exec vitest run src/modules/trip-transport`
Expected: 6 passed (+ 기존 `tripTransport.utils.test.ts` 통과 유지)

통과하지 못하면 정규식을 고친다. **테스트를 고치지 않는다.**

- [ ] **Step 8: export 추가**

`packages/domains/src/modules/trip-transport/index.ts` 에 한 줄 추가:

```ts
export * from './ticketInfo.utils'
```

- [ ] **Step 9: 커밋**

```bash
git add packages/domains/src/modules/trip-transport/ticketInfo.utils.ts \
        packages/domains/src/modules/trip-transport/__tests__/ticketInfo.utils.test.ts \
        packages/domains/src/modules/trip-transport/index.ts
git commit -m "feat(trip-transport): 탑승권 텍스트에서 운항 정보를 뽑는다"
```

---

### Task 3: 티켓 타입과 수정 API

**Files:**
- Modify: `packages/domains/src/modules/trip-transport/tripTransport.types.ts:5-12`
- Modify: `packages/domains/src/modules/trip-transport/tripTransport.api.ts:40-62`, `:208-231`
- Modify: `packages/domains/src/modules/trip-transport/useTripTransport.ts:38-41`

**Interfaces:**
- Consumes: Task 1의 컬럼, Task 2의 `TicketInfo`
- Produces:
  ```ts
  // tripTransport.types.ts
  interface TripTransportTicket {
    id: string
    transportId: string
    memberId?: string
    image: string
    seat?: string
    terminal?: string
    gate?: string
    createdAt: string
  }

  // tripTransport.api.ts
  export type UpdateTripTransportTicket = { id: string } & TicketInfo
  export function updateTripTransportTicket(
    data: UpdateTripTransportTicket,
  ): Promise<TripTransportTicket>

  // useTripTransport.ts — 반환 객체에 추가
  updateTicket: (params: UpdateTripTransportTicket) => Promise<TripTransportTicket>
  ```

`UpdateTripTransportTicket`이 `TicketInfo`를 재사용한다. 수정 대상 필드와
추출 대상 필드가 같은 셋이므로 두 번 적지 않는다.

- [ ] **Step 1: 타입에 세 필드 추가**

`tripTransport.types.ts`의 `TripTransportTicket`:

```ts
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

- [ ] **Step 2: `RawTicket`과 SELECT, `toTicket` 확장**

`tripTransport.api.ts`에서 `RawTicket` 인터페이스에 세 필드를 추가한다
(파일 상단, `RawData` 위에 있다):

```ts
  seat: string | null
  terminal: string | null
  gate: string | null
```

`TRIP_TRANSPORT_SELECT`의 티켓 절을 바꾼다:

```ts
  trip_transport_tickets(id, transport_id, member_id, image, seat, terminal, gate, created_at)
```

`toTicket`의 반환 객체에 세 줄을 추가한다. **이미지 필터는 그대로 둔다.**

```ts
function toTicket(row: RawTicket): TripTransportTicket[] {
  if (row.image == null) return []

  return [
    {
      id: row.id,
      transportId: row.transport_id,
      memberId: row.member_id ?? undefined,
      image: row.image,
      seat: row.seat ?? undefined,
      terminal: row.terminal ?? undefined,
      gate: row.gate ?? undefined,
      createdAt: row.created_at,
    },
  ]
}
```

- [ ] **Step 3: 수정 API 추가**

`removeTripTransportTicket` 위에 넣는다:

```ts
export type UpdateTripTransportTicket = { id: string } & TicketInfo

export async function updateTripTransportTicket(data: UpdateTripTransportTicket) {
  const { data: updated, error } = await supabase
    .from('trip_transport_tickets')
    .update({
      seat: data.seat ?? null,
      terminal: data.terminal ?? null,
      gate: data.gate ?? null,
    })
    .eq('id', data.id)
    .select()
    .single()

  if (error) throw error

  const [ticket] = toTicket(updated!)
  assert(ticket != null, '티켓을 수정하지 못했습니다.')
  return ticket
}
```

`TicketInfo` import 를 파일 상단에 추가한다:

```ts
import type { TicketInfo } from './ticketInfo.utils'
```

- [ ] **Step 4: 뮤테이션 추가**

`useTripTransport.ts`의 `addTicket` 아래에 넣고, 반환 객체에 `updateTicket`을
추가한다:

```ts
  const { mutateAsync: updateTicket } = useMutation({
    mutationFn: (params: UpdateTripTransportTicket) => updateTripTransportTicket(params),
    onSuccess: () => refetch(),
  })
```

import 에 `updateTripTransportTicket`, `type UpdateTripTransportTicket`을
추가하고, 반환문을 고친다:

```ts
  return { data, refetch, add, update, remove, addTicket, updateTicket, removeTicket, ...queries }
```

- [ ] **Step 5: 타입 검사**

Run: `npx --yes tsc --noEmit -p apps/waylog-web/tsconfig.json 2>&1 | grep "error TS" | head -8`
Expected: 출력 없음

Run: `pnpm --filter @waylog/domains exec vitest run src/modules/trip-transport`
Expected: 전부 통과. 기존 테스트의 `createTicket` 헬퍼가 세 필드를 안 넣지만
모두 옵셔널이라 깨지지 않는다.

- [ ] **Step 6: 커밋**

```bash
git add packages/domains/src/modules/trip-transport/tripTransport.types.ts \
        packages/domains/src/modules/trip-transport/tripTransport.api.ts \
        packages/domains/src/modules/trip-transport/useTripTransport.ts
git commit -m "feat(trip-transport): 티켓의 운항 정보를 읽고 수정한다"
```

---

### Task 4: Edge Function — `ticket-info`

**Files:**
- Create: `supabase/functions/ticket-info/extract.ts`
- Create: `supabase/functions/ticket-info/index.ts`

**Interfaces:**
- Consumes: Task 2의 `extractTicketInfo` (사본)
- Produces:
  ```
  POST /functions/v1/ticket-info
    { image: string }            // 스토리지 공개 URL
    → 200 { seat?, terminal?, gate? }
    → 400 { error: string }      // image 누락
    → 502 { error: string }      // Vision 호출 실패
  ```

**저장하지 않는다.** 읽기만 한다. 티켓 행을 모르므로 갱신할 수도 없다.

- [ ] **Step 1: 추출 사본 만들기**

`supabase/functions/ticket-info/extract.ts`는
`packages/domains/src/modules/trip-transport/ticketInfo.utils.ts`의 내용을
그대로 복사한다. Deno 가 워크스페이스 패키지를 import 하지 못해서다
(`flight-status-watch/incheonFlights.ts`와 같은 구조).

파일 맨 위에 한 줄:

```ts
// packages/domains/src/modules/trip-transport/ticketInfo.utils.ts 의 사본이다.
// 한쪽을 고치면 다른 쪽도 고친다. 테스트는 도메인 쪽에 있다.
```

- [ ] **Step 2: 함수 작성**

```ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { extractTicketInfo } from './extract.ts'

const GOOGLE_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function detectText(image: string): Promise<string> {
  const res = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { source: { imageUri: image } },
            features: [{ type: 'TEXT_DETECTION' }],
          },
        ],
      }),
    },
  )

  if (!res.ok) throw new Error(`Vision ${res.status}`)

  const data = await res.json()
  const [result] = data.responses ?? []
  if (result?.error != null) throw new Error(result.error.message)

  return result?.fullTextAnnotation?.text ?? ''
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const { image } = await req.json().catch(() => ({ image: undefined }))
  if (typeof image !== 'string' || image.length === 0) {
    return json({ error: 'image 가 필요합니다.' }, 400)
  }

  try {
    return json(extractTicketInfo(await detectText(image)))
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : '추출에 실패했습니다.' }, 502)
  }
})
```

- [ ] **Step 3: 배포 후 수동 확인**

Run: `npx supabase functions deploy ticket-info`

키는 이미 등록된 `GOOGLE_PLACES_API_KEY` 를 그대로 쓴다. 새로 발급하지 않는다.
GCP Console 에서 그 키의 프로젝트에 Cloud Vision API 를 활성화하면 된다.
월 1000건 무료다.

실제 탑승권 이미지 URL로 호출해 텍스트가 오는지 확인한다.
값이 안 뽑히면 응답의 `fullTextAnnotation.text`를 로그로 찍어
Task 2의 정규식이 맞는지 본다.

- [ ] **Step 4: 커밋**

```bash
git add supabase/functions/ticket-info/
git commit -m "feat(ticket-info): 탑승권 이미지에서 운항 정보를 읽는 함수를 둔다"
```

---

### Task 5: 추출 호출 API

**Files:**
- Create: `packages/domains/src/modules/trip-transport/ticketInfo.api.ts`
- Modify: `packages/domains/src/modules/trip-transport/index.ts`

**Interfaces:**
- Consumes: Task 4의 엔드포인트, Task 2의 `TicketInfo`
- Produces:
  ```ts
  export function getTicketInfo(image: string): Promise<TicketInfo>
  ```

- [ ] **Step 1: 작성**

`supabase.functions.invoke` 를 쓴다 — `openGraph.api.ts`·`placeSearch.api.ts`·
`roadRoute.api.ts` 가 모두 이 방식이다. import 경로는 `../../gateways/client` 다.

```ts
import { supabase } from '../../gateways/client'
import type { TicketInfo } from './ticketInfo.utils'

// 추출은 읽기다. 저장은 updateTripTransportTicket 이 맡는다.
// 티켓 행과 무관해야 폼 prefill 에서도 쓸 수 있다.
export async function getTicketInfo(image: string): Promise<TicketInfo> {
  const { data, error } = await supabase.functions.invoke<TicketInfo>('ticket-info', {
    body: { image },
  })

  if (error != null) throw error
  return data ?? {}
}
```

- [ ] **Step 2: export 추가**

`index.ts`에 한 줄:

```ts
export * from './ticketInfo.api'
```

- [ ] **Step 3: 타입 검사**

Run: `npx --yes tsc --noEmit -p apps/waylog-web/tsconfig.json 2>&1 | grep "error TS" | head -8`
Expected: 출력 없음

- [ ] **Step 4: 커밋**

```bash
git add packages/domains/src/modules/trip-transport/ticketInfo.api.ts \
        packages/domains/src/modules/trip-transport/index.ts
git commit -m "feat(trip-transport): 탑승권 추출 함수를 호출한다"
```

---

### Task 6: 업로드 경로에 추출 연결

**Files:**
- Modify: `apps/waylog-app/src/features/trip/trip-transport/transport-ticket/useTransportTicketUpload.ts`
- Modify: `apps/waylog-web/src/features/trip/trip-transport/transport-form/TransportFormPage.tsx:81-86`

**Interfaces:**
- Consumes: Task 3의 `updateTicket`, Task 5의 `getTicketInfo`
- Produces: 없음 (기존 `upload` 시그니처 유지)

**웹과 앱의 구조가 다르다.** 앱은 `useTransportTicketUpload` 훅을 폼과 상세
양쪽에서 쓰지만, 웹은 `TransportFormPage.tsx`가 직접 업로드하고 상세에서
티켓을 추가하는 경로가 없다. 웹에 훅을 새로 만들지 않는다 — 호출 지점이
하나뿐이라 뺄 이유가 없고, 지금 없는 구조를 새로 들이지 않는다.

- [ ] **Step 1: 앱 업로드 훅 수정**

```ts
import { getTicketInfo, useTripTransport } from '@waylog/domains/modules/trip-transport'
import { uploadTransportTicketImage } from '../../../photo/photo.api'
import type { TransportTicketDraft } from './transportTicket.types'

interface UploadParams {
  transportId: string
  tickets: TransportTicketDraft[]
}

export function useTransportTicketUpload(tripId: string) {
  const { addTicket, updateTicket } = useTripTransport(tripId)

  const upload = async ({ transportId, tickets }: UploadParams) => {
    await Promise.all(
      tickets.map(async ({ uri, memberId }) => {
        const url = await uploadTransportTicketImage(transportId, uri)
        const ticket = await addTicket({ transportId, memberId, image: url })

        // 추출 실패가 업로드 성공을 무르지 않는다.
        const info = await getTicketInfo(url).catch(() => null)
        if (info != null) await updateTicket({ id: ticket.id, ...info })
      }),
    )
  }

  return { upload }
}
```

- [ ] **Step 2: 웹 업로드 지점에 같은 배선**

`TransportFormPage.tsx:38`의 구조 분해에 `updateTicket`을 추가한다:

```ts
  const { add, addTicket, updateTicket } = useTripTransport(tripId)
```

`getTicketInfo` import 를 추가한다 (같은 파일이 이미
`@waylog/domains/modules/trip-transport` 에서 `useTripTransport` 를 가져온다):

```ts
import { getTicketInfo, useTripTransport } from '@waylog/domains/modules/trip-transport'
```

`:81-86`의 티켓 업로드 블록을 고친다:

```ts
        // 티켓 한 장이 행 하나다. 이미지마다 소유자가 다를 수 있다.
        await Promise.all(
          tickets.map(async ({ file, memberId }) => {
            const url = await uploadTransportTicketImage(created.id, file)
            const ticket = await addTicket({ transportId: created.id, memberId, image: url })

            // 추출 실패가 업로드 성공을 무르지 않는다.
            const info = await getTicketInfo(url).catch(() => null)
            if (info != null) await updateTicket({ id: ticket.id, ...info })
          }),
        )
```

이 블록이 `try` 안에 있어 예외가 `setError` 로 간다. `getTicketInfo` 는
`catch` 로 삼키므로 추출 실패가 폼 에러로 새지 않는다.

- [ ] **Step 3: 타입 검사와 실제 확인**

Run: `npx --yes tsc --noEmit -p apps/waylog-web/tsconfig.json 2>&1 | grep "error TS" | head -8`
Expected: 출력 없음

Run: `cd apps/waylog-app && npx tsc --noEmit -p tsconfig.json 2>&1 | grep "error TS" | grep -iE "trip-transport" | head -5`
Expected: 출력 없음

실제 앱에서 탑승권을 올려 DB 에 세 값이 들어가는지 확인한다.
추출이 실패해도 티켓이 정상 등록되는지 함께 본다.

- [ ] **Step 4: 커밋**

```bash
git add apps/waylog-app/src/features/trip/trip-transport/transport-ticket/useTransportTicketUpload.ts \
        apps/waylog-web/src/features/trip/trip-transport/transport-form/TransportFormPage.tsx
git commit -m "feat(trip-transport): 티켓 업로드 후 운항 정보를 추출해 저장한다"
```

웹과 앱을 같은 커밋에 넣는다 — 한 동작을 두 플랫폼에 배선하는 하나의
변경이고, 한쪽만 되돌리면 웹·앱 동작이 갈린다.

---

### Task 7: 섹션 배선 (앱)

**Files:**
- Modify: `apps/waylog-app/src/features/trip/trip-transport/transport-detail/TransportOperationalInfoSection.tsx`

**Interfaces:**
- Consumes: Task 3의 `TripTransportTicket` 세 필드와 `updateTicket`
- Produces: 없음

- [ ] **Step 1: 하드코딩 제거하고 티켓 값 배선**

```tsx
import { AsyncBoundary } from '@waylog/react'
import { useTripTransport, useTripTransportDetail } from '@waylog/domains/modules/trip-transport'
import { StyleSheet, View } from 'react-native'
import { EditableText } from '~/shared/components'
import { Skeleton, Typography } from '~/shared/components/design-system'
import { palette } from '../../../../shared/config/tokens'
import { TransportDetailSectionError } from './TransportDetailSectionError'

const CARDS = [
  { key: 'terminal', label: '터미널' },
  { key: 'gate', label: '게이트' },
  { key: 'seat', label: '좌석(나)' },
] as const

interface Props {
  tripId: string
  transportId: string
}

export function TransportOperationalInfoSection({ tripId, transportId }: Props) {
  return (
    <AsyncBoundary
      resetKeys={[tripId, transportId]}
      pendingFallback={<TransportOperationalInfoSkeleton />}
      rejectedFallback={({ error, resetError }) => (
        <TransportDetailSectionError message={error.message} onRetry={resetError} />
      )}
    >
      <Resolved tripId={tripId} transportId={transportId} />
    </AsyncBoundary>
  )
}

function Resolved({ tripId, transportId }: Props) {
  const { transport, primaryTicket } = useTripTransportDetail({ tripId, transportId })
  const { updateTicket } = useTripTransport(tripId)

  // 값이 없는 이유가 "탑승권이 없다"면 유도는 티켓 섹션이 한다.
  // 두 섹션이 맞붙어 있어 여기서도 하면 같은 버튼이 둘 뜬다.
  if (primaryTicket == null) return null

  return (
    <View style={styles.grid} accessibilityLabel={`${transport.type} 운행 정보`}>
      {CARDS.map(({ key, label }) => (
        <View key={key} style={styles.card}>
          <Typography style={styles.label}>{label}</Typography>
          <EditableText
            value={primaryTicket[key] ?? ''}
            style={styles.value}
            onSubmit={(value) => updateTicket({ id: primaryTicket.id, [key]: value || undefined })}
          />
        </View>
      ))}
    </View>
  )
}

function TransportOperationalInfoSkeleton() {
  return (
    <View style={styles.grid}>
      {CARDS.map(({ key }) => (
        <View key={key} style={styles.card}>
          <Skeleton width={36} height={14} />
          <Skeleton width={28} height={20} />
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: 10, marginVertical: 8 },
  card: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  label: { fontSize: 12, color: palette.textSecondary },
  value: { fontSize: 16, fontWeight: '700' },
})
```

`updateTicket`에 `[key]: value` 로 한 필드만 넘긴다. Task 3의 `update`가
세 컬럼을 모두 쓰므로, 한 필드만 보내면 나머지가 `null`로 덮인다.
**Step 2에서 이 문제를 고친다.**

- [ ] **Step 2: 부분 수정이 다른 값을 지우지 않게 고친다**

Task 3의 `updateTripTransportTicket`은 세 컬럼을 무조건 쓴다. 게이트만 고쳤을
때 좌석이 `null`이 되므로, 넘어온 키만 쓰도록 바꾼다.

`tripTransport.api.ts`의 `updateTripTransportTicket`을 고친다:

```ts
export async function updateTripTransportTicket({ id, ...info }: UpdateTripTransportTicket) {
  const { data: updated, error } = await supabase
    .from('trip_transport_tickets')
    .update(
      Object.fromEntries(
        Object.entries(info).map(([column, value]) => [column, value ?? null]),
      ),
    )
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  const [ticket] = toTicket(updated!)
  assert(ticket != null, '티켓을 수정하지 못했습니다.')
  return ticket
}
```

키가 없으면 그 컬럼을 건드리지 않는다. Task 6의 전체 저장도 그대로 동작한다.

- [ ] **Step 3: `EditableText` import 경로 확인**

Run: `grep -n "EditableText" apps/waylog-app/src/features/trip/trip-expense/TripExchangeRateSettingButton.tsx`

기존 사용처와 같은 경로로 import 한다. `value` 가 `string | number` 제네릭이라
빈 문자열이 들어가면 빈 칸이 눌러서 입력 가능한 상태로 보이는지 실제 앱에서
확인한다. 빈 값이 안 눌리면 `format` 으로 placeholder 를 넣는다.

- [ ] **Step 4: 타입 검사와 실제 확인**

Run: `cd apps/waylog-app && npx tsc --noEmit -p tsconfig.json 2>&1 | grep "error TS" | grep -iE "trip-transport" | head -5`
Expected: 출력 없음

실제 앱에서 확인한다:
- 탑승권 있고 값 있음 → 세 값 표시
- 탑승권 있고 추출 실패 → 빈 카드, 눌러서 입력 가능
- 한 값만 고침 → 나머지 두 값이 남아 있다
- 탑승권 없음 → 섹션 안 보이고 티켓 섹션의 유도만 하나

- [ ] **Step 5: 커밋**

```bash
git add apps/waylog-app/src/features/trip/trip-transport/transport-detail/TransportOperationalInfoSection.tsx \
        packages/domains/src/modules/trip-transport/tripTransport.api.ts
git commit -m "feat(trip-transport): 운항 정보를 탑승권 값으로 보이고 고친다"
```

---

### Task 8: 섹션 배선 (웹)

**Files:**
- Modify: `apps/waylog-web/src/features/trip/trip-transport/transport-detail/TransportOperationalInfoSection.tsx`

**Interfaces:**
- Consumes: Task 3, Task 7 Step 2의 부분 수정 동작
- Produces: 없음

- [ ] **Step 1: 앱과 같은 구조로 고친다**

```tsx
import { Skeleton, Stack, Typography } from '@mui/material'
import { useTripTransport, useTripTransportDetail } from '@waylog/domains/modules/trip-transport'
import { AsyncBoundary } from '@waylog/react'
import { EditableText } from '../../../../shared/components/EditableText'
import { TransportDetailSectionError } from './TransportDetailSectionError'

const CARDS = [
  { key: 'terminal', label: '터미널' },
  { key: 'gate', label: '게이트' },
  { key: 'seat', label: '좌석(나)' },
] as const

interface Props {
  tripId: string
  transportId: string
}

export function TransportOperationalInfoSection({ tripId, transportId }: Props) {
  return (
    <AsyncBoundary
      resetKeys={[tripId, transportId]}
      pendingFallback={<TransportOperationalInfoSkeleton />}
      rejectedFallback={({ error, resetError }) => (
        <TransportDetailSectionError message={error.message} onRetry={resetError} />
      )}
    >
      <Resolved tripId={tripId} transportId={transportId} />
    </AsyncBoundary>
  )
}

function Resolved({ tripId, transportId }: Props) {
  const { transport, primaryTicket } = useTripTransportDetail({ tripId, transportId })
  const { updateTicket } = useTripTransport(tripId)

  // 값이 없는 이유가 "탑승권이 없다"면 유도는 티켓 섹션이 한다.
  if (primaryTicket == null) return null

  return (
    <Stack direction="row" gap={1.25} my={1} aria-label={`${transport.type} 운행 정보`}>
      {CARDS.map(({ key, label }) => (
        <Stack
          key={key}
          flex={1}
          alignItems="center"
          gap={0.75}
          py={1.75}
          borderRadius={3}
          bgcolor="rgba(0,0,0,0.04)"
        >
          <Typography fontSize={12} color="text.secondary">
            {label}
          </Typography>
          <EditableText
            value={primaryTicket[key] ?? ''}
            fontSize={16}
            fontWeight={700}
            onSubmit={(value) => void updateTicket({ id: primaryTicket.id, [key]: value || undefined })}
          />
        </Stack>
      ))}
    </Stack>
  )
}

function TransportOperationalInfoSkeleton() {
  return (
    <Stack direction="row" gap={1.25} my={1}>
      {CARDS.map(({ key }) => (
        <Stack
          key={key}
          flex={1}
          alignItems="center"
          gap={0.75}
          py={1.75}
          borderRadius={3}
          bgcolor="rgba(0,0,0,0.04)"
        >
          <Skeleton width={36} height={14} />
          <Skeleton width={28} height={20} />
        </Stack>
      ))}
    </Stack>
  )
}
```

웹 `EditableText`의 `onSubmit`은 `(value: string) => void` 라 앱과 반환형이
다르다. `void` 로 감싼다.

- [ ] **Step 2: import 경로와 사용법 확인**

Run: `grep -n "EditableText" -B 2 -A 12 apps/waylog-web/src/features/trip/trip-memo/TripMemo.desktop.tsx | head -30`

기존 사용처와 같은 경로·같은 방식으로 쓴다.

- [ ] **Step 3: 타입 검사와 실제 확인**

Run: `npx --yes tsc --noEmit -p apps/waylog-web/tsconfig.json 2>&1 | grep "error TS" | head -8`
Expected: 출력 없음

웹에서 Task 7 Step 4의 네 가지를 같게 확인한다. 앱과 동작이 같아야 한다.

- [ ] **Step 4: 커밋**

```bash
git add apps/waylog-web/src/features/trip/trip-transport/transport-detail/TransportOperationalInfoSection.tsx
git commit -m "feat(trip-transport): 웹에서도 운항 정보를 탑승권 값으로 보인다"
```

---

### Task 9: 문서 갱신

**Files:**
- Modify: `docs/codebase.md`
- Modify: `docs/trip-transport-definition.md`

- [ ] **Step 1: `codebase.md` 갱신**

새 파일과 의존 방향을 남긴다:
- `packages/domains/src/modules/trip-transport/ticketInfo.utils.ts` — 추출 순수 함수
- `packages/domains/src/modules/trip-transport/ticketInfo.api.ts` — Edge Function 호출
- `supabase/functions/ticket-info/` — Vision 호출. `extract.ts`는 도메인의 사본
- `trip_transport_tickets`에 `seat`·`terminal`·`gate`

갱신 전에 파일 위치·의존 방향이 문서와 어긋나지 않는지 확인한다.

- [ ] **Step 2: 정의서의 단계 표 갱신**

`docs/trip-transport-definition.md`의 단계 표에서 5단계(OCR 입력 보조)가
부분 구현됐음을 남긴다. 티켓 업로드 시 추출은 됐고, 폼 prefill 은 아직이다.

- [ ] **Step 3: 커밋**

```bash
git add docs/codebase.md docs/trip-transport-definition.md
git commit -m "docs(trip-transport): 탑승권 운항 정보 추출 구조를 남긴다"
```

---

## 실행 순서

의존 관계로 웨이브를 묶는다. 같은 파일을 만지는 태스크는 같은 웨이브에 넣지
않는다.

```
웨이브 1  Task 1 (마이그레이션), Task 2 (추출 함수)      ← 병렬
웨이브 2  Task 3 (타입·API)                              ← 1, 2 필요
웨이브 3  Task 4 (Edge Function), Task 5 (호출 API)      ← 병렬. 2, 3 필요
웨이브 4  Task 6 (업로드 배선)                            ← 3, 5 필요
웨이브 5  Task 7 (앱 섹션)                                ← 3 필요. api.ts 수정 포함
웨이브 6  Task 8 (웹 섹션)                                ← 7 필요 (부분 수정 동작)
웨이브 7  Task 9 (문서)
```

Task 7과 8을 나눈 이유는 Task 7 Step 2가 `tripTransport.api.ts`를 고치기
때문이다. 웹이 그 동작에 의존하므로 앞세운다.

## Self-Review

**스펙 커버리지**

| 스펙 요구 | 태스크 |
| --- | --- |
| 세 컬럼 추가, `image` 필수 유지 | 1 |
| `toTicket` 필터 유지 | 3 Step 2 |
| 추출 순수 함수 + 6개 검증 케이스 | 2 |
| 확신 없으면 넣지 않음 (중복 라벨) | 2 Step 6 |
| `getTicketInfo` 읽기 전용 | 4, 5 |
| 업로드 시 1회, 실패가 등록에 무영향 | 6 |
| `EditableText` 직접 수정 | 7, 8 |
| 티켓 없으면 섹션 숨김 | 7, 8 |
| 실시간 정보 미변경 | 전 태스크 (Global Constraints) |
| 인천 무관하게 동작 | 7 Step 4, 8 Step 3 확인 항목 |

스펙의 "일행 좌석 보기"·"기차·버스 추출"·"폼 prefill"은 범위 밖이라 태스크가
없다. 의도한 것이다.

**타입 일관성**

`TicketInfo`가 Task 2에서 정의되고 Task 3(`UpdateTripTransportTicket`),
Task 5(`getTicketInfo` 반환), Task 4(사본)에서 쓰인다. 이름이 일치한다.
`updateTicket`은 Task 3에서 정의되고 6·7·8에서 쓰인다.

**발견해 고친 것**

Task 3의 `update`가 세 컬럼을 무조건 쓰는데, Task 7이 한 필드만 넘긴다.
그대로면 게이트를 고칠 때 좌석이 지워진다. Task 7 Step 2에 수정을 넣었다.
