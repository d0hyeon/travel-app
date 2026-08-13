# 탐색 탭 인기 지역 큐레이션 설계

**날짜:** 2026-08-13
**상태:** 승인됨

---

## 배경

탐색 탭의 기존 큐레이션 세 섹션(급상승·저장순·최다방문)은 모두 **우리 앱 내부 방문 기록** 기반이며 단위가 **장소(Place)** 다. 앱 데이터만으로는 "전국에서 실제로 어디가 뜨는지"를 알 수 없다.

공공 관광 통계를 도입해 **지역(Location) 단위**의 방문 추이 큐레이션을 추가한다. 기존 섹션과 겹치지 않는 새로운 축이다.

| | 기존 급상승 | 신규 인기 지역 |
| --- | --- | --- |
| 데이터 | Supabase 내부 방문 기록 | 공공 관광 통계 |
| 단위 | 장소(Place) | 지역(Location) |
| 증감 | 없음 (score만) | 전월 대비 절대 증감 + 증가율 |

---

## 데이터 소스

**[한국관광공사_관광빅데이터 정보서비스](https://www.data.go.kr/data/15101972/openapi.do)** (`data.go.kr` 15101972)

| 항목 | 내용 |
| --- | --- |
| 원천 | KT(내국인) + SKT(외국인) 이동통신 데이터 |
| 방문자 정의 | 일상생활권을 벗어나 체류한 사람. 일자별 순방문자 |
| 단위 | 광역 / 기초지자체(시군구) |
| 제공 시작 | 2020년 1월 |
| 갱신 | 매월 17일, 전월분 공개 |
| 조회 한도 | 월간 조회 시 최대 18개월 |
| 트래픽 | 개발계정 1,000회/일 (자동승인) |

기존 `governmentApi`(`~api/governmentApi`)와 `VITE_DATA_GO_SERVICE_KEY`를 그대로 재사용한다. `marine-activity`가 쓰는 인프라와 동일하므로 신규 서버 인프라·DB 테이블·CORS 우회가 필요 없다.

### 제약

1. **합산 불가** — 기초지자체와 광역지자체는 집계 기준이 달라 시군구 값을 더해 광역 값을 만들 수 없다. `Location`마다 조회 레벨을 카탈로그에 명시한다.
2. **국내 한정** — 해외 `Location`은 커버리지에 없으므로 후보에서 제외된다. `marineActivityEligibility`가 국내 해안만 판정하는 것과 같은 구조다.
3. **약 1개월 시차** — 항상 1~2개월 전 완결 월을 다룬다. 기준 월을 UI에 반드시 노출한다.

---

## 랭킹 규칙

### 정렬 — 전월 대비 증가율

전월보다 방문자가 늘었으면 실제로 핫해진 것이므로 전월 대비를 그대로 쓴다. 계절 보정·인구 정규화·Z-score는 검토했으나 모두 도입하지 않는다.

- **계절 보정 안 함** — 여름에 해안 지역이 급등하는 건 왜곡이 아니라 사용자가 알고 싶어 하는 사실이다.
- **인구 정규화 안 함** — 정적 순위가 되어 "증가량"이라는 요구와 어긋나고, 인구 API가 추가로 필요하다.
- **Z-score 안 함** — "평소 대비 이례적"은 사용자가 묻는 질문이 아니다.

### 게이트 — 중앙값

증가율만으로 정렬하면 방문자 수가 적은 지역이 독식한다.

| 지역 | 전월 | 기준월 | 증가율 |
| --- | ---: | ---: | ---: |
| 진안 | 2,000 | 4,000 | +100% |
| 강릉 | 800,000 | 1,040,000 | +30% |

진안이 1위가 되지만 축제 하나로도 흔들리는 노이즈다. 기준 월 방문자 수가 **후보 전체의 중앙값 미만**인 지역을 제외한 뒤 증가율로 정렬한다.

적용 순서를 명시한다. 중앙값은 신규 진입을 배제한 뒤 남은 집합에서 계산한다.

1. 매핑된 국내 `Location`을 조회해 후보를 만든다
2. 전월 방문자가 0 이하인 후보를 제외한다 (아래 신규 진입 배제)
3. 남은 후보의 `visitorCount` 중앙값을 구한다
4. 중앙값 미만인 후보를 제외한다
5. `growthRate` 내림차순으로 정렬한다

후보가 1개 이하이면 중앙값 게이트를 건너뛴다(자기 자신이 중앙값이 되어 전부 탈락하거나 무의미해지는 것을 막는다). 증가율이 음수인 지역은 정렬 결과 하단에 남지만, 섹션은 상위 10개만 노출하므로 실질적으로 표시되지 않는다.

상수 임계값 대신 중앙값을 쓰는 이유는 지역 규모 분포나 계절 전체 변동에 자동으로 적응하기 때문이다. 기존 `useRecentHotPlaces`가 `maxScore / 2`로 상대 임계값을 쓰는 방식과 같은 정신이다.

### 신규 진입 배제

전월 방문자가 0 이하이면 증가율이 발산하므로 후보에서 제외한다. 2020년부터 데이터가 있어 실제 발생은 드물지만 방어가 필요하다.

### 표시 규칙

절대 증감이 주, 증가율이 괄호 보조다. `+32%`는 추상적이지만 `24만 명 증가`는 그림이 그려진다. 반대로 정렬까지 절대값으로 하면 서울·부산이 상단에 고정되어 순위가 죽으므로, **정렬은 증가율 / 표시는 절대값 우선**으로 역할을 나눈다.

- 증가율은 소수점 없이 정수 `%`. 공공 통계에서 소수점은 과잉 정밀도로 읽힌다.
- 방문자 수는 한국어 단위로 축약한다. `1,040,000` → `104만`, 만 미만은 원본 유지.

---

## 아키텍처

### 계층

```text
UI      PopularRegionsSummarySection, RegionTrendCard
 ↓
Data    useRegionTourismTrends
 ↓
Domain  tourismTrend.types / tourismTrend.utils / tourismTrendRegions
 ↓
Adapter tourismTrend.api  →  governmentApi
```

### 도메인 모델

```ts
interface RegionTourismTrend {
  location: Location;
  visitorCount: number;         // 기준 월 방문자 수
  previousVisitorCount: number; // 직전 월
  visitorGrowth: number;        // 절대 증감
  growthRate: number;           // 증가율 (0.3 === +30%)
  referenceMonth: string;       // 'yyyy-MM'
}
```

`Location`을 그대로 쓰고 API의 `areaCd`/`signguCd`는 도메인 모델에 노출하지 않는다. 코드 체계는 어댑터와 카탈로그 안에 가둔다.

### 조회 전략

기준 월과 직전 월 **2개월치를 한 번의 요청**(`startYmd`~`endYmd`)으로 받고 월별로 갈라 증감을 계산한다. `Location`당 1회, 국내 약 30개 지역이므로 최대 30회. `staleTime`을 하루로 두면 1,000회/일 한도에 여유가 있다.

> 구현 초반 스파이크: `areaCd` 없이 전체 지역을 한 번에 받을 수 있으면 호출이 1~2회로 줄어든다. 실제 응답을 확인해 가능하면 그쪽으로 전환한다.

### 순수 함수 분리

게이트·정렬·배제 규칙은 전부 `tourismTrend.utils.ts`에 모으고 단위 테스트로 덮는다. `expense.utils.ts`가 `calculateBalancesInKRW`를 훅과 분리한 것과 같은 구조다.

```ts
toRegionTourismTrend(current, previous): RegionTourismTrend | null
sortByVisitorGrowth(trends): RegionTourismTrend[]  // 중앙값 게이트 + 증가율 정렬
```

`limit` 슬라이싱은 소비자 몫이므로 함수 인터페이스에 넣지 않는다.

### 네이밍

훅 이름에 소비자 맥락을 담지 않는다. "Popular"는 탐색 큐레이션의 판단이고, 훅의 책임은 "지역별 관광 추이"다.

```ts
// ✗
usePopularRegions()

// ✓
useRegionTourismTrends()
```

---

## UI

### 배치

`ExplorerCatalog`의 **최상단**에 추가한다. 나머지 세 섹션은 장소 단위인데 이것만 지역 단위이므로, 넓은 단위에서 좁은 단위로 내려가는 순서가 자연스럽다.

### 카피

| 섹션 | 카피 |
| --- | --- |
| **신규** | **지난달 사람들이 몰린 지역** |
| 기존 | 최근 핫한 곳이에요 |

"인기 관광 지역"보다 정확하다 — 실제로 재는 것이 전월 대비 방문자 증가다. 제목 옆에 기준 월(`2026년 7월 기준`)을 작게 명시한다. 시차가 있는 데이터라 이것이 없으면 신뢰를 잃는다.

### 카드

기존 `PlaceCard`는 장소 사진 기반이라 재사용할 수 없다(지역은 대표 사진이 없다). `RegionTrendCard`를 신규로 만들되 가로 스크롤·카드 폭·`Scrollable.Horizontal` 등 레이아웃 관습은 `RecentHotSummarySection`을 따른다.

```text
┌─────────────────┐
│  1              │  순위
│  강릉            │  Location
│  강원도          │  LocationRegion
│  104만 명 방문    │  절대 규모
│  ▲ 24만 (+30%)  │  절대 증감(주) + 증가율(보조)
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

"강릉이 떴네" → 탭 → 강릉의 장소들이 보인다. 기존 필터 인프라를 그대로 쓰므로 구현 비용이 거의 없고, 큐레이션에서 탐색으로 이어지는 동선이 완성된다.

### 더보기 페이지

만들지 않는다. 국내 `Location`이 30개뿐이라 상위 10개면 의미 있는 건 거의 다 나온다. 전용 페이지는 라우트와 모바일/데스크탑 분기까지 파일이 6개 늘어나는데 담을 내용이 부족하다. 필요해지면 그때 추가한다.

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
├── useRegionTourismTrends.ts
└── __tests__/
    └── tourismTrend.utils.test.ts

src/features/explorer/explorer-popular-regions/    # 신규 — UI
├── PopularRegionsSummarySection.tsx
└── RegionTrendCard.tsx
```

| 파일 | 변경 유형 |
| --- | --- |
| `src/features/tourism-trend/*` | 신규 (6) |
| `src/features/explorer/explorer-popular-regions/*` | 신규 (2) |
| `src/features/explorer/ExplorerCatalog.tsx` | 섹션 추가 |
| `src/shared/utils/formats.ts` | `formatKoreanCount` 추가 |

### 위치 근거

데이터 도메인을 `explorer` 밖에 두는 이유는 공공 관광 통계가 탐색 탭 전용 개념이 아니기 때문이다. 소유 주체는 관광 통계 도메인이고 탐색은 소비처다. `marine-activity`(도메인)와 `trip-marine-activity`(UI)가 분리된 것과 같은 패턴이며, 여행 생성 시 목적지 추천 등에 재사용할 여지가 있다.

`formatKoreanCount`는 도메인과 무관한 순수 함수이므로 `shared/utils/formats.ts`에 둔다.

예상 변경 규모는 400줄 안쪽으로, 브랜치당 500줄 목표에 들어온다.

---

## 고려사항

- 방문자 수는 **일자별 순방문자 합**이다. 2박 3일 방문자는 3명으로 집계되므로 "명"은 연인원 개념이다. 카피에서 실인원처럼 읽히지 않도록 `104만 명 방문` 정도로 절제한다.
- `tourismTrendRegions`의 지자체 코드는 수동 카탈로그다. `Location`이 추가되면 이 파일도 함께 갱신해야 하며, 매핑이 없는 `Location`은 조용히 후보에서 제외된다.
- 개발계정 트래픽 1,000회/일은 개발 중에는 충분하지만, 배포 후 사용자가 늘면 운영계정 전환(활용사례 등록)이 필요하다.
