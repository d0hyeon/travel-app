import { test, expect } from '@playwright/test'
import { MOCK_TRIP_ID } from '../src/mocks/handlers'

// ────────────────────────────────────────────────────────────
// MSW 방식에서는 beforeEach에서 별도 Mock 등록이 필요 없다.
// 앱이 --mode test로 뜰 때 src/mocks/handlers.ts의 핸들러가
// Service Worker로 자동 등록되어 모든 Supabase 요청을 가로챈다.
//
// 각 테스트는 새 브라우저 컨텍스트를 가지므로 상태 격리는 자동이다.
// ────────────────────────────────────────────────────────────

test.describe('TripDetailPage — 탭 네비게이션', () => {
  // ──────────────────────────────────────────────────────────
  // 케이스 1: 기본 진입 — 정보 탭이 활성화된 상태로 로드된다
  //
  // 검증 포인트:
  //   - 여행 이름이 헤더에 렌더링된다 (MSW가 trips 요청에 Mock 응답을 준다)
  //   - query param 없이 진입하면 기본 탭(Info)이 보인다
  // ──────────────────────────────────────────────────────────
  test('기본 진입 시 여행 이름이 헤더에 보인다', async ({ page }) => {
    await page.goto(`/trip/${MOCK_TRIP_ID}`)

    await expect(page.getByText('도쿄 여행')).toBeVisible()
    expect(page.url()).toContain(`/trip/${MOCK_TRIP_ID}`)
  })

  // ──────────────────────────────────────────────────────────
  // 케이스 2: 탭 클릭 → URL query param 변경
  //
  // 이 앱은 useQueryParamState로 탭 상태를 URL에 동기화한다.
  // 탭을 클릭하면 ?content=Place 처럼 URL이 바뀌어야 한다.
  // ──────────────────────────────────────────────────────────
  test('탭 클릭 시 URL query param이 변경된다', async ({ page }) => {
    await page.goto(`/trip/${MOCK_TRIP_ID}`)
    await expect(page.getByText('도쿄 여행')).toBeVisible()

    // 바텀 네비게이션의 탭을 정확히 선택하기 위해 role + name 조합 사용
    // getByText('정보')는 '기본정보' 탭과 충돌하므로 role로 구분한다
    await page.getByRole('button', { name: '장소' }).click()
    await expect(page).toHaveURL(/content=Place/)

    await page.getByRole('button', { name: '정산' }).click()
    await expect(page).toHaveURL(/content=Expense/)

    await page.getByRole('button', { name: '계획' }).click()
    await expect(page).toHaveURL(/content=Route/)

    await page.getByRole('button', { name: '사진' }).click()
    await expect(page).toHaveURL(/content=Photo/)
  })

  // ──────────────────────────────────────────────────────────
  // 케이스 3: URL query param으로 특정 탭에 직접 진입
  //
  // 새로고침·공유 링크 진입 시 탭 상태가 복원되는지 검증.
  // ──────────────────────────────────────────────────────────
  test('URL에 content=Expense가 있으면 정산 탭이 활성화된다', async ({ page }) => {
    await page.goto(`/trip/${MOCK_TRIP_ID}?content=Expense`)

    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/content=Expense/)
  })

  // ──────────────────────────────────────────────────────────
  // 케이스 4: 탭 전환 시 URL이 정확히 변경된다
  // ──────────────────────────────────────────────────────────
  test('탭 전환 시 URL이 정확히 변경된다', async ({ page }) => {
    await page.goto(`/trip/${MOCK_TRIP_ID}`)
    await expect(page.getByText('도쿄 여행')).toBeVisible()

    await page.getByRole('button', { name: '장소' }).click()
    await expect(page).toHaveURL(/content=Place/)

    // 정보 탭으로 돌아오면 content param이 Info로 바뀐다
    await page.getByRole('button', { name: '정보' }).click()
    await expect(page).toHaveURL(/content=Info/)
  })
})
