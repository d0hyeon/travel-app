# Road Directions CDN Cache Design

## Overview

도로 경로 검색 API(카카오, 구글)를 Supabase 엣지함수로 통합하고, Vercel CDN을 통해 캐시하는 설계.

**목표:**
- 카카오/구글 API 호출 비용 절감
- 반복 경로 요청의 응답 속도 향상
- 구글 API 키를 클라이언트에서 제거 (보안)

---

## Architecture

```
클라이언트 (IDB 캐시 → miss)
  → GET /api/road-directions?waypoints=...&region=korea|global
      [Vercel Edge Network — CDN 캐시 7일]
      → Supabase road-directions 엣지함수
          ├─ region=korea  → 카카오 Directions API
          └─ region=global → 구글 Directions API
```

### 캐시 계층

| 계층 | 위치 | TTL | 범위 |
|------|------|-----|------|
| L1 | 클라이언트 IDB | 영구 | 디바이스 |
| L2 | Vercel CDN | 7일 (604800s) | 글로벌 엣지 |
| L3 | 없음 (원본) | — | 카카오/구글 API |

CDN miss 시에만 Supabase 엣지함수가 실행된다. IDB hit 시에는 네트워크 요청 자체가 없다.

---

## API Interface

### GET /api/road-directions

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `waypoints` | string | O | `lng,lat` 쌍을 `\|`로 구분. 예: `127.0,37.5\|127.1,37.6` |
| `region` | `korea` \| `global` | O | 경로 탐색 엔진 선택 |

**Response:**
```json
{ "coordinates": [{ "lat": 37.5, "lng": 127.0 }, ...] }
```

**Error Response:**
```json
{ "error": "string" }
```

**캐시 헤더:**
```
Cache-Control: public, s-maxage=604800
```

---

## Components

### 1. Supabase 엣지함수: `road-directions`

기존 `kakao-directions` 엣지함수를 대체한다.

- `region=korea`: 기존 `kakao-directions` 로직 그대로 (분할/폴백 포함)
- `region=global`: 기존 `getGlobalRoadDirections` 의 구글 API 호출 로직 이전
- 요청 바디: `{ waypoints: Coordinate[], region: 'korea' | 'global' }`
- 기존 `kakao-directions` 엣지함수는 삭제

### 2. Vercel API Route: `api/road-directions.ts`

- 쿼리스트링 파싱 후 Supabase 엣지함수로 POST 전달
- 성공 응답에 `Cache-Control: public, s-maxage=604800` 헤더 부착
- Supabase 오류는 그대로 상위로 전파 (상태코드 유지)

### 3. vercel.json 캐시 헤더 추가

```json
{
  "source": "/api/road-directions",
  "headers": [{ "key": "Cache-Control", "value": "public, s-maxage=604800" }]
}
```

### 4. 클라이언트: `roadRoute.api.ts`

- `fetchSingleSegment`: `supabase.functions.invoke` → `fetch('/api/road-directions?...')` GET으로 교체
- `fetchGoogleSegment`: 구글 SDK 직접 호출 제거, 엣지함수로 위임
- `getGlobalRoadDirections`: 내부적으로 `region=global` 파라미터로 동일 엔드포인트 호출
- waypoints 직렬화: `waypoints.map(p => `${p.lng},${p.lat}`).join('|')`

---

## Error Handling

- 카카오 API 실패: 기존 이진 분할 폴백 로직 유지 (직선 처리)
- 구글 API 실패: 카카오와 동일하게 이진 분할 폴백 → 최소 구간 직선 처리
- Vercel API Route 오류: 클라이언트에서 원본 waypoints 반환 (기존 동작 유지)
- CDN 캐시는 2xx 응답만 캐시하므로 오류 응답은 캐시되지 않음

---

## Security

- 구글 **Directions API** 키가 클라이언트 번들에서 제거됨
- `VITE_GOOGLE_MAPS_API_KEY`는 지도 렌더링(JS SDK 로드)용으로 클라이언트에 유지 — 변경 없음
- 카카오 REST 키는 기존과 동일하게 Supabase 환경변수로 유지
- 구글 Directions API 키는 Supabase 환경변수로 추가 필요: `GOOGLE_DIRECTIONS_API_KEY`
  - 동일한 키를 사용하는 경우 `VITE_GOOGLE_MAPS_API_KEY` 값을 그대로 복사

---

## Out of Scope

- 구글 Maps JS SDK (지도 렌더링용)는 클라이언트에 유지 — 경로 검색 REST API 호출만 이전
- 클라이언트 IDB 캐시 로직 변경 없음
- 카카오 맵 관련 다른 API는 변경 없음
