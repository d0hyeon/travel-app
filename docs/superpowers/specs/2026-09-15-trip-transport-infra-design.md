# 교통 관리 인프라 설계

[`docs/trip-transport-definition.md`](../../trip-transport-definition.md)의 1차 범위 중
데이터·타입 계층만 다룬다. UI와 React Query 훅은 이 문서의 범위 밖이다.

## 범위

포함

- `TransportType` 독립 위치 이동, 경로용 좁힌 타입 도입
- `transport_reservations` · `transport_tickets` 테이블
- `trip-transport` 도메인 모듈 (타입 · API · 유틸)
- `ensureTripPlace` — 공항·역의 여행 장소 보장
- 티켓 이미지 업로드 (웹 · 앱)
- 교통 구간을 경계로 한 지도 경로 분할

제외

- UI 컴포넌트 전부
- React Query 훅
- 티켓 읽기용 presigned URL — 아래 "티켓 이미지 공개 범위" 참조
- `trip_places.status` 죽은 컬럼 정리 — 아래 "범위 밖으로 둔 것" 참조

## 정의서에서 수정한 것

정의서 작성 시점에 실제 스키마와 어긋난 지점이 세 개 있었다.
이 문서의 결정이 정의서에 우선한다.

### 출발지·도착지는 `places`가 아니라 `trip_places`를 참조한다

정의서는 "공항·역·터미널은 `places`를 그대로 쓴다"고 하고 `departurePlaceId`를 뒀다.
그러나 `routes.place_ids`가 가리키는 것은 `places.id`가 아니라 `trip_places.id`다.

`places.id`를 참조하면 정의서의 핵심 요구 — "공항·역은 Place이므로 사용자가 직접 경로의
`placeIds`에 넣는다" — 가 성립하지 않는다. 경로에 넣으려면 `trip_places` 행이 있어야 하고,
그러면 교통편이 가리키는 id와 경로가 가리키는 id가 서로 다른 테이블이 되어
"이 경로 지점이 교통 구간의 경계인가"를 대조할 수 없다. 지도 분할이 이 대조에 의존한다.

참조 방향은 한 줄로 흐른다. 각 계층은 바로 아래만 안다.

```
places  ──▶  trip_places  ──▶  transport_reservations  ──▶  transport_tickets
전역 POI     여행-장소 연결       여행의 교통편                구간별 티켓
```

### `transit` 카테고리는 교통과 무관하지 않다

정의서는 `PlaceCategoryType.대중교통`(`transit`)이 "장소 분류이며 이 타입과 무관하다"고
선을 그었다. 타입으로서는 맞지만, `get_explored_places`는 이미
`tp.category IS DISTINCT FROM 'transit'`로 교통 장소를 탐색 통계에서 제외하고 있다.

공항·역 `trip_place`의 카테고리를 비워두면 이 필터에 걸리지 않아
인천공항이 "가장 많이 저장된 장소" 상위를 차지한다. `transit`으로 고정한다.

### `TransportType` 확장은 경로 타입을 넓힌다

현재 값은 도보·차량 둘뿐이고 소비처가 웹·앱 5곳이다. 5개로 넓히면
`RouteLeg.transport`가 항공을 받을 수 있는 타입이 되는데 실제로는 들어오지 않는다.
정의서가 말한 "좁혀 쓴다"를 타입으로 강제한다.

## 타입

### TransportType 이동

`packages/domains/src/modules/route/route.types.ts`에 있는 `TransportType`을
route 모듈 바깥으로 옮긴다. 특정 도메인의 소유물이 아니며, 소비자가 필요한 만큼 좁혀 쓴다.

목적지는 `packages/domains/src/modules/transport/transport.types.ts`다.
`location` 모듈이 이미 같은 결의 공용 vocabulary로 서 있다 — 특정 기능이 아니라
여러 도메인이 참조하는 어휘를 담는 자리다. `trip-transport`(여행 종속 예약 데이터)와는
다른 모듈이며, `trip-transport`가 `transport`를 참조한다.

```ts
export const TransportType = {
  도보: 'walk',
  차량: 'car',
  항공: 'flight',
  기차: 'train',
  버스: 'bus'
} as const
export type TransportType = ValueOf<typeof TransportType>
export const TransportTypeLabel = reverseKeyValue(TransportType)
```

경로는 좁힌 타입을 정의해 쓴다.

```ts
export type RouteTransportType = Extract<TransportType, 'walk' | 'car'>

export interface RouteLeg {
  transport: RouteTransportType
  // 나머지 필드 유지
}
```

교통 관리는 항공·기차·버스만 쓴다.

```ts
export type ReservationTransportType = Extract<TransportType, 'flight' | 'train' | 'bus'>
```

소비처 갱신 대상:

| 파일 | 영향 |
| --- | --- |
| `route/roadRoute.api.ts` | `TransportType.차량` 임포트 경로 |
| `route/route.types.ts` | `RouteTransportType` 정의, `RouteLeg` 갱신 |
| 웹 `route/road-route/roadRoute.schema.ts` | `t.custom<TransportType>()` → `t.custom<RouteTransportType>()` |
| 웹 `trip/trip-route/TransportIcon.tsx` | 임포트 경로 |
| 웹 `trip/trip-route/components/RoutePath.tsx` | `TransportTypeLabel` 임포트 경로 |
| 앱 `trip/trip-route/TransportIcon.tsx` | 임포트 경로 |

`TransportTypeLabel`은 5개 전체의 라벨을 갖게 되지만, 경로 UI는 좁힌 타입의 값만
넘기므로 표시되는 라벨은 달라지지 않는다.

### TransportReservation

```ts
export interface TransportReservation {
  id: string
  tripId: string
  type: ReservationTransportType

  departureTripPlaceId: string
  arrivalTripPlaceId: string
  departureAt: string           // UTC ISO
  arrivalAt?: string            // UTC ISO
  departureTimezone?: string    // IANA. 1차에서는 채우지 않는다
  arrivalTimezone?: string

  airline?: string
  flightNumber?: string
  provider?: string
  serviceNumber?: string

  createdAt: string
}

export interface TransportTicket {
  id: string
  reservationId: string
  memberId?: string             // 없으면 일행 공용 티켓
  images: string[]              // R2 public URL
  createdAt: string
}
```

정의서대로 운항편 마스터와 예약을 분리하지 않고, 환승·왕복은 구간마다 개별 등록한다.
같은 예약(PNR)이라는 사실은 담지 않는다.

### 파일 배치

기존 도메인 모듈(`trip-checklist`, `trip-memo`)과 같은 구성이다.

```
packages/domains/src/modules/
├── transport/                      공용 vocabulary
│   ├── transport.types.ts          TransportType, TransportTypeLabel
│   └── index.ts
└── trip-transport/                 여행 종속 예약 데이터
    ├── tripTransport.types.ts      TransportReservation, TransportTicket
    ├── tripTransport.api.ts        조회·생성·수정·삭제, RawData ↔ 도메인 변환
    ├── tripTransport.utils.ts      순수 로직
    ├── __tests__/
    └── index.ts
```

훅(`useTripTransport.ts`)은 이번 범위에 만들지 않는다.

## 테이블

### transport_reservations

```sql
create table public.transport_reservations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  type text not null,
  departure_trip_place_id uuid not null references public.trip_places(id),
  arrival_trip_place_id uuid not null references public.trip_places(id),
  departure_at timestamptz not null,
  arrival_at timestamptz,
  departure_timezone text,
  arrival_timezone text,
  airline text,
  flight_number text,
  provider text,
  service_number text,
  created_at timestamptz not null default now()
);
```

`trip_places` 참조에 `on delete cascade`를 걸지 않는다. 공항 장소를 지웠을 때
교통편이 조용히 사라지는 대신 삭제가 막히는 편이 낫다.

정렬·알림 계산이 `departure_at` 기준이므로 `(trip_id, departure_at)` 인덱스를 둔다.

### transport_tickets

```sql
create table public.transport_tickets (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.transport_reservations(id) on delete cascade,
  member_id uuid,
  images text[] not null default '{}',
  created_at timestamptz not null default now()
);
```

티켓을 예약의 jsonb 컬럼이 아니라 별도 테이블로 둔 이유는 동시 편집이다.
일행 각자가 자기 티켓을 올리는 것이 기본 시나리오인데, jsonb 배열이면
두 명이 동시에 올릴 때 한쪽이 덮어써진다.

`member_id`는 `checklist.member_id`와 같은 결로 nullable이며, 없으면 공용 티켓이다.

### RLS

기존 여행 종속 테이블은 `can_access_trip(trip_id)` 한 줄로 정책을 건다
(`checklist_access`가 그 형태다). `transport_reservations`는 `trip_id`를 가지므로
그대로 쓴다.

```sql
create policy "transport_reservations_access" on public.transport_reservations
  using (public.can_access_trip(trip_id))
  with check (public.can_access_trip(trip_id));
```

`transport_tickets`는 `trip_id`가 없어 같은 형태를 쓸 수 없다.
예약을 거쳐 여행에 닿는다.

```sql
create policy "transport_tickets_access" on public.transport_tickets
  using (exists (
    select 1 from public.transport_reservations r
    where r.id = reservation_id and public.can_access_trip(r.trip_id)
  ))
  with check (exists (
    select 1 from public.transport_reservations r
    where r.id = reservation_id and public.can_access_trip(r.trip_id)
  ));
```

티켓에 `trip_id`를 비정규화해 넣으면 정책이 한 줄로 끝나지만,
예약과 티켓의 여행이 어긋날 수 있는 두 번째 진실이 생긴다. 조인을 택한다.

## ensureTripPlace

교통편 등록은 출발지·도착지 `trip_place`를 필요로 하는데, 해당 장소가
이미 여행 장소 목록에 있을 수도 없을 수도 있다. 없으면 만들어서 연결한다.

place 모듈이 소유한다. 교통 모듈은 호출해서 id만 얻는다 —
교통이 장소를 만드는 방법을 알 필요가 없다.

```ts
export async function ensureTripPlace(tripId: string, placeId: string): Promise<string>
```

- 해당 `(tripId, placeId)`의 `trip_place`가 있으면 그 id를 돌려준다
- 없으면 `category = 'transit'`으로 만들고 새 id를 돌려준다
- `status`는 명시하지 않고 DB 기본값에 맡긴다 (죽은 컬럼에 새 의미를 얹지 않는다)

정의서가 "시스템이 자동 삽입하지 않는다"고 못박은 것은 **경로(`route.placeIds`)** 이지
`trip_places` 등록이 아니다. 여행 장소로 존재하는 것과 경로에 꽂히는 것은 다른 층이다.
경로 삽입은 여전히 사용자 몫이다.

### 검증 케이스

```
ensureTripPlace
  it.todo('이미 있는 여행 장소는 기존 id를 돌려준다')
  it.todo('없으면 transit 카테고리로 만들어 새 id를 돌려준다')
  it.todo('같은 장소를 두 번 보장해도 행이 하나만 생긴다')
```

## 시각과 타임존

시각은 UTC로 저장하고 표기만 각 지점의 타임존으로 포맷한다.
알림 계산·정렬·비교는 전부 UTC 단일 축에서 한다.

타임존 컬럼은 만들되 **1차에서는 채우지 않는다.** nullable로 두고,
값이 없으면 기기 로컬 타임존으로 폴백한다.

정의서는 "출발지·도착지 Place의 좌표에서 변환해 채운다"고 했으나,
좌표 → IANA 변환은 경계 폴리곤 데이터를 요구한다. 레포에 그런 의존성이 없고
(`date-fns` v4가 있지만 이름이 주어졌을 때 포맷할 뿐 좌표에서 알아내지 못한다),
후보 라이브러리는 가벼우면 국경 근처에서 틀리고 정확하면 수 MB다.

변환 수단은 저장·계산 구조와 독립이다. 컬럼·타입·UTC 단일 축이 완성되면
나중에 값을 채우는 것만 꽂으면 된다. 번들 크기 실측을 이번 작업에 묶지 않는다.

**감수하는 것:** 1차 동안 모든 시각이 기기 로컬로 표시된다.
한국에서 일본 여행 일정을 보면 도착 시각이 한국 시각으로 보인다.

## 티켓 이미지

기존 업로드 경로를 그대로 쓴다. 웹과 앱 양쪽에 이미 `uploadToStorage`가 있고
둘 다 같은 `storage-upload-url` Edge Function을 호출한다.
플랫폼별로 다른 것은 파일을 준비하는 부분(웹은 `File` + HEIC 변환·리사이즈,
앱은 `uri`)뿐이고 업로드 자체는 이미 같은 서버 경로다.

저장 경로에 UUID를 넣어 추측할 수 없게 한다.

```
transport-tickets/{reservationId}/{uuid}.webp
```

`photos` 테이블은 재사용하지 않는다. `is_public`·place 연결·커뮤니티 노출을 물고 있어
티켓이 실수로 공개될 경로가 생긴다.

### 티켓 이미지 공개 범위

스토리지는 Cloudflare R2이고 버킷이 하나다. `storage-upload-url`이 돌려주는
서명 URL은 **업로드(PUT) 전용**이며, 읽기는 `R2_PUBLIC_BASE_URL`에 경로를 이어붙인
공개 URL이다. 서명이 없다.

티켓도 같은 방식으로 저장한다. 경로가 유출되면 열리지만, 유출 없이는 찾을 수 없다.
사진과 같은 수준의 보호다.

읽기용 presigned URL은 후속 작업으로 분리한다. 실효를 가지려면
버킷 분리 + 공개 도메인 설정 + 서명 발급 함수가 모두 필요한데,
그것은 티켓 기능이 아니라 스토리지 인프라 재설계다.
분리하지 않은 채 서명만 얹으면 안전하다는 착각만 남는다.

## 지도 경로 분할

교통 구간은 지도에 그리지 않되, 일반 경로와 연결되는 엣지는 그린다.

```
placeIds: [숙소, 인천공항, 오사카공항, 오사카성]
           └────┬────┘   ✂    └────┬────┘
            조각 1              조각 2
         (도로 경로 O)  (그리지 않음) (도로 경로 O)
```

현재 `getRoadDirections`는 waypoints 전체를 하나의 연속된 경로로 요청한다.
그대로 두면 인천→오사카를 육로로 뚫으려 하고, 실패하면 `fallbackRoadRoute`가
바다를 가로지르는 직선을 그린다.

`splitIntoSegments`는 이미 API 경유지 개수 한계로 분할하고 있다.
교통 구간이라는 두 번째 분할 기준을 더한다.

```ts
export function splitIntoSegments(
  waypoints: Coordinate[],
  maxSize: number,
  breakIndices?: number[]
): Coordinate[][]
```

`breakIndices`는 "이 인덱스와 다음 인덱스 사이를 잇지 않는다"는 경계다.
호출자가 예약 데이터에서 교통 구간의 출발지·도착지가 경로의 몇 번째인지 찾아 넘긴다.
경계로 먼저 자른 뒤 각 조각에 기존 `maxSize` 분할을 적용한다.

이 작업은 예약 조회 API가 있어야 호출자가 성립하므로 마지막 웨이브에 둔다.

### 검증 케이스

```
splitIntoSegments
  it.todo('경계가 없으면 기존 maxSize 분할과 같다')
  it.todo('경계에서 조각을 나누고 끝점을 공유하지 않는다')
  it.todo('경계로 나뉜 조각이 maxSize를 넘으면 다시 분할한다')
  it.todo('연속된 경계는 가운데 조각을 만들지 않는다')
```

## 실행 순서

태스크 간 의존이 만족된 것끼리 웨이브로 묶는다.

| 웨이브 | 내용 | 의존 |
| --- | --- | --- |
| 1 | `TransportType` 이동 + 경로 좁힌 타입 + 소비처 6곳 | 없음 |
| 1 | `transport_reservations` · `transport_tickets` 마이그레이션 | 없음 |
| 1 | `ensureTripPlace` | 없음 |
| 2 | `trip-transport` 모듈 (타입 · API) | 웨이브 1 전부 |
| 2 | 티켓 이미지 업로드 (웹 · 앱) | 웨이브 1 마이그레이션 |
| 3 | 지도 경로 분할 | 웨이브 2 예약 조회 |

웨이브 1의 세 태스크는 서로 다른 파일을 건드리므로 병렬 실행한다.

## 범위 밖으로 둔 것

### trip_places.status 죽은 컬럼

`PlaceStatus = 'wished' | 'confirmed'` 타입과 DB 기본값 `'candidate'`가 어긋나 있다.
추적해 보면 `status`는 쓰기만 하고 아무도 읽지 않는다 — `place.api.ts`가 항상
`'wished'`를 박아 넣고(커뮤니티 경로 복사 2곳 포함), 읽는 쪽에서 분기하는 코드가 없다.

실제 상태는 이미 `routes.place_ids`에 그 `trip_place.id`가 들어있는지 여부로 결정된다.
경로에 포함되면 확정, 아니면 후보다. `status` 컬럼은 그것과 어긋날 수 있는
두 번째 진실이다.

교통 인프라와 독립된 기존 결함이고, 제거하려면 마이그레이션·타입·소비처를
함께 건드려야 해 별도 커밋 단위로 서는 편이 낫다. 이번 작업에서는
새 의미를 얹지 않는 것으로 그친다.

### 후속 단계

정의서의 2~5단계(시간 기반 Push, 항공편 조회, Realtime Enrichment, OCR)는
모두 이 인프라 위에 얹힌다. 1차는 외부 API 의존이 없고, 이것만으로 기능이 성립한다.
