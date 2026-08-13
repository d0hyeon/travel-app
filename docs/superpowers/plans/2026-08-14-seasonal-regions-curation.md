# 계절 인기 지역 큐레이션 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 탐색 탭 최상단에 공공 관광 통계 기반 "계절별 인기 지역" 큐레이션 섹션을 추가한다. 작년 같은 계절의 방문자 수와 그 전년 대비 증감을 함께 보여준다.

**Architecture:** 한국관광공사 관광빅데이터 API를 `governmentApi` 어댑터로 호출해 일별 전 지역 데이터를 받고, 순수 함수로 계절 합계·게이트·정렬을 처리한 뒤 React Query 훅으로 감싸 UI에 제공한다. 데이터 도메인(`features/tourism-trend`)과 UI(`features/explorer/explorer-seasonal-regions`)를 분리한다.

**Tech Stack:** React 19, TypeScript 5.9, TanStack React Query 5, MUI 7, Vitest 3, date-fns

**Spec:** `docs/superpowers/specs/2026-08-13-seasonal-regions-curation-design.md`

## Global Constraints

- 테스트 실행: `pnpm test`. 단일 파일은 `pnpm test <경로>`. 테스트 파일 위치는 도메인 디렉토리 하위 `__tests__/`.
- import 별칭: `~features/*`, `~shared/*`, `~api/*`, `~app/*` (`src/` 기준).
- 방문자 집계는 **`touDivCd` `2`(외지인) + `3`(외국인)만** 합산한다. `1`(현지인)은 반드시 제외한다.
- API 성공 코드는 `"0000"` 이다 (marine-activity의 `"00"`과 다름).
- 서비스 키는 `.env`에 이미 URL 인코딩되어 있다. **재인코딩 금지.** 기존 `governmentApi`를 그대로 쓰면 안전하다.
- 계절 정의: 봄 3–5월, 여름 6–8월, 가을 9–11월, 겨울 12–2월. 12월은 **다음 해 겨울**로 귀속한다.
- 기준 계절은 항상 **작년 같은 계절**, 비교 대상은 **그 전년 같은 계절**이다.
- 증가율은 정수 `%`로 표시하고, 방문자 수는 만 단위 한국어로 축약한다(`104만`). 만 미만은 원본 유지.
- 커밋 메시지는 한글 한 문장, 스코프 활용. 목적 단위로 분리한다.
- 모든 커밋 메시지 끝에 다음 줄을 포함한다: `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`

---

## File Structure

| 파일 | 책임 |
| --- | --- |
| `src/features/tourism-trend/season.ts` | 계절 판정과 계절→날짜 범위 변환 |
| `src/features/tourism-trend/tourismTrend.types.ts` | 도메인 모델과 API 원시 타입 |
| `src/features/tourism-trend/tourismTrendRegions.ts` | `Location` → 지자체 코드/레벨 카탈로그 |
| `src/features/tourism-trend/tourismTrend.utils.ts` | 집계·게이트·정렬 순수 함수 |
| `src/features/tourism-trend/tourismTrend.api.ts` | data.go.kr 어댑터 |
| `src/features/tourism-trend/useRegionTourismTrends.ts` | React Query 훅 |
| `src/features/explorer/explorer-seasonal-regions/RegionTrendCard.tsx` | 지역 카드 (순수 표현) |
| `src/features/explorer/explorer-seasonal-regions/SeasonalRegionsSummarySection.tsx` | 섹션 + 스켈레톤 |
| `src/shared/utils/formats.ts` | `formatKoreanCount` 추가 |
| `src/features/explorer/ExplorerCatalog.tsx` | 섹션 연결 |

---

## Task 1: 계절 모델

**Files:**
- Create: `src/features/tourism-trend/season.ts`
- Test: `src/features/tourism-trend/__tests__/season.test.ts`

**Interfaces:**
- Consumes: 없음 (외부 의존 없음)
- Produces:
  - `Season` 상수 객체와 `SeasonValue` 타입
  - `getSeasonOf(date: Date): SeasonValue`
  - `getSeasonYearOf(date: Date): number`
  - `getSeasonDateRange(season: SeasonValue, year: number): { startYmd: string; endYmd: string }`
  - `SeasonLabel: Record<SeasonValue, string>`

- [ ] **Step 1: Write the failing test**

`src/features/tourism-trend/__tests__/season.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  Season,
  SeasonLabel,
  getSeasonDateRange,
  getSeasonOf,
  getSeasonYearOf,
} from '../season'

describe('getSeasonOf', () => {
  it('3~5월은 봄이다', () => {
    expect(getSeasonOf(new Date('2026-03-01'))).toBe(Season.Spring)
    expect(getSeasonOf(new Date('2026-05-31'))).toBe(Season.Spring)
  })

  it('6~8월은 여름이다', () => {
    expect(getSeasonOf(new Date('2026-06-01'))).toBe(Season.Summer)
    expect(getSeasonOf(new Date('2026-08-31'))).toBe(Season.Summer)
  })

  it('9~11월은 가을이다', () => {
    expect(getSeasonOf(new Date('2026-09-01'))).toBe(Season.Autumn)
    expect(getSeasonOf(new Date('2026-11-30'))).toBe(Season.Autumn)
  })

  it('12~2월은 겨울이다', () => {
    expect(getSeasonOf(new Date('2026-12-01'))).toBe(Season.Winter)
    expect(getSeasonOf(new Date('2026-01-31'))).toBe(Season.Winter)
    expect(getSeasonOf(new Date('2026-02-28'))).toBe(Season.Winter)
  })
})

describe('getSeasonYearOf', () => {
  it('12월은 다음 해 겨울로 귀속된다', () => {
    expect(getSeasonYearOf(new Date('2025-12-15'))).toBe(2026)
  })

  it('1~2월은 그 해 겨울이다', () => {
    expect(getSeasonYearOf(new Date('2026-01-15'))).toBe(2026)
    expect(getSeasonYearOf(new Date('2026-02-15'))).toBe(2026)
  })

  it('겨울이 아닌 계절은 달력 연도를 그대로 쓴다', () => {
    expect(getSeasonYearOf(new Date('2026-07-15'))).toBe(2026)
  })
})

describe('getSeasonDateRange', () => {
  it('여름은 6월 1일부터 8월 31일까지다', () => {
    expect(getSeasonDateRange(Season.Summer, 2025)).toEqual({
      startYmd: '20250601',
      endYmd: '20250831',
    })
  })

  it('봄은 3월 1일부터 5월 31일까지다', () => {
    expect(getSeasonDateRange(Season.Spring, 2025)).toEqual({
      startYmd: '20250301',
      endYmd: '20250531',
    })
  })

  it('가을은 9월 1일부터 11월 30일까지다', () => {
    expect(getSeasonDateRange(Season.Autumn, 2025)).toEqual({
      startYmd: '20250901',
      endYmd: '20251130',
    })
  })

  it('겨울은 전년 12월 1일부터 당해 2월 말일까지다', () => {
    expect(getSeasonDateRange(Season.Winter, 2025)).toEqual({
      startYmd: '20241201',
      endYmd: '20250228',
    })
  })

  it('윤년 겨울은 2월 29일까지다', () => {
    expect(getSeasonDateRange(Season.Winter, 2024)).toEqual({
      startYmd: '20231201',
      endYmd: '20240229',
    })
  })
})

describe('SeasonLabel', () => {
  it('계절마다 한글 라벨이 있다', () => {
    expect(SeasonLabel[Season.Summer]).toBe('여름')
    expect(SeasonLabel[Season.Winter]).toBe('겨울')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/features/tourism-trend/__tests__/season.test.ts`
Expected: FAIL — `Failed to resolve import "../season"`

- [ ] **Step 3: Write minimal implementation**

`src/features/tourism-trend/season.ts`:

```ts
import { endOfMonth, format } from 'date-fns'
import type { ValueOf } from '~shared/utils/types'

export const Season = {
  Spring: 'spring',
  Summer: 'summer',
  Autumn: 'autumn',
  Winter: 'winter',
} as const

export type SeasonValue = ValueOf<typeof Season>

export const SeasonLabel: Record<SeasonValue, string> = {
  [Season.Spring]: '봄',
  [Season.Summer]: '여름',
  [Season.Autumn]: '가을',
  [Season.Winter]: '겨울',
}

// 계절의 시작 월. 겨울은 전년 12월에 시작한다.
const SeasonStartMonth: Record<SeasonValue, number> = {
  [Season.Spring]: 3,
  [Season.Summer]: 6,
  [Season.Autumn]: 9,
  [Season.Winter]: 12,
}

export function getSeasonOf(date: Date): SeasonValue {
  const month = date.getMonth() + 1
  if (month >= 3 && month <= 5) return Season.Spring
  if (month >= 6 && month <= 8) return Season.Summer
  if (month >= 9 && month <= 11) return Season.Autumn
  return Season.Winter
}

// 12월은 다음 해 겨울에 속한다. 그 외에는 달력 연도와 같다.
export function getSeasonYearOf(date: Date): number {
  const month = date.getMonth() + 1
  const year = date.getFullYear()
  return month === 12 ? year + 1 : year
}

export function getSeasonDateRange(season: SeasonValue, year: number) {
  const startMonth = SeasonStartMonth[season]
  const startYear = season === Season.Winter ? year - 1 : year
  const start = new Date(startYear, startMonth - 1, 1)
  const end = endOfMonth(new Date(startYear, startMonth + 1, 1))

  return {
    startYmd: format(start, 'yyyyMMdd'),
    endYmd: format(end, 'yyyyMMdd'),
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/features/tourism-trend/__tests__/season.test.ts`
Expected: PASS — 12 tests

- [ ] **Step 5: Commit**

```bash
git add src/features/tourism-trend/season.ts src/features/tourism-trend/__tests__/season.test.ts
git commit -m "feat(tourism-trend): 계절 판정 및 날짜 범위 모델 추가

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 2: 도메인 타입과 지역 카탈로그

**Files:**
- Create: `src/features/tourism-trend/tourismTrend.types.ts`
- Create: `src/features/tourism-trend/tourismTrendRegions.ts`
- Test: `src/features/tourism-trend/__tests__/tourismTrendRegions.test.ts`

**Interfaces:**
- Consumes: Task 1의 `SeasonValue`
- Produces:
  - `RegionLevel` 상수 (`Metro` | `Local`), `RegionLevelValue`
  - `VisitorDivision` 상수 (`Local`=`'1'`, `Domestic`=`'2'`, `Foreign`=`'3'`)
  - `TourismVisitorItem` 인터페이스 (API 원시 아이템 정규화 형태)
  - `RegionTourismTrend` 인터페이스
  - `TourismTrendRegion` 인터페이스, `TourismTrendRegions: Partial<Record<Location, TourismTrendRegion>>`
  - `getTourismTrendRegions(level): { location, regionCode }[]`

- [ ] **Step 1: Write the failing test**

`src/features/tourism-trend/__tests__/tourismTrendRegions.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { LocationCountry } from '~features/location/location.model'
import { Country } from '~features/location/country.model'
import { RegionLevel } from '../tourismTrend.types'
import {
  TourismTrendRegions,
  getTourismTrendRegions,
} from '../tourismTrendRegions'

describe('TourismTrendRegions', () => {
  it('해외 Location은 매핑하지 않는다', () => {
    const overseas = Object.keys(TourismTrendRegions).filter(
      (location) =>
        LocationCountry[location as keyof typeof LocationCountry] !==
        Country.한국,
    )
    expect(overseas).toEqual([])
  })

  it('광역시는 metro 레벨로 매핑한다', () => {
    expect(TourismTrendRegions.서울).toEqual({
      level: RegionLevel.Metro,
      regionCode: '11',
    })
    expect(TourismTrendRegions.부산).toEqual({
      level: RegionLevel.Metro,
      regionCode: '26',
    })
  })

  it('시군구는 local 레벨로 매핑한다', () => {
    expect(TourismTrendRegions.강릉).toEqual({
      level: RegionLevel.Local,
      regionCode: '51150',
    })
    expect(TourismTrendRegions.양양).toEqual({
      level: RegionLevel.Local,
      regionCode: '51830',
    })
  })

  it('포항은 구 단위가 아닌 시 단위 코드를 쓴다', () => {
    // 47111(남구), 47113(북구)를 쓰면 중복 집계된다
    expect(TourismTrendRegions.포항?.regionCode).toBe('47110')
  })

  it('전주는 구 단위가 아닌 시 단위 코드를 쓴다', () => {
    expect(TourismTrendRegions.전주?.regionCode).toBe('52110')
  })
})

describe('getTourismTrendRegions', () => {
  it('레벨별로 지역 목록을 반환한다', () => {
    const metros = getTourismTrendRegions(RegionLevel.Metro)
    expect(metros).toContainEqual({ location: '서울', regionCode: '11' })
    expect(metros.every((r) => r.regionCode.length === 2)).toBe(true)
  })

  it('local 레벨은 5자리 코드만 포함한다', () => {
    const locals = getTourismTrendRegions(RegionLevel.Local)
    expect(locals).toContainEqual({ location: '강릉', regionCode: '51150' })
    expect(locals.every((r) => r.regionCode.length === 5)).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/features/tourism-trend/__tests__/tourismTrendRegions.test.ts`
Expected: FAIL — `Failed to resolve import "../tourismTrend.types"`

- [ ] **Step 3: Write the types**

`src/features/tourism-trend/tourismTrend.types.ts`:

```ts
import type { Location } from '~features/location'
import type { ValueOf } from '~shared/utils/types'
import type { SeasonValue } from './season'

// 광역(시도)과 기초(시군구)는 집계 기준이 달라 합산할 수 없다.
// 엔드포인트 자체가 분리되어 있으므로 Location마다 레벨을 지정한다.
export const RegionLevel = {
  Metro: 'metro',
  Local: 'local',
} as const

export type RegionLevelValue = ValueOf<typeof RegionLevel>

// touDivCd. 현지인을 포함하면 관광객이 아니라 유동인구가 된다.
export const VisitorDivision = {
  Local: '1',
  Domestic: '2',
  Foreign: '3',
} as const

export type VisitorDivisionValue = ValueOf<typeof VisitorDivision>

export interface TourismTrendRegion {
  level: RegionLevelValue
  regionCode: string
}

// API 원시 아이템을 레벨 차이(areaCode/signguCode)를 흡수해 정규화한 형태
export interface TourismVisitorItem {
  regionCode: string
  visitorDivision: string
  visitorCount: number
}

export interface RegionTourismTrend {
  location: Location
  visitorCount: number
  previousVisitorCount: number
  visitorGrowth: number
  growthRate: number
  season: SeasonValue
  referenceYear: number
}
```

- [ ] **Step 4: Write the region catalog**

`src/features/tourism-trend/tourismTrendRegions.ts`:

실제 API 응답에서 확인한 코드다 (2026-08-13 검증). 해외 `Location`은 커버리지가 없어 제외한다.

```ts
import type { Location } from '~features/location'
import {
  RegionLevel,
  type RegionLevelValue,
  type TourismTrendRegion,
} from './tourismTrend.types'

const metro = (regionCode: string): TourismTrendRegion => ({
  level: RegionLevel.Metro,
  regionCode,
})

const local = (regionCode: string): TourismTrendRegion => ({
  level: RegionLevel.Local,
  regionCode,
})

// 포항(47110)과 전주(52110)는 구 단위 코드가 별도로 존재한다.
// 시 단위 코드를 써야 중복 집계를 피할 수 있다.
export const TourismTrendRegions: Partial<
  Record<Location, TourismTrendRegion>
> = {
  서울: metro('11'),
  부산: metro('26'),
  대구: metro('27'),
  인천: metro('28'),
  광주: metro('29'),
  대전: metro('30'),
  울산: metro('31'),
  제주: metro('50'),

  가평: local('41820'),
  포천: local('41650'),

  춘천: local('51110'),
  강릉: local('51150'),
  태백: local('51190'),
  속초: local('51210'),
  삼척: local('51230'),
  평창: local('51760'),
  정선: local('51770'),
  인제: local('51810'),
  양양: local('51830'),

  단양: local('43800'),
  보령: local('44180'),

  경주: local('47130'),
  포항: local('47110'),
  울진: local('47930'),
  울릉도: local('47940'),

  여수: local('46130'),
  담양: local('46710'),
  전주: local('52110'),
  진안: local('52720'),
}

export function getTourismTrendRegions(level: RegionLevelValue) {
  return Object.entries(TourismTrendRegions)
    .filter(([, region]) => region.level === level)
    .map(([location, region]) => ({
      location: location as Location,
      regionCode: region.regionCode,
    }))
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test src/features/tourism-trend/__tests__/tourismTrendRegions.test.ts`
Expected: PASS — 7 tests

- [ ] **Step 6: Commit**

```bash
git add src/features/tourism-trend/tourismTrend.types.ts src/features/tourism-trend/tourismTrendRegions.ts src/features/tourism-trend/__tests__/tourismTrendRegions.test.ts
git commit -m "feat(tourism-trend): 도메인 타입과 지자체 코드 카탈로그 추가

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 3: 집계·게이트·정렬 순수 함수

**Files:**
- Create: `src/features/tourism-trend/tourismTrend.utils.ts`
- Test: `src/features/tourism-trend/__tests__/tourismTrend.utils.test.ts`

**Interfaces:**
- Consumes: Task 1의 `Season`/`SeasonValue`, Task 2의 `TourismVisitorItem`/`RegionTourismTrend`/`VisitorDivision`
- Produces:
  - `sumVisitorsByRegionCode(items: TourismVisitorItem[]): Map<string, number>`
  - `toRegionTourismTrend(params): RegionTourismTrend | null`
  - `sortByVisitorGrowth(trends: RegionTourismTrend[]): RegionTourismTrend[]`

- [ ] **Step 1: Write the failing test**

`src/features/tourism-trend/__tests__/tourismTrend.utils.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { Season } from '../season'
import type { RegionTourismTrend, TourismVisitorItem } from '../tourismTrend.types'
import { VisitorDivision } from '../tourismTrend.types'
import {
  sortByVisitorGrowth,
  sumVisitorsByRegionCode,
  toRegionTourismTrend,
} from '../tourismTrend.utils'

function visitorItem(
  regionCode: string,
  visitorDivision: string,
  visitorCount: number,
): TourismVisitorItem {
  return { regionCode, visitorDivision, visitorCount }
}

function trend(
  location: string,
  visitorCount: number,
  previousVisitorCount: number,
): RegionTourismTrend {
  const visitorGrowth = visitorCount - previousVisitorCount
  return {
    location: location as RegionTourismTrend['location'],
    visitorCount,
    previousVisitorCount,
    visitorGrowth,
    growthRate: visitorGrowth / previousVisitorCount,
    season: Season.Summer,
    referenceYear: 2025,
  }
}

describe('sumVisitorsByRegionCode', () => {
  it('외지인과 외국인만 합산한다', () => {
    const result = sumVisitorsByRegionCode([
      visitorItem('51150', VisitorDivision.Local, 100),
      visitorItem('51150', VisitorDivision.Domestic, 200),
      visitorItem('51150', VisitorDivision.Foreign, 30),
    ])
    expect(result.get('51150')).toBe(230)
  })

  it('현지인만 있으면 0이 아니라 항목이 없다', () => {
    const result = sumVisitorsByRegionCode([
      visitorItem('51150', VisitorDivision.Local, 100),
    ])
    expect(result.has('51150')).toBe(false)
  })

  it('여러 날짜와 요일 레코드를 모두 더한다', () => {
    const result = sumVisitorsByRegionCode([
      visitorItem('51150', VisitorDivision.Domestic, 100),
      visitorItem('51150', VisitorDivision.Domestic, 150),
      visitorItem('51150', VisitorDivision.Foreign, 50),
    ])
    expect(result.get('51150')).toBe(300)
  })

  it('지역별로 분리해 합산한다', () => {
    const result = sumVisitorsByRegionCode([
      visitorItem('51150', VisitorDivision.Domestic, 100),
      visitorItem('51830', VisitorDivision.Domestic, 70),
    ])
    expect(result.get('51150')).toBe(100)
    expect(result.get('51830')).toBe(70)
  })
})

describe('toRegionTourismTrend', () => {
  it('증감과 증가율을 계산한다', () => {
    const result = toRegionTourismTrend({
      location: '강릉',
      visitorCount: 1_040_000,
      previousVisitorCount: 800_000,
      season: Season.Summer,
      referenceYear: 2025,
    })
    expect(result).toEqual({
      location: '강릉',
      visitorCount: 1_040_000,
      previousVisitorCount: 800_000,
      visitorGrowth: 240_000,
      growthRate: 0.3,
      season: Season.Summer,
      referenceYear: 2025,
    })
  })

  it('비교 계절 방문자가 0이면 제외한다', () => {
    const result = toRegionTourismTrend({
      location: '강릉',
      visitorCount: 1000,
      previousVisitorCount: 0,
      season: Season.Summer,
      referenceYear: 2025,
    })
    expect(result).toBeNull()
  })

  it('기준 계절 방문자가 0이면 제외한다', () => {
    const result = toRegionTourismTrend({
      location: '강릉',
      visitorCount: 0,
      previousVisitorCount: 1000,
      season: Season.Summer,
      referenceYear: 2025,
    })
    expect(result).toBeNull()
  })

  it('감소한 경우 증가율이 음수다', () => {
    const result = toRegionTourismTrend({
      location: '강릉',
      visitorCount: 800,
      previousVisitorCount: 1000,
      season: Season.Summer,
      referenceYear: 2025,
    })
    expect(result?.growthRate).toBeCloseTo(-0.2)
    expect(result?.visitorGrowth).toBe(-200)
  })
})

describe('sortByVisitorGrowth', () => {
  it('중앙값 미만 지역을 제외한다', () => {
    // 방문자 수: 100, 500, 1000 → 중앙값 500
    const result = sortByVisitorGrowth([
      trend('진안', 100, 50),      // +100%, 중앙값 미만 → 제외
      trend('강릉', 500, 400),     // +25%
      trend('부산', 1000, 900),    // +11%
    ])
    expect(result.map((t) => t.location)).toEqual(['강릉', '부산'])
  })

  it('증가율 내림차순으로 정렬한다', () => {
    const result = sortByVisitorGrowth([
      trend('부산', 1000, 900),    // +11%
      trend('강릉', 1000, 500),    // +100%
      trend('경주', 1000, 800),    // +25%
    ])
    expect(result.map((t) => t.location)).toEqual(['강릉', '경주', '부산'])
  })

  it('후보가 1개면 게이트를 건너뛴다', () => {
    const result = sortByVisitorGrowth([trend('강릉', 100, 50)])
    expect(result).toHaveLength(1)
  })

  it('빈 배열은 빈 배열을 반환한다', () => {
    expect(sortByVisitorGrowth([])).toEqual([])
  })

  it('원본 배열을 변경하지 않는다', () => {
    const trends = [trend('부산', 1000, 900), trend('강릉', 1000, 500)]
    sortByVisitorGrowth(trends)
    expect(trends[0].location).toBe('부산')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/features/tourism-trend/__tests__/tourismTrend.utils.test.ts`
Expected: FAIL — `Failed to resolve import "../tourismTrend.utils"`

- [ ] **Step 3: Write minimal implementation**

`src/features/tourism-trend/tourismTrend.utils.ts`:

```ts
import type { Location } from '~features/location'
import type { SeasonValue } from './season'
import {
  VisitorDivision,
  type RegionTourismTrend,
  type TourismVisitorItem,
} from './tourismTrend.types'

const CountedVisitorDivisions: string[] = [
  VisitorDivision.Domestic,
  VisitorDivision.Foreign,
]

// 일별·요일별로 쪼개진 전 지역 레코드를 지역코드 기준으로 한 번에 접는다.
// 현지인(touDivCd=1)은 관광객이 아니므로 제외한다.
export function sumVisitorsByRegionCode(items: TourismVisitorItem[]) {
  return items.reduce((visitorCounts, item) => {
    if (!CountedVisitorDivisions.includes(item.visitorDivision)) {
      return visitorCounts
    }

    const accumulated = visitorCounts.get(item.regionCode) ?? 0
    visitorCounts.set(item.regionCode, accumulated + item.visitorCount)
    return visitorCounts
  }, new Map<string, number>())
}

interface ToRegionTourismTrendParams {
  location: Location
  visitorCount: number
  previousVisitorCount: number
  season: SeasonValue
  referenceYear: number
}

export function toRegionTourismTrend({
  location,
  visitorCount,
  previousVisitorCount,
  season,
  referenceYear,
}: ToRegionTourismTrendParams): RegionTourismTrend | null {
  if (visitorCount <= 0 || previousVisitorCount <= 0) return null

  const visitorGrowth = visitorCount - previousVisitorCount

  return {
    location,
    visitorCount,
    previousVisitorCount,
    visitorGrowth,
    growthRate: visitorGrowth / previousVisitorCount,
    season,
    referenceYear,
  }
}

// 증가율만으로 정렬하면 규모가 작은 지역이 순위를 독식한다.
// 기준 계절 방문자 수 중앙값 미만인 지역을 걸러낸 뒤 증가율로 정렬한다.
export function sortByVisitorGrowth(trends: RegionTourismTrend[]) {
  if (trends.length <= 1) return [...trends]

  const visitorCountThreshold = getMedian(
    trends.map((trend) => trend.visitorCount),
  )

  return trends
    .filter((trend) => trend.visitorCount >= visitorCountThreshold)
    .toSorted((left, right) => right.growthRate - left.growthRate)
}

function getMedian(values: number[]) {
  const sorted = values.toSorted((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle]
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/features/tourism-trend/__tests__/tourismTrend.utils.test.ts`
Expected: PASS — 13 tests

- [ ] **Step 5: Commit**

```bash
git add src/features/tourism-trend/tourismTrend.utils.ts src/features/tourism-trend/__tests__/tourismTrend.utils.test.ts
git commit -m "feat(tourism-trend): 방문자 집계와 증가율 랭킹 로직 추가

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 4: API 어댑터

**Files:**
- Create: `src/features/tourism-trend/tourismTrend.api.ts`
- Test: `src/features/tourism-trend/__tests__/tourismTrend.api.test.ts`

**Interfaces:**
- Consumes: Task 1의 `SeasonValue`/`getSeasonDateRange`, Task 2의 `RegionLevel`/`TourismVisitorItem`
- Produces:
  - `tourismTrendKey` 쿼리 키 상수
  - `getSeasonVisitorItems({ level, season, year }): Promise<TourismVisitorItem[]>`
  - `toTourismVisitorItems(responseBody): TourismVisitorItem[]` (테스트를 위해 export)

**참고:** `marineActivity.api.ts`가 `items.item`의 배열/단일/누락 세 형태를 방어하는 패턴을 따른다. 성공 코드는 `"0000"`이다.

- [ ] **Step 1: Write the failing test**

`src/features/tourism-trend/__tests__/tourismTrend.api.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { toTourismVisitorItems } from '../tourismTrend.api'

describe('toTourismVisitorItems', () => {
  it('locgo 응답의 signguCode를 지역코드로 읽는다', () => {
    const result = toTourismVisitorItems({
      items: {
        item: [
          {
            signguCode: '51150',
            signguNm: '강릉시',
            daywkDivCd: '2',
            daywkDivNm: '화요일',
            touDivCd: '2',
            touDivNm: '외지인(b)',
            touNum: '353307.5',
            baseYmd: '20250701',
          },
        ],
      },
    })

    expect(result).toEqual([
      { regionCode: '51150', visitorDivision: '2', visitorCount: 353307.5 },
    ])
  })

  it('metco 응답의 areaCode를 지역코드로 읽는다', () => {
    const result = toTourismVisitorItems({
      items: {
        item: [
          {
            areaCode: '11',
            areaNm: '서울특별시',
            daywkDivCd: '2',
            touDivCd: '3',
            touNum: '24391.06',
            baseYmd: '20250701',
          },
        ],
      },
    })

    expect(result).toEqual([
      { regionCode: '11', visitorDivision: '3', visitorCount: 24391.06 },
    ])
  })

  it('item이 단일 객체여도 배열로 정규화한다', () => {
    const result = toTourismVisitorItems({
      items: {
        item: {
          signguCode: '51150',
          touDivCd: '2',
          touNum: '100',
          baseYmd: '20250701',
        },
      },
    })

    expect(result).toHaveLength(1)
    expect(result[0].regionCode).toBe('51150')
  })

  it('items가 없으면 빈 배열을 반환한다', () => {
    expect(toTourismVisitorItems({})).toEqual([])
  })

  it('touNum이 숫자로 변환되지 않는 레코드는 건너뛴다', () => {
    const result = toTourismVisitorItems({
      items: {
        item: [
          { signguCode: '51150', touDivCd: '2', touNum: '', baseYmd: '20250701' },
          { signguCode: '51830', touDivCd: '2', touNum: '70', baseYmd: '20250701' },
        ],
      },
    })

    expect(result).toEqual([
      { regionCode: '51830', visitorDivision: '2', visitorCount: 70 },
    ])
  })

  it('지역코드가 없는 레코드는 건너뛴다', () => {
    const result = toTourismVisitorItems({
      items: {
        item: [{ touDivCd: '2', touNum: '70', baseYmd: '20250701' }],
      },
    })

    expect(result).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/features/tourism-trend/__tests__/tourismTrend.api.test.ts`
Expected: FAIL — `Failed to resolve import "../tourismTrend.api"`

- [ ] **Step 3: Write minimal implementation**

`src/features/tourism-trend/tourismTrend.api.ts`:

```ts
import { governmentApi } from '~api/governmentApi'
import { getSeasonDateRange, type SeasonValue } from './season'
import {
  RegionLevel,
  type RegionLevelValue,
  type TourismVisitorItem,
} from './tourismTrend.types'

export const tourismTrendKey = 'tourism-trend'

const tourismTrendEndpoint: Record<RegionLevelValue, string> = {
  [RegionLevel.Metro]:
    '/B551011/DataLabService/metcoRegnVisitrDDList',
  [RegionLevel.Local]:
    '/B551011/DataLabService/locgoRegnVisitrDDList',
}

// 지역 필터 파라미터를 지원하지 않아 전 지역이 한 번에 내려온다.
// locgo 한 계절이 약 73,000건이므로 페이지네이션 대신 한 번에 받는다.
const tourismTrendPageSize = 100_000

// marine-activity는 "00"이지만 이 서비스는 "0000"이다.
const tourismTrendSuccessCode = '0000'

type TourismTrendRawItem = Record<string, unknown>

interface TourismTrendResponseBody {
  items?: {
    item?: TourismTrendRawItem | TourismTrendRawItem[]
  }
}

interface TourismTrendApiResponse {
  response: {
    header: { resultCode: string; resultMsg: string }
    body: TourismTrendResponseBody
  }
}

interface GetSeasonVisitorItemsParams {
  level: RegionLevelValue
  season: SeasonValue
  year: number
}

export async function getSeasonVisitorItems({
  level,
  season,
  year,
}: GetSeasonVisitorItemsParams): Promise<TourismVisitorItem[]> {
  const { startYmd, endYmd } = getSeasonDateRange(season, year)

  const { response } = await governmentApi.get<TourismTrendApiResponse>(
    tourismTrendEndpoint[level],
    {
      params: {
        MobileOS: 'ETC',
        MobileApp: 'TravelApp',
        _type: 'json',
        startYmd,
        endYmd,
        numOfRows: tourismTrendPageSize,
        pageNo: 1,
      },
    },
  )

  if (response.header.resultCode !== tourismTrendSuccessCode) {
    throw new Error(response.header.resultMsg)
  }

  return toTourismVisitorItems(response.body)
}

export function toTourismVisitorItems(
  responseBody: TourismTrendResponseBody,
): TourismVisitorItem[] {
  return toRawItems(responseBody).flatMap((rawItem) => {
    const regionCode = readString(rawItem, ['signguCode', 'areaCode'])
    const visitorDivision = readString(rawItem, ['touDivCd'])
    // Number('')는 0이라 유한하다. 빈 문자열을 먼저 걸러야 한다.
    const rawVisitorCount = readString(rawItem, ['touNum'])

    if (regionCode == null || visitorDivision == null) return []
    if (rawVisitorCount == null) return []

    const visitorCount = Number(rawVisitorCount)
    if (!Number.isFinite(visitorCount)) return []

    return [{ regionCode, visitorDivision, visitorCount }]
  })
}

function toRawItems(
  responseBody: TourismTrendResponseBody,
): TourismTrendRawItem[] {
  const item = responseBody.items?.item
  if (item == null) return []
  return Array.isArray(item) ? item : [item]
}

function readString(rawItem: TourismTrendRawItem, fieldNames: string[]) {
  const matched = fieldNames
    .map((fieldName) => rawItem[fieldName])
    .find((value) => typeof value === 'string' && value.length > 0)

  return typeof matched === 'string' ? matched : null
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/features/tourism-trend/__tests__/tourismTrend.api.test.ts`
Expected: PASS — 6 tests

- [ ] **Step 5: Commit**

```bash
git add src/features/tourism-trend/tourismTrend.api.ts src/features/tourism-trend/__tests__/tourismTrend.api.test.ts
git commit -m "feat(tourism-trend): 관광 통계 API 어댑터 추가

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 5: React Query 훅

**Files:**
- Create: `src/features/tourism-trend/useRegionTourismTrends.ts`

**Interfaces:**
- Consumes: Task 1~4 전부
- Produces: `useRegionTourismTrends(): { data: RegionTourismTrend[]; season: SeasonValue; referenceYear: number }`

**설계 노트:** 기준 계절은 항상 작년 같은 계절이다. 레벨 2종 × 계절 2개 = 4회 호출을 `Promise.all`로 병렬 처리한다. 계절 데이터는 사실상 정적이므로 `staleTime`을 24시간으로 잡는다. 기존 섹션들이 `useSuspenseQuery`를 쓰므로 동일하게 맞춘다.

- [ ] **Step 1: Write the implementation**

`src/features/tourism-trend/useRegionTourismTrends.ts`:

```ts
import { useSuspenseQuery } from '@tanstack/react-query'
import { getSeasonOf, getSeasonYearOf, type SeasonValue } from './season'
import { getSeasonVisitorItems, tourismTrendKey } from './tourismTrend.api'
import { getTourismTrendRegions } from './tourismTrendRegions'
import { RegionLevel, type RegionTourismTrend } from './tourismTrend.types'
import {
  sortByVisitorGrowth,
  sumVisitorsByRegionCode,
  toRegionTourismTrend,
} from './tourismTrend.utils'

const oneDayInMs = 24 * 60 * 60 * 1000

export function useRegionTourismTrends() {
  const now = new Date()
  const season = getSeasonOf(now)
  // 올해 계절은 아직 진행 중이거나 데이터가 미완성이므로 작년을 기준으로 삼는다.
  const referenceYear = getSeasonYearOf(now) - 1

  const { data } = useSuspenseQuery({
    queryKey: [tourismTrendKey, 'region-trends', season, referenceYear],
    queryFn: () => fetchRegionTourismTrends(season, referenceYear),
    staleTime: oneDayInMs,
    gcTime: oneDayInMs,
  })

  return { data, season, referenceYear }
}

async function fetchRegionTourismTrends(
  season: SeasonValue,
  referenceYear: number,
): Promise<RegionTourismTrend[]> {
  const levels = [RegionLevel.Metro, RegionLevel.Local]

  const visitorCountsByLevel = await Promise.all(
    levels.map(async (level) => {
      const [currentItems, previousItems] = await Promise.all([
        getSeasonVisitorItems({ level, season, year: referenceYear }),
        getSeasonVisitorItems({ level, season, year: referenceYear - 1 }),
      ])

      return {
        level,
        current: sumVisitorsByRegionCode(currentItems),
        previous: sumVisitorsByRegionCode(previousItems),
      }
    }),
  )

  const trends = visitorCountsByLevel.flatMap(({ level, current, previous }) =>
    getTourismTrendRegions(level).flatMap(({ location, regionCode }) => {
      const trend = toRegionTourismTrend({
        location,
        visitorCount: current.get(regionCode) ?? 0,
        previousVisitorCount: previous.get(regionCode) ?? 0,
        season,
        referenceYear,
      })

      return trend ? [trend] : []
    }),
  )

  return sortByVisitorGrowth(trends)
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `pnpm build`
Expected: 빌드 성공. 타입 에러가 없어야 한다.

- [ ] **Step 3: Commit**

```bash
git add src/features/tourism-trend/useRegionTourismTrends.ts
git commit -m "feat(tourism-trend): 지역 관광 추이 조회 훅 추가

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 6: 한국어 숫자 포맷

**Files:**
- Modify: `src/shared/utils/formats.ts`
- Test: `src/shared/utils/__tests__/formats.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces: `formatKoreanCount(value: number): string`

- [ ] **Step 1: Write the failing test**

`src/shared/utils/__tests__/formats.test.ts` — 신규 파일이다(디렉토리는 이미 있고 `urls.test.ts`만 들어있다).

```ts
import { describe, expect, it } from 'vitest'
import { formatKoreanCount } from '../formats'

describe('formatKoreanCount', () => {
  it('만 이상은 만 단위로 축약한다', () => {
    expect(formatKoreanCount(240_000)).toBe('24만')
    expect(formatKoreanCount(1_040_000)).toBe('104만')
  })

  it('만 미만은 천 단위 구분자를 쓴다', () => {
    expect(formatKoreanCount(8_500)).toBe('8,500')
    expect(formatKoreanCount(999)).toBe('999')
  })

  it('만 단위 소수점은 반올림해 버린다', () => {
    expect(formatKoreanCount(245_000)).toBe('25만')
    expect(formatKoreanCount(10_400)).toBe('1만')
  })

  it('0은 0으로 표시한다', () => {
    expect(formatKoreanCount(0)).toBe('0')
  })

  it('음수도 부호를 유지한다', () => {
    expect(formatKoreanCount(-240_000)).toBe('-24만')
    expect(formatKoreanCount(-500)).toBe('-500')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/shared/utils/__tests__/formats.test.ts`
Expected: FAIL — `formatKoreanCount is not a function`

- [ ] **Step 3: Write minimal implementation**

`src/shared/utils/formats.ts` 끝에 추가한다:

```ts
const TEN_THOUSAND = 10_000

// 방문자 수처럼 큰 수를 "104만" 형태로 축약한다. 만 미만은 원본을 유지한다.
export function formatKoreanCount(value: number): string {
  const magnitude = Math.abs(value)
  const sign = value < 0 ? '-' : ''

  if (magnitude < TEN_THOUSAND) {
    return `${sign}${magnitude.toLocaleString('ko-KR')}`
  }

  return `${sign}${Math.round(magnitude / TEN_THOUSAND).toLocaleString('ko-KR')}만`
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/shared/utils/__tests__/formats.test.ts`
Expected: PASS — 5 tests

- [ ] **Step 5: Commit**

```bash
git add src/shared/utils/formats.ts src/shared/utils/__tests__/formats.test.ts
git commit -m "feat(shared): 만 단위 한국어 숫자 포맷 유틸 추가

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 7: 지역 카드 컴포넌트

**Files:**
- Create: `src/features/explorer/explorer-seasonal-regions/RegionTrendCard.tsx`

**Interfaces:**
- Consumes: Task 2의 `RegionTourismTrend`, Task 6의 `formatKoreanCount`, `LocationRegion` (`~features/location/location.model`)
- Produces: `RegionTrendCard({ trend, rank }: { trend: RegionTourismTrend; rank: number })`

**설계 노트:** 순수 표현 컴포넌트다. 순위는 카드가 계산하지 않고 소비자가 넘긴다. 데이터를 스스로 조회하지 않는다.

- [ ] **Step 1: Write the component**

`src/features/explorer/explorer-seasonal-regions/RegionTrendCard.tsx`:

```tsx
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp'
import { Box, Stack, Typography } from '@mui/material'
import { LocationRegion } from '~features/location/location.model'
import type { RegionTourismTrend } from '~features/tourism-trend/tourismTrend.types'
import { formatKoreanCount } from '~shared/utils/formats'

interface RegionTrendCardProps {
  trend: RegionTourismTrend
  rank: number
}

export function RegionTrendCard({ trend, rank }: RegionTrendCardProps) {
  const isRising = trend.visitorGrowth >= 0
  const growthColor = isRising ? 'success.main' : 'text.secondary'
  const GrowthIcon = isRising ? ArrowDropUpIcon : ArrowDropDownIcon
  const growthPercent = Math.round(Math.abs(trend.growthRate) * 100)

  return (
    <Stack
      gap={0.5}
      p={2}
      height="100%"
      borderRadius={3}
      border={1}
      borderColor="divider"
      sx={{ bgcolor: 'background.paper' }}
    >
      <Typography variant="caption" color="text.secondary" fontWeight={700}>
        {rank}
      </Typography>

      <Box>
        <Typography variant="subtitle1" fontWeight={600} noWrap>
          {trend.location}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {LocationRegion[trend.location]}
        </Typography>
      </Box>

      <Box mt={0.5}>
        <Typography variant="body2" color="text.secondary" noWrap>
          {formatKoreanCount(trend.visitorCount)}명 방문
        </Typography>
        <Stack direction="row" alignItems="center" color={growthColor}>
          <GrowthIcon sx={{ fontSize: 18 }} />
          <Typography variant="body2" fontWeight={600} noWrap>
            {formatKoreanCount(Math.abs(trend.visitorGrowth))} ({growthPercent}%)
          </Typography>
        </Stack>
      </Box>
    </Stack>
  )
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `pnpm build`
Expected: 빌드 성공

- [ ] **Step 3: Commit**

```bash
git add src/features/explorer/explorer-seasonal-regions/RegionTrendCard.tsx
git commit -m "feat(explorer): 지역 관광 추이 카드 컴포넌트 추가

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 8: 큐레이션 섹션

**Files:**
- Create: `src/features/explorer/explorer-seasonal-regions/SeasonalRegionsSummarySection.tsx`

**Interfaces:**
- Consumes: Task 1의 `SeasonLabel`, Task 5의 `useRegionTourismTrends`, Task 7의 `RegionTrendCard`, `useExplorerFilterParams`, `Scrollable`, `useIsMobile`
- Produces: `SeasonalRegionsSummarySection` + `SeasonalRegionsSummarySection.Skeleton`

**설계 노트:** `RecentHotSummarySection`의 레이아웃 관습(가로 스크롤, 카드 폭, 스켈레톤 구조)을 따른다. 더보기 링크는 없다(전용 페이지를 만들지 않음). 카드를 누르면 해당 지역으로 탐색 필터를 적용한다.

- [ ] **Step 1: Write the component**

`src/features/explorer/explorer-seasonal-regions/SeasonalRegionsSummarySection.tsx`:

```tsx
import { Box, ButtonBase, Skeleton, Stack, Typography } from '@mui/material'
import { useMemo } from 'react'
import { SeasonLabel } from '~features/tourism-trend/season'
import { useRegionTourismTrends } from '~features/tourism-trend/useRegionTourismTrends'
import { Scrollable } from '~shared/components/Scrollable'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { useExplorerFilterParams } from '../explorer-filters/useExplorerFilterParams'
import { RegionTrendCard } from './RegionTrendCard'

const SECTION_LIMIT = 10

export function SeasonalRegionsSummarySection() {
  const { data: trends, season, referenceYear } = useRegionTourismTrends()
  const topTrends = useMemo(() => trends.slice(0, SECTION_LIMIT), [trends])

  const isMobile = useIsMobile()
  const { setLocation } = useExplorerFilterParams()

  return (
    <Box mb={3}>
      <Stack
        direction="row"
        alignItems="baseline"
        justifyContent="space-between"
        px={2}
        mb={1.5}
        gap={1}
      >
        <Typography variant="subtitle1">
          {SeasonLabel[season]}에 사람들이 몰리는 지역
        </Typography>
        <Typography variant="caption" color="text.secondary" flexShrink={0}>
          {referenceYear}년 {SeasonLabel[season]} 기준
        </Typography>
      </Stack>

      {topTrends.length === 0 ? (
        <Typography
          variant="body2"
          color="text.secondary"
          px={2}
          py={4}
          textAlign="center"
        >
          자료를 찾을 수 없어요
        </Typography>
      ) : (
        <Scrollable.Horizontal
          width="100%"
          gap={isMobile ? 1 : 2}
          px={2}
          pb={0.5}
          sx={{ '&::-webkit-scrollbar': { display: 'none' } }}
          restorable={`seasonal-regions-section:${season}:${referenceYear}`}
        >
          {topTrends.map((trend, index) => (
            <ButtonBase
              key={trend.location}
              onClick={() => setLocation(trend.location)}
              sx={{
                width: isMobile ? 150 : 200,
                flexShrink: 0,
                textAlign: 'left',
                borderRadius: 3,
                display: 'block',
              }}
            >
              <RegionTrendCard trend={trend} rank={index + 1} />
            </ButtonBase>
          ))}
        </Scrollable.Horizontal>
      )}
    </Box>
  )
}
SeasonalRegionsSummarySection.Skeleton = SeasonalRegionsSectionSkeleton

function SeasonalRegionsSectionSkeleton() {
  const isMobile = useIsMobile()

  return (
    <Box mb={3}>
      <Skeleton variant="text" width={200} height={28} sx={{ mx: 2, mb: 1.5 }} />
      <Stack direction="row" gap={isMobile ? 1 : 2} px={2}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Box
            key={index}
            sx={{
              width: isMobile ? 150 : 200,
              flexShrink: 0,
              borderRadius: 3,
              border: 1,
              borderColor: 'divider',
              p: 2,
            }}
          >
            <Skeleton variant="text" width={16} height={16} />
            <Skeleton variant="text" width="70%" height={24} />
            <Skeleton variant="text" width="50%" height={16} />
            <Skeleton variant="text" width="80%" height={20} sx={{ mt: 1 }} />
          </Box>
        ))}
      </Stack>
    </Box>
  )
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `pnpm build`
Expected: 빌드 성공

참고: `Scrollable.Horizontal`은 `restorable?: boolean | string`과 MUI `StackProps`를 받는다(검증 완료). 위 코드의 props는 실제 시그니처와 일치한다.

- [ ] **Step 3: Commit**

```bash
git add src/features/explorer/explorer-seasonal-regions/SeasonalRegionsSummarySection.tsx
git commit -m "feat(explorer): 계절 인기 지역 큐레이션 섹션 추가

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 9: 탐색 탭 연결

**Files:**
- Modify: `src/features/explorer/ExplorerCatalog.tsx`

**Interfaces:**
- Consumes: Task 8의 `SeasonalRegionsSummarySection`
- Produces: 없음 (최종 연결)

- [ ] **Step 1: Add the section to the catalog**

`src/features/explorer/ExplorerCatalog.tsx` 전체를 아래로 교체한다. 신규 섹션이 최상단이다 — 나머지 세 섹션은 장소 단위인데 이것만 지역 단위이므로, 넓은 단위에서 좁은 단위로 내려가는 순서가 자연스럽다.

```tsx
import { Stack } from '@mui/material'
import { Suspense } from 'react'
import { TopVisitedSummarySection } from './explorer-ranking/TopVisitedSummarySection'
import { RecentHotSummarySection } from './explorer-recent/RecentHotSummarySection'
import { MostSavedSummarySection } from './explorer-saved/MostSavedSummarySection'
import { SeasonalRegionsSummarySection } from './explorer-seasonal-regions/SeasonalRegionsSummarySection'

export function ExplorerCatalog() {
  return (
    <Stack gap={3} py={2}>
      <Suspense fallback={<SeasonalRegionsSummarySection.Skeleton />}>
        <SeasonalRegionsSummarySection />
      </Suspense>
      <Suspense fallback={<RecentHotSummarySection.Skeleton />}>
        <RecentHotSummarySection />
      </Suspense>
      <Suspense fallback={<MostSavedSummarySection.Skeleton />}>
        <MostSavedSummarySection />
      </Suspense>
      <Suspense fallback={<TopVisitedSummarySection.Skeleton />}>
        <TopVisitedSummarySection />
      </Suspense>
    </Stack>
  )
}
```

- [ ] **Step 2: Run the full test suite**

Run: `pnpm test`
Expected: 전체 PASS. 기존 테스트가 깨지지 않아야 한다.

- [ ] **Step 3: Run the build**

Run: `pnpm build`
Expected: 빌드 성공

- [ ] **Step 4: Verify in the running app**

Run: `pnpm dev`

브라우저에서 `/explorer`로 이동해 아래를 확인한다:

1. 최상단에 "여름에 사람들이 몰리는 지역" 섹션이 보인다 (실행 시점 계절에 따라 라벨이 달라진다)
2. 제목 오른쪽에 "2025년 여름 기준" 같은 기준 연도가 있다
3. 카드에 지역명·상위 지역·방문자 수·증감이 표시된다
4. 카드를 누르면 해당 지역으로 필터가 적용되고 URL에 `?location=강릉` 형태로 반영된다
5. 로딩 중 스켈레톤이 보인다

네트워크 탭에서 `locgoRegnVisitrDDList` 응답이 `content-encoding: gzip`으로 내려오는지 확인한다. 압축 없이는 12MB가 넘어 로딩이 매우 느려진다.

- [ ] **Step 5: Commit**

```bash
git add src/features/explorer/ExplorerCatalog.tsx
git commit -m "feat(explorer): 탐색 탭에 계절 인기 지역 섹션 연결

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 10: 코드베이스 문서 갱신

**Files:**
- Modify: `docs/codebase.md`

**Interfaces:**
- Consumes: 없음
- Produces: 없음

프로젝트 규칙상 작업 완료 후 `docs/codebase.md`를 갱신한다.

- [ ] **Step 1: Update the directory tree**

`docs/codebase.md`의 디렉토리 구조에서 `marine-activity/` 블록 다음에 아래를 추가한다:

```
│   ├── tourism-trend/          # 공공 관광 통계 (계절별 지역 방문 추이)
│   │   ├── tourismTrend.api.ts        # 한국관광공사 관광빅데이터 어댑터
│   │   ├── tourismTrend.types.ts      # 도메인 모델/지역 레벨/방문자 구분
│   │   ├── tourismTrend.utils.ts      # 집계·중앙값 게이트·증가율 정렬
│   │   ├── tourismTrendRegions.ts     # Location → 지자체 코드 카탈로그
│   │   ├── season.ts                  # 계절 판정/날짜 범위
│   │   └── useRegionTourismTrends.ts
```

`explorer/` 블록의 `explorer-saved/` 다음 줄에 아래를 추가한다:

```
│   │   ├── explorer-seasonal-regions/ # 계절 인기 지역 큐레이션
```

- [ ] **Step 2: Update the feature guide table**

`기능별 탐색 가이드` 표에서 `장소 탐색 (Explorer)` 행 다음에 아래를 추가한다:

```
| 계절 인기 지역       | `features/tourism-trend/`, `features/explorer/explorer-seasonal-regions/` |
```

- [ ] **Step 3: Commit**

```bash
git add docs/codebase.md
git commit -m "docs: 계절 인기 지역 큐레이션 코드베이스 문서 갱신

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Self-Review 결과

**Spec coverage:** 스펙의 모든 섹션이 태스크로 매핑됐다.

| 스펙 섹션 | 태스크 |
| --- | --- |
| 계절 모델 (겨울 연도 귀속 포함) | Task 1 |
| 엔드포인트 2종 / 레벨 분리 | Task 2, 4 |
| `touDivCd` 현지인 제외 | Task 3 |
| `touNum` 문자열 파싱 | Task 4 |
| 성공 코드 `"0000"` | Task 4 |
| 전 지역 일괄 조회 (지역 필터 없음) | Task 4, 5 |
| 기준=작년 계절 / 비교=재작년 | Task 5 |
| 중앙값 게이트 + 증가율 정렬 | Task 3 |
| 절대값 주 + % 보조 표시 | Task 7 |
| `formatKoreanCount` | Task 6 |
| 계절별 카피 + 기준 연도 노출 | Task 8 |
| 탭 → 탐색 필터 적용 | Task 8 |
| 최상단 배치 | Task 9 |
| 빈 상태 / 스켈레톤 | Task 8 |
| gzip 확인 | Task 9 Step 4 |
| codebase.md 갱신 | Task 10 |

**의도적으로 제외한 것:** 더보기 전용 페이지 (스펙에서 "만들지 않는다"로 명시).

**Type consistency:** `RegionTourismTrend`의 필드명(`visitorCount`, `previousVisitorCount`, `visitorGrowth`, `growthRate`, `season`, `referenceYear`)이 Task 2 정의부터 Task 7 사용까지 일치한다. `sumVisitorsByRegionCode`, `toRegionTourismTrend`, `sortByVisitorGrowth`, `getSeasonVisitorItems`, `getTourismTrendRegions`, `formatKoreanCount` 모두 정의 태스크와 사용 태스크의 시그니처가 같다.

**구현 전 검증한 외부 의존:**
- `Scrollable.Horizontal` — `restorable?: boolean | string` + `StackProps`. Task 8 코드와 일치.
- `ValueOf` — `~shared/utils/types`에 존재. Task 1·2에서 사용.
- `src/shared/utils/__tests__/` — 존재하며 `urls.test.ts`만 있다. Task 6이 `formats.test.ts`를 신규 생성.
- 지자체 코드 30개 — 2026-08-13 실제 API 응답에서 추출. 포항(`47110`)·전주(`52110`)는 구 단위 코드가 별도 존재하므로 시 단위를 사용한다.
- `governmentApi`의 `queryParams.serialize` — 서비스 키를 `String(value)`로 그대로 붙여 재인코딩하지 않는다. 수정 없이 사용 가능.
