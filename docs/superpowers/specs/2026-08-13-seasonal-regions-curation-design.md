# 탐색 탭 계절 인기 지역 큐레이션 설계

**날짜:** 2026-08-13
**상태:** 승인됨

---

## 배경

탐색 탭의 기존 큐레이션 세 섹션(급상승·저장순·최다방문)은 모두 **우리 앱 내부 방문 기록** 기반이며 단위가 **장소(Place)** 다. 앱 데이터만으로는 "전국에서 실제로 어디가 뜨는지"를 알 수 없다.

공공 관광 통계를 도입해 **지역(Location) 단위**의 계절 방문 추이 큐레이션을 추가한다. 기존 섹션과 겹치지 않는 새로운 축이다.

| | 기존 급상승 | 신규 계절 인기 지역 |
| --- | --- | --- |
| 데이터 | Supabase 내부 방문 기록 | 공공 관광 통계 |
| 단위 | 장소(Place) | 지역(Location) |
| 기간 | 최근 N개월 | 계절(3개월) |
| 증감 | 없음 (score만) | 작년 동계절 대비 절대 증감 + 증가율 |

### 왜 "최근 N개월"이 아니라 "계절"인가

초기 설계는 전월 대비 증가율이었으나 계절 기준으로 변경했다. 근거는 셋이다.

1. **시차가 무효화된다** — 데이터는 약 1개월 지연되므로 "최근 한 달"은 항상 과거를 가리킨다. 사용자는 "지금" 갈 곳을 고민하는데 화면은 지난달을 보여준다. 계절 큐레이션은 **작년 같은 계절** 데이터를 쓰므로 지연이 약점이 아니라 무관한 요소가 된다.
2. **계획 맥락에 맞는다** — 이 앱은 여행을 계획하는 앱이다. `useScheduledTripDestinations`를 필터 기본값으로 쓸 만큼 계획 중심이다. "지난달 뭐가 떴나"보다 "이 계절엔 어디가 좋나"가 계획에 직접 쓰인다.
3. **전월 대비는 사실상 계절을 한 박자 늦게 보여줄 뿐이다** — 8월에 전월 대비로 정렬하면 해수욕장이 상단을 채우고, 9월이면 같은 지역이 전부 마이너스로 뒤집힌다. 정보가 "지금 여름이네요"로 수렴한다.

---

## 데이터 소스

**[한국관광공사_관광빅데이터 정보서비스](https://www.data.go.kr/data/15101972/openapi.do)** (`data.go.kr` 15101972)

| 항목 | 내용 |
| --- | --- |
| 원천 | KT(내국인) + SKT(외국인) 이동통신 데이터 |
| 방문자 정의 | 일상생활권을 벗어나 체류한 사람. 일자별 순방문자 |
| 제공 시작 | 2020년 1월 |
| 갱신 | 매월 17일, 전월분 공개 |
| 조회 한도 | 월간 조회 시 최대 18개월 |
| 트래픽 | 개발계정 1,000회/일 (자동승인) |

기존 `governmentApi`(`~api/governmentApi`)와 `VITE_DATA_GO_SERVICE_KEY`를 재사용한다. `marine-activity`와 동일한 인프라이므로 신규 서버·DB 테이블·CORS 우회가 필요 없다.

### 엔드포인트 — 레벨별로 분리되어 있다

| 엔드포인트 | 키 필드 | 레벨 |
| --- | --- | --- |
| `metcoRegnVisitrDDList` | `areaCode` / `areaNm` | 광역 (시도) |
| `locgoRegnVisitrDDList` | `signguCode` / `signguNm` | 기초 (시군구) |

광역과 기초는 집계 기준이 달라 합산할 수 없는데, 엔드포인트 자체가 분리되어 있으므로 `Location`마다 어느 쪽을 호출할지 카탈로그에 지정해 해결한다.

- `metco` — 서울, 부산, 대구, 인천, 광주, 대전, 울산, 제주
- `locgo` — 강릉, 양양, 경주, 여수, 가평 등 시군구 단위

### 응답 스키마

```jsonc
// locgoRegnVisitrDDList
{
  "baseYmd": "20250701",   // 일 단위
  "signguCode": "51150",
  "signguNm": "강릉시",
  "daywkDivCd": "1",       // 요일 구분
  "daywkDivNm": "월요일",
  "touDivCd": "2",         // 방문자 구분 — 현지인/외지인/외국인
  "touDivNm": "외지인",
  "touNum": "123456"       // 문자열로 내려온다
}
```

`metcoRegnVisitrDDList`는 `signguCode`/`signguNm` 자리에 `areaCode`/`areaNm`이 온다. 그 외 필드는 동일하다.

`item` 바깥 래퍼는 `governmentApi`의 표준 구조(`response.header.resultCode` / `response.body.items.item`)를 따른다. 성공 코드는 `"0000"`이다 — `marine-activity`의 `"00"`과 다르므로 주의한다. `marineActivity.api.ts`가 `items.item`의 배열/단일/누락 세 형태를 방어하고 있으므로 같은 방식으로 정규화한다.

베이스 URL은 `https://apis.data.go.kr/B551011/DataLabService/` 이며 기존 `governmentApi`의 `baseUrl`(`https://apis.data.go.kr`) 아래에 그대로 들어간다.

### 실측으로 확인된 사실

2026-08-13 실제 API 호출로 아래를 검증했다.

| 항목 | 결과 |
| --- | --- |
| `touDivCd` | `1`=현지인(a), `2`=외지인(b), `3`=외국인(c) |
| 지역 필터 파라미터 | **지원하지 않음** — `signguCd`/`signguCode`/`areaCd`/`areaCode` 모두 `INVALID_REQUEST_PARAMETER_ERROR` |
| 하루치 레코드 수 | `locgo` 792건 / 전 지역 |
| 한 계절(92일) | `locgo` **72,864건 / 12.6MB / 9.4초** · `metco` 4,692건 / 806KB / 0.8초 |
| gzip | **지원함.** `locgo` 한 계절 12.6MB → **808KB / 1.5초** (15.6배 압축) |
| `numOfRows=100000` | 단일 호출로 전량 반환 (페이지네이션 불필요) |

### 호출 전략 — 계절당 1회, 전 지역 일괄

지역 필터가 없으므로 `Location`당 호출은 **불가능**하다. 대신 전 지역을 한 번에 받아 클라이언트에서 필요한 지역만 골라낸다. 결과적으로 호출 수가 30회에서 **레벨당 2회(기준 계절 + 비교 계절), 총 4회**로 줄어든다.

`Accept-Encoding: gzip`이 필수다. 압축 없이는 두 계절에 25MB / 19초가 들어 사용 불가다. 압축 시 약 1.6MB / 3초로 떨어진다. `fetch`는 브라우저가 자동으로 gzip을 요청하므로 별도 설정이 필요 없으나, 응답 크기가 여전히 크므로 `staleTime`을 길게 잡아 재요청을 막는 것이 중요하다.

> `metco`는 806KB / 0.8초로 가볍다. `locgo`가 무거우므로, 초기 구현에서 체감 성능이 문제되면 `metco`만 먼저 노출하고 `locgo`를 지연 로드하는 선택지가 있다.

### 스키마에서 파생되는 제약

1. **일별 데이터다** — 엔드포인트명의 `DD`와 `baseYmd`가 일 단위다. 계절 합계는 **우리가 집계**해야 한다. 한 지역당 한 계절에 약 276건(92일 × 방문자 구분 3종)이 나온다.
2. **`touNum`이 실수 문자열이다** — `"191744.0"`, `"24391.06000000001"` 형태다. `Number` 변환 후 반올림하며 파싱 실패를 방어한다.
3. **`touDivCd` 필터링이 필수다** — 아래 참조.
4. **국내 한정** — 해외 `Location`은 커버리지에 없어 후보에서 제외된다. `marineActivityEligibility`가 국내 해안만 판정하는 것과 같은 구조다.

### `touDivCd` — 현지인을 반드시 제외한다

**구분 없이 `touNum`을 전부 더하면 "관광객 수"가 아니라 "유동인구"가 된다.** 실측 예시(종로구, 2025-07-01)를 보면 현지인 18.5만 / 외지인 35.3만 / 외국인 2.4만으로, 현지인이 전체의 약 33%를 차지한다. 대도시일수록 이 비중이 커져 순위가 왜곡된다.

집계 대상은 **외지인(`2`) + 외국인(`3`)** 이며 현지인(`1`)은 제외한다.

```ts
const VisitorDivision = { Local: '1', Domestic: '2', Foreign: '3' } as const
```

`daywkDivCd`(요일 구분)는 필터링하지 않고 **전부 합산**한다. 계절 총합이 목적이므로 모든 요일 레코드가 합계에 들어가야 한다.

검증 샘플: 강릉시 2025년 여름 외지인+외국인 합계 = **10,495,210명**(연인원). 276건이 정상 수신됐다.

---

## 계절 모델

```ts
const Season = { Spring: 'spring', Summer: 'summer', Autumn: 'autumn', Winter: 'winter' }
```

| 계절 | 월 |
| --- | --- |
| 봄 | 3–5 |
| 여름 | 6–8 |
| 가을 | 9–11 |
| 겨울 | 12–2 |

겨울은 연도를 걸치므로 12월은 다음 해 겨울로 귀속시킨다. `2025-12` ~ `2026-02`가 하나의 겨울이다. 이 경계 처리는 순수 함수로 분리해 단위 테스트로 덮는다.

### 기준 계절 — 항상 작년 같은 계절

올해 계절은 아직 진행 중이거나 데이터가 미완성이므로 쓰지 않는다. **작년 같은 계절의 완결 데이터**를 기준으로 하고, 그 직전 해 같은 계절과 비교한다.

오늘이 2026년 8월(여름)이면:

- 기준: **2025년 여름** (2025-06 ~ 2025-08)
- 비교: **2024년 여름** (2024-06 ~ 2024-08)

지역 필터가 없어 전 지역을 일괄 수신하므로, 호출은 **레벨(`metco`/`locgo`) × 계절(기준/비교) = 4회**다.

---

## 랭킹 규칙

### 정렬 — 작년 동계절 대비 증가율

같은 계절끼리 비교하므로 계절성이 자동으로 제거된다. "여름 인기 지역"이면서 동시에 "작년보다 뜨고 있는 곳"이라는 두 정보가 한 카드에 담긴다.

직전 계절(봄→여름) 대비는 채택하지 않는다. 계절 전환 효과가 그대로 나와 전월 대비와 같은 문제를 반복한다.

인구 정규화와 Z-score도 검토했으나 도입하지 않는다. 전자는 정적 순위가 되어 증가량 요구와 어긋나고 인구 API가 추가로 필요하다. 후자는 "평소 대비 이례적"을 재는데 이는 사용자가 묻는 질문이 아니다.

### 게이트 — 두지 않는다

설계 초기에는 방문자 수 게이트(중앙값 → 하위 25%)를 뒀다. 규모가 작은 지역이 축제 하나로 폭주해 순위를 독식하는 것을 막으려는 의도였다. **실측 후 제거했다.**

2025년 여름 실제 데이터에서 그런 폭주는 일어나지 않는다. 29개 후보의 증가율이 **-1.0% ~ +12.1%** 범위에 얌전히 모인다. 3개월 합산 + 이동통신 실측이라 표본이 크기 때문이다. "축제로 2배 뛰는 소도시"는 앱 내부 방문 기록(`useRecentHotPlaces`)에서 생기는 현상이지 이 데이터의 특성이 아니었다.

게이트는 방어할 위험이 없는 상태에서 실제 상위 지역만 잘라냈다.

| 지역 | 증가율 | 방문자 | 하위 25% 게이트 |
| --- | ---: | ---: | --- |
| 울진 | +10.2% | 261만 | **잘림** (전체 4위) |
| 울릉도 | +10.1% | 73만 | **잘림** (전체 5위) |
| 태백 | +7.2% | 168만 | 잘림 |

적용 순서는 다음과 같다.

1. 매핑된 국내 `Location`을 조회해 후보를 만든다
2. 기준·비교 계절 방문자가 0 이하인 후보를 제외한다 (증가율 발산 방지)
3. 방문자가 줄어든 지역(`growthRate <= 0`)을 제외한다 — "인기 여행지"가 아니다
4. `growthRate` 내림차순으로 정렬한다

향후 극소규모 지역의 폭주로 방어가 필요해지면, 상대 분위수 대신 **절대 하한**(예: 방문자 50만명 미만 제외)을 쓴다. 후보 구성에 따라 임계가 움직이지 않아 결과를 예측할 수 있다.

### 표시 규칙

절대 증감이 주, 증가율이 괄호 보조다. `+32%`는 추상적이지만 `21만 명 증가`는 그림이 그려진다. 반대로 정렬까지 절대값으로 하면 서울·부산이 상단에 고정되어 순위가 죽으므로, **정렬은 증가율 / 표시는 절대값 우선**으로 역할을 나눈다.

- 증가율은 소수점 없이 정수 `%`. 공공 통계에서 소수점은 과잉 정밀도로 읽힌다.
- 방문자 수는 한국어 단위로 축약한다. `1,040,000` → `104만`, 만 미만은 원본 유지.

---

## 아키텍처

### 계층

```text
UI      SeasonalRegionsSummarySection, RegionTrendCard
 ↓
Data    useRegionTourismTrends
 ↓
Domain  tourismTrend.types / tourismTrend.utils / season.ts / tourismTrendRegions
 ↓
Adapter tourismTrend.api  →  governmentApi
```

### 도메인 모델

```ts
interface RegionTourismTrend {
  location: Location;
  visitorCount: number;         // 기준 계절 방문자 수
  previousVisitorCount: number; // 작년 같은 계절
  visitorGrowth: number;        // 절대 증감
  growthRate: number;           // 증가율 (0.3 === +30%)
  season: Season;
  referenceYear: number;        // 기준 계절의 연도
}
```

`Location`을 그대로 쓰고 API의 `areaCode`/`signguCode`는 도메인 모델에 노출하지 않는다. 코드 체계는 어댑터와 카탈로그 안에 가둔다.

### 순수 함수 분리

집계·게이트·정렬 규칙을 전부 `tourismTrend.utils.ts`에 모으고 단위 테스트로 덮는다. `expense.utils.ts`가 `calculateBalancesInKRW`를 훅과 분리한 것과 같은 구조이며, 이 기능에서 테스트 가치가 가장 높은 지점이다.

```ts
sumVisitorsByRegionCode(items): Map<string, number>  // 일별 전 지역 → 지역코드별 합계, 현지인 제외
toRegionTourismTrend(current, previous): RegionTourismTrend | null
sortByVisitorGrowth(trends): RegionTourismTrend[]    // 감소 지역 제외 + 증가율 정렬
```

`sumVisitorsByRegionCode`가 전 지역 응답을 지역코드 기준으로 한 번에 접는다. 7만 건을 순회하므로 단일 패스로 처리하고, `Location` 매핑은 그 뒤에 적용해 필요한 지역만 남긴다.

`limit` 슬라이싱은 소비자 몫이므로 인터페이스에 넣지 않는다.

계절 경계 계산은 `season.ts`로 분리한다. 겨울의 연도 귀속 처리가 들어가므로 독립 테스트가 필요하다.

```ts
getCurrentSeason(date): Season
getSeasonMonthRange(season, year): { startYmd: string; endYmd: string }
```

### 네이밍

훅 이름에 소비자 맥락을 담지 않는다. "Popular"나 "Seasonal"은 탐색 큐레이션의 판단이고, 훅의 책임은 "지역별 관광 추이"다.

```ts
// ✗
useSeasonalPopularRegions()

// ✓
useRegionTourismTrends({ season, year })
```

---

## UI

### 배치

`ExplorerCatalog`의 **최상단**에 추가한다. 나머지 세 섹션은 장소 단위인데 이것만 지역 단위이므로, 넓은 단위에서 좁은 단위로 내려가는 순서가 자연스럽다.

### 카피

계절에 따라 제목이 바뀐다.

| 계절 | 카피 |
| --- | --- |
| 봄 | 봄에 사람들이 몰리는 지역 |
| 여름 | 여름에 사람들이 몰리는 지역 |
| 가을 | 가을에 사람들이 몰리는 지역 |
| 겨울 | 겨울에 사람들이 몰리는 지역 |

제목 옆에 기준 연도(`2025년 여름 기준`)를 작게 명시한다. 작년 데이터를 쓴다는 사실을 숨기지 않는다.

### 카드

기존 `PlaceCard`는 장소 사진 기반이라 재사용할 수 없다(지역은 대표 사진이 없다). `RegionTrendCard`를 신규로 만들되 가로 스크롤·카드 폭·`Scrollable.Horizontal` 등 레이아웃 관습은 `RecentHotSummarySection`을 따른다.

```text
┌─────────────────┐
│  1              │  순위
│  양양            │  Location
│  강원도          │  LocationRegion
│  87만 명 방문     │  기준 계절 방문자
│  ▲ 21만 (+32%)  │  절대 증감(주) + 증가율(보조)
└─────────────────┘
```

- 증감은 `success.main` 계열 + `▲`
- `AnimatedCountText`로 카운트업 (`shared/components/animation`)
- 순위는 카드가 계산하지 않고 소비자가 넘긴다: `<RegionTrendCard trend={trend} rank={index + 1} />`

### 인터랙션

카드를 탭하면 **해당 지역으로 탐색 필터를 적용**한다. 지역 상세 페이지는 만들지 않는다.

```ts
const { setLocation } = useExplorerFilterParams();
```

"양양이 좋구나" → 탭 → 양양의 장소들이 보인다. 기존 필터 인프라를 그대로 쓰므로 구현 비용이 거의 없고, 큐레이션에서 탐색으로 이어지는 동선이 완성된다.

### 더보기 페이지

만들지 않는다. 국내 `Location`이 29개이고 섹션에서 상위 20개를 노출하므로 의미 있는 건 거의 다 나온다. 전용 페이지는 라우트와 모바일/데스크탑 분기까지 파일이 6개 늘어나는데 담을 내용이 부족하다. 필요해지면 그때 추가한다.

### 빈 상태

게이트 통과 지역이 0개이거나 API가 실패하면 기존 관습대로 `자료를 찾을 수 없어요`를 표시한다. 섹션 전체를 `Suspense`로 감싸고 `.Skeleton`을 제공한다 — 기존 세 섹션과 동일하다.

---

## 파일 구조

```text
src/features/tourism-trend/                        # 신규 — 데이터 도메인
├── tourismTrend.api.ts
├── tourismTrend.types.ts
├── tourismTrend.utils.ts
├── tourismTrendRegions.ts
├── season.ts
├── useRegionTourismTrends.ts
└── __tests__/
    ├── tourismTrend.utils.test.ts
    └── season.test.ts

src/features/explorer/explorer-seasonal-regions/   # 신규 — UI
├── SeasonalRegionsSummarySection.tsx
└── RegionTrendCard.tsx
```

| 파일 | 변경 유형 |
| --- | --- |
| `src/features/tourism-trend/*` | 신규 (8) |
| `src/features/explorer/explorer-seasonal-regions/*` | 신규 (2) |
| `src/features/explorer/ExplorerCatalog.tsx` | 섹션 추가 |
| `src/shared/utils/formats.ts` | `formatKoreanCount` 추가 |

### 위치 근거

데이터 도메인을 `explorer` 밖에 두는 이유는 공공 관광 통계가 탐색 탭 전용 개념이 아니기 때문이다. 소유 주체는 관광 통계 도메인이고 탐색은 소비처다. `marine-activity`(도메인)와 `trip-marine-activity`(UI)가 분리된 것과 같은 패턴이며, 여행 생성 시 목적지 추천 등에 재사용할 여지가 있다.

`formatKoreanCount`는 도메인과 무관한 순수 함수이므로 `shared/utils/formats.ts`에 둔다.

`season.ts`는 계절 개념이 관광 추이 도메인 안에서만 쓰이므로 `tourism-trend` 내부에 둔다. 다른 도메인이 계절을 필요로 하게 되면 그때 `shared`로 승격한다.

예상 변경 규모는 450줄 안쪽으로, 브랜치당 500줄 목표에 들어온다.

---

## 구현 순서

1. ~~API 프로브~~ — 완료(2026-08-13). `touDivCd` 코드값·래퍼 구조·호출 전략 확정됨
2. `season.ts` + 테스트 — 외부 의존이 없어 먼저 확정 가능하다
3. `tourismTrend.types.ts` / `tourismTrendRegions.ts` — 지자체 코드 카탈로그
4. `tourismTrend.api.ts` — 어댑터
5. `tourismTrend.utils.ts` + 테스트 — 집계·게이트·정렬
6. `useRegionTourismTrends.ts`
7. `formatKoreanCount`
8. UI 2종 + `ExplorerCatalog` 연결

---

## 고려사항

- 방문자 수는 **일자별 순방문자 합**이다. 2박 3일 방문자는 3명으로 집계되므로 "명"은 연인원 개념이다. 카피에서 실인원처럼 읽히지 않도록 `87만 명 방문` 정도로 절제한다.
- 계절 경계에서 큐레이션이 한 번에 교체된다. 8월 31일과 9월 1일의 내용이 완전히 달라지는데, 이는 "가을 큐레이션이 열렸다"는 신선함으로 활용할 수 있다.
- `tourismTrendRegions`의 지자체 코드는 수동 카탈로그다. `Location`이 추가되면 함께 갱신해야 하며, 매핑이 없는 `Location`은 조용히 후보에서 제외된다.
- **일일 호출 한도가 방문자 수에 비례해 소진된다 (알려진 한계).** `staleTime`은 브라우저 로컬 `QueryClient`의 캐시라 **사용자 간에는 호출을 줄이지 못한다.** 콜드 방문자 1명당 4회이므로 **약 250명이면 개발계정 1,000회/일이 소진**되고, 이후 방문자에게는 `ErrorBoundary`가 섹션을 접는다.
  - 설계 초안에 "호출이 4회뿐이라 충분하다"고 적었던 것은 1인 기준만 계산한 오류다.
  - 현재 서비스 규모에서는 실제 문제가 아니므로 그대로 둔다. 대신 실패가 조용히 묻히지 않도록 `ExplorerCatalog`의 `ErrorBoundary`에서 원인을 로깅한다.
  - 성장 시 해소 방법은 두 가지다. (1) 운영계정 전환으로 한도를 늘린다. (2) Supabase Edge Function + 테이블 + cron으로 **서버에서 하루 1회 집계해 공유 캐시**를 둔다. 후자가 근본적이지만 이 기능만의 문제가 아니므로 별도 설계 대상이다.
- **서비스 키는 `.env`에 이미 URL 인코딩된 상태로 저장되어 있다**(`%3D`로 끝난다). 재인코딩하면 `%253D`가 되어 `SERVICE_KEY_IS_NOT_REGISTERED_ERROR`가 난다. `queryParams.serialize`는 키를 `String(value)`로 그대로 붙이므로(URL 형태가 아니라 `encodeURI` 분기를 타지 않는다) 기존 `governmentApi`를 그대로 써도 안전하다 — 검증 완료. 별도 인코딩 로직을 추가하지 않는다.
- `locgo` 응답은 압축 후에도 약 800KB다. 모바일 회선에서 체감이 나쁘면 `metco`(806KB 비압축, 훨씬 가벼움)만 우선 노출하는 단계적 접근을 고려한다.
