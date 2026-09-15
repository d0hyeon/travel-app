# 교통 관리 인프라 설계

[`docs/trip-transport-definition.md`](../../trip-transport-definition.md)의 1차 범위 중
데이터·타입 계층을 다룬다. UI 컴포넌트는 범위 밖이지만,
UI가 소비할 뷰 모델과 그 변환 함수는 포함한다 — 순수 로직이고,
이 모델이 서야 UI 복잡도가 결정되기 때문이다.

## 범위

포함

- `TransportType` 독립 위치 이동, 경로용 좁힌 타입 도입
- `trip_transports` · `trip_transport_tickets` 테이블
- `trip-transport` 도메인 모듈 (타입 · API · 유틸 · 훅)
- `RouteItem` 뷰 모델과 `toRouteItems` · `toPlaceIds` 변환
- 티켓 이미지 업로드 (웹 · 앱)
- 교통 구간을 경계로 한 지도 경로 분할

제외

- UI 컴포넌트 전부
- 티켓 읽기용 presigned URL — 아래 "티켓 이미지 공개 범위" 참조
- `trip_places.status` 죽은 컬럼 정리 — 아래 "범위 밖으로 둔 것" 참조

## 정의서에서 수정한 것

정의서 작성 시점에 실제 스키마와 어긋난 지점이 세 개 있었다.
이 문서의 결정이 정의서에 우선한다.

### 출발지·도착지는 `places`가 아니라 `trip_places`를 참조한다

정의서는 "공항·역·터미널은 `places`를 그대로 쓴다"고 하고 `departurePlaceId`를 뒀다.
그러나 `routes.place_ids`가 가리키는 것은 `places.id`가 아니라 `trip_places.id`다.

**공항이 `trip_place`로 존재해야 하는 이유**는 경로에 넣기 위해서다.
`routes.place_ids`가 `trip_places.id`만 받으므로 다른 방법이 없다.
공항이 경로에 없으면 자를 지점이 없어, 정의서가 고치려던 버그
(인천→오사카를 육로로 뚫고 실패 시 바다를 가로지르는 직선)가 그대로 남는다.

**교통편이 `trip_places.id`를 참조하는 이유**는 경로와 같은 것을 가리켜야
위치를 찾을 수 있기 때문이다. 리스트를 접을 때
"교통편의 출발·도착이 `place_ids`에서 인접한가"를 판정하는데,
`places.id`를 참조하면 매번 `TripPlace`로 풀어 `placeId`를 꺼내 비교해야 한다.
변환 함수가 인자를 하나 더 받고 테스트 셋업이 무거워진다.

`trip_place`의 부가정보(메모·카테고리·태그)는 교통편이 쓰지 않는다.
참조는 위치를 찾기 위한 것이지 정보를 읽기 위한 것이 아니다.

참조 방향은 한 줄로 흐른다. 각 계층은 바로 아래만 안다.

```
places  ──▶  trip_places  ──▶  trip_transports  ──▶  trip_transport_tickets
전역 POI     여행-장소 연결       여행의 교통편                구간별 티켓
```

### `transit` 카테고리는 이미 의미를 갖고 있다

정의서는 `PlaceCategoryType.대중교통`(`transit`)이 "장소 분류이며 이 타입과 무관하다"고
선을 그었다. 타입으로서는 맞지만, `get_explored_places`는 이미
`tp.category IS DISTINCT FROM 'transit'`로 교통 장소를 탐색 통계에서 제외하고 있다.

공항·역 `trip_place`의 카테고리를 비워두면 이 필터에 걸리지 않아
인천공항이 "가장 많이 저장된 장소" 상위를 차지한다.

공항·역은 사용자가 직접 여행 장소로 추가하므로 카테고리도 사용자가 고른다.
교통 모듈이 `trip_place`를 만들지 않으니 강제할 지점이 없다.
`transit`을 권장값으로 두는 것은 UI 단계의 판단이며 이 문서의 범위 밖이다.
여기서는 **교통 모듈이 장소 분류에 관여하지 않는다**는 것만 정한다.

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
여러 도메인이 참조하는 어휘를 담는 자리다. `trip-transport`(여행 종속 교통편 데이터)와는
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
export type TripTransportType = Extract<TransportType, 'flight' | 'train' | 'bus'>
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

### TripTransport

정의서는 타입명을 `TransportReservation`으로 두었으나 `TripTransport`로 바꾼다.

기존 도메인 모듈은 모듈명과 타입명이 일치한다
(`trip-checklist` → `TripChecklist`, `trip-memo` → `TripMemo`).
그리고 정의서 스스로 "이미 예약하거나 **계획한** 스케줄"이라고 했으므로
`Reservation`은 담는 것보다 좁은 이름이다.

```ts
type TripTransportBase = {
  id: string
  tripId: string

  departureTripPlaceId: string
  arrivalTripPlaceId: string
  departureAt: string           // UTC ISO
  arrivalAt?: string            // UTC ISO
  departureTimezone?: string    // IANA. 1차에서는 채우지 않는다
  arrivalTimezone?: string

  tickets: TripTransportTicket[]
  createdAt: string
}

export type TripTransport =
  | (TripTransportBase & {
      type: Extract<TransportType, 'flight'>
      airline?: string
      flightNumber?: string
    })
  | (TripTransportBase & {
      type: Extract<TransportType, 'train' | 'bus'>
      provider?: string
      serviceNumber?: string
    })

export interface TripTransportTicket {
  id: string
  transportId: string
  memberId?: string             // 없으면 일행 공용 티켓
  images: string[]              // R2 public URL
  createdAt: string
}
```

**판별 유니온을 쓰는 이유**는 종류마다 입력 필드가 다르기 때문이다.
전부 옵셔널인 평평한 타입은 "기차인데 `airline`이 있는" 상태를 막지 못한다.
`type`으로 좁혀야 종류별 필드에 닿게 하면 폼도 자연스럽게 갈린다.

**항공 / 육상 2분기인 이유**는 기차와 버스의 필드가 같아서다.
지금 다른 것이 둘뿐이니 둘로 나눈다. 기차에만 `platform`이 생기는 식으로
갈라지면 그때 쪼갠다 — 유니온은 쪼개기 쉽다.

이 유니온은 **코드가 잘못 쓰는 것을 막는 장치**이지 데이터 무결성 보장이 아니다.
DB는 한 테이블이고 종류별 컬럼이 모두 nullable이다. 무결성까지 원하면
CHECK 제약이 필요하지만 값이 늘 때마다 마이그레이션이 붙으므로 두지 않는다.

정의서대로 운항편 마스터와 교통편을 분리하지 않고, 환승·왕복은 구간마다 개별 등록한다.
같은 예약(PNR)이라는 사실은 담지 않는다.

엔티티를 나누지 않으므로 타입도 나누지 않는다. "교통편 일반"과 "여행 교통편"을
타입으로만 분리하면 테이블 하나에 층이 둘인 어색한 구조가 된다.

### 파일 배치

기존 도메인 모듈(`trip-checklist`, `trip-memo`)과 같은 구성이다.

```
packages/domains/src/modules/
├── transport/                      공용 vocabulary
│   ├── transport.types.ts          TransportType, TransportTypeLabel
│   └── index.ts
├── trip-transport/                 여행 종속 교통편 데이터
│   ├── tripTransport.types.ts      TripTransport, TripTransportTicket
│   ├── tripTransport.api.ts        조회·생성·수정·삭제, RawData ↔ 도메인 변환
│   ├── tripTransport.utils.ts      순수 로직
│   ├── useTripTransport.ts
│   ├── __tests__/
│   └── index.ts
└── trip/                           기존 모듈
    ├── routeItem.types.ts          RouteItem, RoutePlace          (추가)
    ├── routeItem.utils.ts          toRouteItems, toPlaceIds       (추가)
    ├── useDayTripRoutes.ts         RouteItem[] 을 돌려주도록 확장
    └── __tests__/
```

`useTripTransport.ts`는 `trip-checklist`의 `useTripChecklist.ts`와 같은 자리다.
이 프로젝트에서 훅은 도메인 모듈의 일부다.

`RouteItem`·`toRouteItems`·`toPlaceIds`는 trip 모듈에 둔다 —
`useDayTripRoutes`가 이미 그 변환을 하는 자리이기 때문이다.

## 테이블

### trip_transports

```sql
create table public.trip_transports (
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

`trip_places` 참조는 기본값(`no action`)으로 둔다. 공항 장소를 지웠을 때
교통편이 조용히 사라지지 않는다.

**미결:** 그러면 사용자가 공항을 여행 장소에서 지울 수 없다. 선택지는
교통편을 먼저 지우게 안내하거나(UI 판단), `on delete set null`로 바꿔
출발지 없는 교통편을 허용하는 것이다. 후자는 `not null`을 풀어야 하고
"출발지를 모르는 교통편"이라는 상태가 생긴다.

`toRouteItems`는 이 상황에서 이미 안전하다 — 출발·도착이 인접하지 않으면
접지 않고 교통편을 리스트에서 제외한다. 데이터가 깨져도 화면은 깨지지 않는다.
결정은 UI 단계에서 실제 조작 흐름을 보고 내린다.

정렬·알림 계산이 `departure_at` 기준이므로 `(trip_id, departure_at)` 인덱스를 둔다.

### trip_transport_tickets

```sql
create table public.trip_transport_tickets (
  id uuid primary key default gen_random_uuid(),
  transport_id uuid not null references public.trip_transports(id) on delete cascade,
  member_id uuid,
  images text[] not null default '{}',
  created_at timestamptz not null default now()
);
```

티켓을 교통편의 jsonb 컬럼이 아니라 별도 테이블로 둔 이유는 동시 편집이다.
일행 각자가 자기 티켓을 올리는 것이 기본 시나리오인데, jsonb 배열이면
두 명이 동시에 올릴 때 한쪽이 덮어써진다.

`member_id`는 `checklist.member_id`와 같은 결로 nullable이며, 없으면 공용 티켓이다.

### RLS

기존 여행 종속 테이블은 `can_access_trip(trip_id)` 한 줄로 정책을 건다
(`checklist_access`가 그 형태다). `trip_transports`는 `trip_id`를 가지므로
그대로 쓴다.

```sql
create policy "trip_transports_access" on public.trip_transports
  using (public.can_access_trip(trip_id))
  with check (public.can_access_trip(trip_id));
```

`trip_transport_tickets`는 `trip_id`가 없어 같은 형태를 쓸 수 없다.
교통편을 거쳐 여행에 닿는다.

```sql
create policy "trip_transport_tickets_access" on public.trip_transport_tickets
  using (exists (
    select 1 from public.trip_transports t
    where t.id = transport_id and public.can_access_trip(t.trip_id)
  ))
  with check (exists (
    select 1 from public.trip_transports t
    where t.id = transport_id and public.can_access_trip(t.trip_id)
  ));
```

티켓에 `trip_id`를 비정규화해 넣으면 정책이 한 줄로 끝나지만,
교통편과 티켓의 여행이 어긋날 수 있는 두 번째 진실이 생긴다. 조인을 택한다.

## 경로 뷰 모델

교통편은 "출발지 → 도착지"가 한 세트로 움직여야 한다. 그 블록 앞뒤로는
장소를 자유롭게 넣고 뺄 수 있지만, 블록 **사이**에는 끼어들 수 없다.

이 제약을 검사로 강제하지 않는다. **리스트 항목을 접어서 구조로 만든다.**
출발·도착 두 장소를 하나의 항목으로 묶으면, 드래그가 자동으로 한 세트가 되고
블록 내부에 드롭 지점이 없어 삽입이 애초에 불가능해진다.
`SortableList`가 `{ id }`만 요구하는 제네릭이라 그대로 성립한다.

### 타입

`useDayTripRoutes`는 이미 `placeIds`를 펼쳐 뷰 객체를 만들고 있다.
새 계층을 세우는 것이 아니라 그 변환을 넓힌다.

```ts
type RoutePlace = TripPlace & {
  routeNotes: string[]
}

type RouteItem =
  | {
      kind: 'place'
      id: string                       // trip_places.id
      place: RoutePlace
    }
  | {
      kind: 'transport'
      id: string                       // trip_transports.id
      transport: TripTransport
      departure: RoutePlace
      arrival: RoutePlace
    }
```

`departure` · `arrival`을 id가 아니라 `RoutePlace`로 품는 이유는,
블록 안에 공항 두 개를 그려야 하고 지도 분할에도 좌표가 필요하기 때문이다.
`useDayTripRoutes`가 이미 `allPlaces`를 들고 있어 여기서 붙이는 것이 자연스럽다.

### 변환

```ts
function toRouteItems(
  places: RoutePlace[],
  transports: TripTransport[]
): RouteItem[]

function toPlaceIds(items: RouteItem[]): string[]
```

`toRouteItems`가 지키는 것:

- 교통편의 출발·도착이 `places`에서 **인접**하면 하나의 `transport` 항목으로 접는다
- 인접하지 않으면 접지 않는다 — 각각 평범한 `place` 항목이 되고 그 교통편은 리스트에 없다.
  사용자가 공항 하나만 지웠거나 교통편 등록 전에 경로를 만든 경우다.
  자동으로 붙이지 않는다 — 사용자가 편집한 경로를 시스템이 건드리지 않는다는 원칙이다.
  공항을 다시 붙이면 복구된다
- 경로에 없는 교통편은 무시한다
- 순서는 `places` 순서를 따른다

`toPlaceIds`는 그 역이며, `toRouteItems` → `toPlaceIds`가 원래 `placeIds`를 복원한다.
`transport` 항목은 `[departure.id, arrival.id]`로 편다.

### 위치

`useDayTripRoutes`(`@waylog/domains/modules/trip`)를 확장한다.
웹 데스크톱·모바일과 앱이 같은 리스트를 그려야 하므로(웹이 기준),
각 앱에서 변환하면 세 벌이 되어 어긋난다.

trip 모듈이 trip-transport에 의존하게 되지만, 경로가 교통편을 읽는 것은
이 기능의 본질이라 숨길 수 있는 의존이 아니다.

### 렌더 분기

세 화면이 `map` 안에서 각자 분기하면 세 벌이 된다.
항목 컴포넌트 하나로 모아 호출부에서 분기가 보이지 않게 한다.

```tsx
{items.map((item, idx) => <RouteItemView key={item.id} item={item} index={idx} />)}
```

판별 유니온을 받는 이상 분기 자체는 없앨 수 없다. 없앨 수 있는 것은
분기가 여러 곳에 흩어지는 것이다. 컴포넌트 구현은 이 문서의 범위 밖이며,
여기서는 `RouteItem`이 그 구성을 가능하게 한다는 것까지만 정한다.

### 같은 경로 안의 중복 금지

한 경로에 같은 장소가 두 번 들어가지 않는다. 왕복으로 같은 공항이 두 번
필요한 경우는 경로가 날짜별로 나뉘므로 다른 행에 들어간다.

이것은 새 제약이 아니라 이미 깔려 있던 전제다. `useDayTripRoutes`의
`allPlaces.find((x) => x.id === id)`가 같은 객체를 두 번 돌려주고
렌더에서 `key`가 중복된다. 명시적으로 검사할 뿐이다.

### 검증 케이스

```
toRouteItems
  it.todo('교통편의 출발·도착이 인접하면 하나의 블록으로 접는다')
  it.todo('교통편이 없으면 모두 장소 항목이다')
  it.todo('출발·도착이 떨어져 있으면 접지 않고 교통편을 제외한다')
  it.todo('경로에 없는 교통편은 무시한다')
  it.todo('접은 뒤에도 장소 순서가 유지된다')

toPlaceIds
  it.todo('교통 블록을 출발·도착 두 id로 편다')
  it.todo('toRouteItems 를 거쳐도 원래 placeIds 를 복원한다')
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
trip-transport-tickets/{transportId}/{uuid}.webp
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
경계로 먼저 자른 뒤 각 조각에 기존 `maxSize` 분할을 적용한다.

경계를 찾는 일은 `RouteItem[]`이 이미 해결한다. `kind === 'transport'` 항목이
차지한 위치가 곧 경계다. 좌표 배열을 만들 때 그 위치를 함께 뽑아 넘기면 되고,
교통편을 다시 뒤지거나 id를 대조하는 코드가 필요 없다.

`getRoadDirections`는 `Coordinate[]`만 받으며 id를 모른다.
경계 계산은 뷰 모델 계층에서 끝나고, 분할 계층에는 인덱스만 내려간다.

이 작업은 `RouteItem`이 있어야 호출자가 성립하므로 마지막 웨이브에 둔다.

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
| 1 | `trip_transports` · `trip_transport_tickets` 마이그레이션 | 없음 |
| 2 | `trip-transport` 모듈 (타입 · API · 훅) | 웨이브 1 전부 |
| 2 | 티켓 이미지 업로드 (웹 · 앱) | 웨이브 1 마이그레이션 |
| 3 | `RouteItem` 뷰 모델 + `useDayTripRoutes` 확장 | 웨이브 2 교통편 조회 |
| 4 | 지도 경로 분할 | 웨이브 3 `RouteItem` |

웨이브 1의 두 태스크는 서로 다른 파일을 건드리므로 병렬 실행한다.
웨이브 2의 두 태스크도 마찬가지다.

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
