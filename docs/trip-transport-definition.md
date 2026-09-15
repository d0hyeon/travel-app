# 교통 관리 기능 정의서

여행 일정에서 사전에 예약되거나 출발 시각이 정해진 교통수단을 관리한다.
운행편 탐색·예약 서비스가 아니다. 사용자가 이미 예약하거나 계획한 스케줄과
티켓을 관리하는 것이 기본 기능이다.

외부 API는 등록의 전제가 아니라 Enrichment Layer다. 외부 API 없이도
스케줄·티켓·길찾기는 완전히 동작해야 한다.

## 범위

포함: 항공, 기차, 버스

제외: 렌터카, 배/페리, 케이블카/곤돌라, 지하철, 트램, 시내버스 등 현지
대중교통, 택시/자차

## 도메인

### TransportType

이동수단 종류는 독립 타입이다. 특정 도메인의 소유물이 아니며, 소비자가
필요한 만큼 좁혀 쓴다.

```ts
TransportType = 도보 | 차량 | 항공 | 기차 | 버스
```

- 경로(`route`)는 도보·차량으로 좁혀 쓴다. 현재 `route.types.ts`에 있는
  `TransportType`을 독립 위치로 옮기고, 경로는 좁힌 타입을 정의해 쓴다.
- 교통 관리는 항공·기차·버스를 쓴다.

`PlaceCategoryType.대중교통`(`transit`)은 장소 분류이며 이 타입과 무관하다.

다만 `transit`은 이미 의미를 갖고 있다 — `get_explored_places`가
`tp.category IS DISTINCT FROM 'transit'`로 교통 장소를 탐색 통계에서 뺀다.
공항·역 `trip_place`의 카테고리를 비워두면 이 필터에 걸리지 않아 인천공항이
"가장 많이 저장된 장소" 상위를 차지한다.

공항·역은 사용자가 직접 여행 장소로 추가하므로 카테고리도 사용자가 고른다.
`transit`을 권장값으로 두는 것은 UI 판단이며, 교통 모듈은 장소 분류에
관여하지 않는다.

### TripTransport

모듈은 `trip-transport`, 타입은 `TripTransport`다. 여행에 종속된다.

기존 도메인 모듈이 모듈명과 타입명을 맞추고 있고
(`trip-checklist` → `TripChecklist`), 이 기능은 예약뿐 아니라 계획한
스케줄도 담으므로 `Reservation`보다 넓은 이름을 쓴다.

```ts
type TripTransportBase = {
  id: string
  tripId: string

  departureTripPlaceId: string
  arrivalTripPlaceId: string
  departureAt: string           // UTC
  arrivalAt?: string            // UTC
  departureTimezone?: string    // IANA, 예: "Asia/Seoul"
  arrivalTimezone?: string

  tickets: TripTransportTicket[]
  createdAt: string
}

type TripTransportCarrier =
  | { type: 항공; airline?: string; flightNumber?: string }
  | { type: 기차 | 버스; provider?: string; serviceNumber?: string }

type TripTransport = TripTransportBase & TripTransportCarrier

type TripTransportTicket = {
  id: string
  transportId: string
  memberId?: string   // 없으면 일행 공용 티켓
  images: string[]
  createdAt: string
}
```

종류별 필드는 판별 유니온으로 가른다. 전부 옵셔널인 평평한 타입은
"기차인데 `airline`이 있는" 상태를 막지 못한다. `type`으로 좁혀야 종류별
필드에 닿으므로 폼도 자연스럽게 갈린다.

DB는 한 테이블이고 종류별 컬럼이 모두 nullable이다. 이 유니온은 코드가
잘못 쓰는 것을 막는 장치이지 데이터 무결성 보장이 아니다.

항공과 육상(기차·버스) 둘로 나눈 것은 기차와 버스의 필드가 같기 때문이다.
기차에만 `platform`이 생기는 식으로 갈라지면 그때 쪼갠다.

티켓은 별도 테이블이다. 일행 각자가 자기 티켓을 올리는 것이 기본
시나리오인데, 교통편의 jsonb 배열이면 두 명이 동시에 올릴 때 한쪽이
덮어써진다. 그래서 `id`·`transportId`·`createdAt`을 갖는다.

운항편 마스터와 예약을 분리하지 않는다. 예약은 특정 여행에서 한 번만
존재하고 재사용되지 않으므로, 분리하면 항상 1:1인 두 테이블이 된다.

### 출발지·도착지

공항·역·터미널은 `places`에 전역으로 존재하되(ICN은 모두에게 같은 ICN),
교통편이 참조하는 것은 그 여행의 `trip_places`다.

`routes.place_ids`가 `places.id`가 아니라 `trip_places.id`를 담기 때문이다.
공항이 경로에 들어가야 교통 구간을 자를 지점이 생기고, 교통편이 경로와 같은
것을 가리켜야 "출발·도착이 경로에서 인접한가"를 id 비교만으로 판정할 수 있다.
`places.id`를 참조하면 매번 `TripPlace`로 풀어 비교해야 한다.

참조는 위치를 찾기 위한 것이다. `trip_place`의 부가정보(메모·카테고리·태그)는
교통편이 쓰지 않는다.

```
places  ──▶  trip_places  ──▶  trip_transports  ──▶  trip_transport_tickets
전역 POI     여행-장소 연결       여행의 교통편                구간별 티켓
```

교통편이 참조하는 공항 `trip_place`는 삭제가 거부된다(FK가 `no action`).
의도한 잠금이며, 교통편이 살아있는 동안 출발·도착지가 사라지지 않는다.
교통편을 지워도 공항은 따라 지우지 않는다 — 다른 교통편이 같은 공항을 쓰거나
사용자가 그 공항을 일반 일정으로도 쓸 수 있기 때문이다. 참조가 사라지면
평범한 여행 장소로 돌아간다.

`places.provider`와 `external_id`는 기본값이 있으므로 POI 검색에 걸리지 않는
역·터미널도 직접 입력해 등록할 수 있다.

### 시각과 타임존

시각은 UTC로 저장하고, 표기만 각 지점의 타임존으로 포맷한다. 항공 업계
표기와 같다 — 출발은 출발지 현지 시각, 도착은 도착지 현지 시각이다.

```
저장   departureAt = 2026-08-25T01:10:00Z
       departureTimezone = "Asia/Seoul"   // 1차에서는 비어 있다
표시   10:10                              // 1차에서는 기기 로컬로 포맷
```

타임존은 `TripTransport`이 소유한다. `places`에 두지 않는다 —
전역 테이블이라 교통과 무관한 모든 장소가 컬럼을 갖게 되고, 되돌리는
비용이 크다.

**1차에서는 값을 채우지 않는다.** 출발·도착 타임존 모두 옵셔널이며, 없으면
기기 로컬 타임존으로 폴백한다.

좌표 → IANA 변환이 경계 폴리곤 데이터를 요구하기 때문이다. 레포에 그런
의존성이 없고(`date-fns` v4는 이름이 주어졌을 때 포맷할 뿐 좌표에서 알아내지
못한다), 후보 라이브러리는 가벼우면 국경 근처에서 틀리고 정확하면 수 MB다.

변환 수단은 저장·계산 구조와 독립이다. 컬럼·타입·UTC 단일 축이 서 있으면
나중에 값을 채우는 것만 꽂으면 된다.

감수하는 것: 1차 동안 모든 시각이 기기 로컬로 표시된다. 한국에서 일본 여행
일정을 보면 도착 시각이 한국 시각으로 보인다.

알림 시각 계산·정렬·비교는 전부 UTC 단일 축에서 한다.

### 환승·왕복

구간마다 개별 등록한다. 각 구간이 자기 편명·게이트·티켓·출발시각을 가지므로
실제로 별개의 대상이다.

```
인천 → 두바이 → 런던
  교통편 1  ICN → DXB  10:10
  교통편 2  DXB → LHR  15:40
```

같은 예약(PNR)이라는 사실은 현재 모델에 담지 않는다. 필요해지면 묶는 필드를
추가한다. 나눠 두면 나중에 묶을 수 있지만, 묶어 두면 나중에 쪼갤 수 없다.

## 일정과의 관계

경로(`Route`)는 순서만 갖는다. 시각을 갖지 않으며 교통편을 참조하지 않는다.
교통편의 `departureAt`은 알림과 정렬에만 쓴다.

공항·역은 Place이므로 사용자가 직접 경로의 `placeIds`에 넣는다. 시스템이
자동 삽입하지 않는다 — 사용자가 편집한 경로를 시스템이 건드리면 "안 넣은 게
생겼다", "지웠는데 또 생긴다" 문제가 따라온다.

### 지도

교통 구간은 지도에 그리지 않는다. 일반 경로와 연결되는 엣지는 그린다.

```
placeIds: [숙소, 인천공항, 오사카공항, 오사카성]
           └────┬────┘   ✂    └────┬────┘
            조각 1              조각 2
         (도로 경로 O)  (그리지 않음) (도로 경로 O)
```

현재 `getRoadDirections`는 waypoints 전체를 하나의 연속된 경로로 요청하므로,
그대로 두면 인천→오사카를 육로로 뚫으려 하고 실패 시
`fallbackRoadRoute`가 바다를 가로지르는 직선을 그린다.

교통 구간을 경계로 경로를 조각내고, 조각별로 도로 경로를 요청한다.
`splitIntoSegments`가 이미 API 개수 한계로 분할하고 있으므로, 교통 구간이라는
두 번째 분할 기준을 더하는 형태가 된다.

병합도 경계를 알아야 한다. 개수 한계로 나눈 조각은 끝점을 공유하므로
이어붙일 때 첫 점을 버리는데, 경계로 나뉜 조각은 공유하지 않는다. 그대로
버리면 위 예시에서 오사카공항이 사라지고 인천공항에서 오사카성으로 바로
잇는 선이 그려진다.

### 리스트

지도에서 끊긴 자리에 교통편을 표시한다.

```
09:10  Tokyo → Kyoto
```

교통편은 출발지·도착지가 한 세트로 움직여야 한다. 그 블록 앞뒤로는 장소를
자유롭게 넣고 뺄 수 있지만, 블록 **사이**에는 끼어들 수 없다.

이 제약을 검사로 강제하지 않는다. 리스트 항목을 접어서 구조로 만든다 —
출발·도착 두 장소를 하나의 항목(`RouteItem`)으로 묶으면 드래그가 자동으로
한 세트가 되고, 블록 내부에 드롭 지점이 없어 삽입이 애초에 불가능해진다.

접는 조건은 **경로에서 인접하고 방향도 같을 때**다. 교통편이 "인천 → 오사카"인데
경로가 `[오사카공항, 인천공항]` 순서면 접지 않는다. 접으면 화면과 저장 순서가
어긋나 사용자 편집이 되돌려진다.

인접하지 않으면 접지 않고 그 교통편은 리스트에서 빠진다. 사용자가 공항 하나만
지웠거나 교통편 등록 전에 경로를 만든 경우다. 자동으로 붙이지 않는다 —
공항을 다시 넣으면 복구된다.

## 기본 기능

외부 API 없이 모든 교통수단에서 제공한다.

| 기능 | 내용 |
| --- | --- |
| 스케줄 관리 | 여행 일정에 교통 스케줄 표시 |
| 티켓 관리 | 티켓 이미지 저장, 탑승 시 즉시 열람. 멤버별 티켓은 본인 것을 먼저 노출 |
| 출발지 길찾기 | 출발 공항·역·터미널을 지도에서 열거나 길찾기 실행 |

권장 출발시간 계산은 범위에서 제외한다. 사용자의 실제 출발 위치를 확정할 수
없다.

## 입력

### 항공

수동 입력을 기본 경로로 한다. 항공사·편명·출발지·도착지·출발일시를 직접
입력해 등록할 수 있어야 한다.

항공편 조회(API)는 입력 보조다. 조회 결과를 선택하면 공항·시각이 채워지되,
조회 없이도 등록이 완료되어야 한다.

### 기차·버스

종류·출발지·도착지·출발일시를 직접 입력한다. 운행편 검색은 기본 플로우가
아니다.

`provider`, `serviceNumber`는 선택이다. 실시간 운행편 매칭이 필요할 때만
쓴다. 없어도 스케줄·티켓 관리는 정상 동작한다.

### 티켓 이미지

티켓 이미지는 교통편을 식별하기 위한 입력 수단이 아니다. 실제 공항·역에서
티켓 또는 QR/바코드를 빠르게 표시하는 것이 목적이다.

일행이 함께 이동해도 티켓은 각자다. 티켓은 멤버에 귀속되며, 물리적으로 한
장인 경우(가족 기차표 등) `memberId` 없는 공용 티켓으로 둔다.

## 단계

1차는 외부 API 의존이 없다. 이것만으로 기능이 성립한다.

1차의 데이터·타입 계층은 구현됐다 — 테이블, `trip-transport` 모듈, 티켓
업로드, 경로 뷰 모델(`RouteItem`), 지도 경로 분할. 설계 근거는
[교통 관리 인프라 설계](./superpowers/specs/2026-09-15-trip-transport-infra-design.md)에 있다.
남은 것은 UI와 출발지 길찾기다.

| 단계 | 내용 | 외부 의존 |
| --- | --- | --- |
| 1 | 스케줄 등록·표시, 티켓 저장·열람, 출발지 길찾기 | 없음 |
| 2 | 시간 기반 Push | 스케줄러, 발송 이력 |
| 3 | 항공편 조회 (입력 보조) | FlightAware AeroAPI |
| 4 | Realtime Enrichment, 상태 변경 Push | Provider별 API/Webhook |
| 5 | OCR 입력 보조 | OCR |

## 후속 단계 설계 방향

### 시간 기반 Push (2단계)

`departureAt` 기준으로 출발 전 알림을 보낸다. 구체적 시점은 UX 정책으로
정한다.

현재 푸시 인프라는 `chat-web-push` Edge Function 하나이며 이벤트 트리거
방식이다. "출발 3시간 전"은 깨워 줄 이벤트가 없으므로 스케줄러(cron)와
중복 발송을 막을 발송 이력이 필요하다.

앱은 로컬 알림이 가능하지만 웹은 서버 없이 불가능하다. 웹이 기준이므로
서버 경로가 필수다.

### 데이터 계층 분리 (4단계)

사용자가 등록한 원본과 외부 실시간 정보를 분리한다. 외부 API 응답으로
원본 스케줄을 덮어쓰지 않는다.

```ts
type TransportRealtimeInfo = {
  status?: 'scheduled' | 'delayed' | 'cancelled'
  delayMinutes?: number
  estimatedDepartureAt?: string
  estimatedArrivalAt?: string
  terminal?: string
  gate?: string
  platform?: string
}
```

예정 시각과 현재 예상 시각을 각각 관리한다.

### Provider / Capability

지역이나 교통수단 종류로 기능 지원 여부를 하드코딩하지 않는다. Provider가
무엇을 지원하는지 capability로 판단한다.

```ts
type TransportProviderCapabilities = {
  flightSearch?: boolean
  realtimeStatus?: boolean
  delay?: boolean
  cancellation?: boolean
  terminal?: boolean
  gate?: boolean
  platform?: boolean
  webhook?: boolean
}
```

같은 해외 기차라도 사업자에 따라 GTFS-Realtime을 제공하기도, 정적 GTFS만
제공하기도 한다. UI는 실제 확보된 capability와 데이터에 따라 노출한다.

지역별 coverage 차이를 허용한다. Realtime을 쓸 수 없는 지역에서도 기본
경험이 깨지지 않아야 한다.

### Provider 후보

| 대상 | Provider |
| --- | --- |
| 국내 항공 | 국내 공항·공공 API |
| 해외 항공 | FlightAware AeroAPI |
| 국내 기차·버스 | 국내 교통 공공 API, 사업자 API |
| 해외 기차·버스 | Transitland (GTFS / GTFS-Realtime) |

AeroAPI는 조회당 과금이며 무료 티어가 좁다. 입력 보조로 쓰더라도 캐싱과
레이트리밋 정책이 함께 필요하다.

### 상태 변경 Push

시간 기반 Push와 구분한다. 전자는 자체 스케줄링, 후자는 Provider의 상태
변경 감지가 필요하다.

```
Provider ──Alert/Webhook──> Backend ──> Push ──> User
```

Webhook만으로 모든 변경을 보장할 수 없으면 출발 임박 시간대에 Polling을
병행한다.

### OCR

메인 입력 플로우가 아니다. 티켓 이미지에서 식별 가능한 정보를 찾으면 입력을
제안하는 용도다.

OCR 실패가 등록 성공 여부에 영향을 주면 안 된다.

## 설계 원칙

1. 외부 API는 Enrichment Layer다. 없어도 스케줄·티켓·길찾기는 동작한다.
2. 항공도 수동 등록이 가능해야 한다. 조회는 입력 보조다.
3. 기차·버스는 사용자가 스케줄을 직접 등록한다. 운행편 검색은 기본 플로우가
   아니다.
4. `provider`·`serviceNumber`는 선택이다. 실시간 매칭이 필요할 때 쓴다.
5. 티켓 이미지는 현장 표시가 목적이다. OCR은 입력 보조다.
6. 예정 정보와 실시간 정보를 분리한다. 외부 응답으로 원본을 덮어쓰지 않는다.
7. 시간 기반 Push와 상태 변경 Push를 구분한다.
8. 시각은 UTC로 저장하고 표기만 현지 타임존으로 포맷한다.
9. 경로는 순서만 갖는다. 시각은 교통편이 갖고 스케줄링에만 쓴다.
10. 교통 구간은 지도에 그리지 않되, 일반 경로와 연결되는 엣지는 그린다.
11. 권장 출발시간 계산은 범위 밖이다. 실제 출발 위치를 확정할 수 없다.
12. 지역별 coverage 차이를 허용한다.
