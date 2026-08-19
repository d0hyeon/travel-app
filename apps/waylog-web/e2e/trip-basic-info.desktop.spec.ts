import { test, expect, type Page } from '@playwright/test'
import { MOCK_TRIP_ID } from '~features/trip/trip.mock'

// ────────────────────────────────────────────────────────────
// 데스크탑 기본정보 탭은 모바일과 UI 모델이 다르다.
//   - 서브탭(기본정보/체크리스트/메모)이 없고, 카드로 나란히 배치된다.
//   - 메모는 클릭 시 별도 페이지가 아니라 다이얼로그로 열린다.
//   - 채팅은 헤더 버튼이 아니라 우하단 ChatFab으로 진입한다.
// 따라서 모바일 스펙(trip-basic-info.mobile.spec.ts)과 별도로 데스크탑 흐름을 검증한다.
//
// MSW가 모든 Supabase 요청을 가로챈다. mock 여행: 도쿄 여행(과거), 멤버 1명,
// 메모 2개(숙소 체크인 정보=pinned, 라멘 맛집), 체크리스트 2개(여권/환전).
// ────────────────────────────────────────────────────────────

const TRIP_URL = `/trip/${MOCK_TRIP_ID}`

async function waitForAppLoad(page: Page) {
  // 데스크탑 헤더는 여행 이름을 EditableText로 렌더한다(버튼 role 아님).
  await expect(page.getByText('도쿄 여행')).toBeVisible()
}

test.describe('TripBasicInfoContent — 기본정보 탭 (데스크탑)', () => {

  test('기본 진입 시 여행 이름이 헤더에 보인다', async ({ page }) => {
    await page.goto(TRIP_URL)

    await waitForAppLoad(page)
  })

  test('과거 여행이므로 D-Day 카드에 "지난 여행이에요"가 표시된다', async ({ page }) => {
    await page.goto(TRIP_URL)
    await waitForAppLoad(page)

    await expect(page.getByText('지난 여행이에요')).toBeVisible()
  })

  test('여행 정보 카드에 목적지와 여행 기간이 표시된다', async ({ page }) => {
    await page.goto(TRIP_URL)
    await waitForAppLoad(page)

    await expect(page.getByText('목적지').first()).toBeVisible()
    await expect(page.getByText('도쿄', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('여행 기간').first()).toBeVisible()
  })

  test('과거 여행이므로 회고 포스트 작성 카드가 표시된다', async ({ page }) => {
    await page.goto(TRIP_URL)
    await waitForAppLoad(page)

    await expect(page.getByText('여행을 회고하는 포스트 만들기')).toBeVisible()
  })

  test('참여 인원 섹션에 멤버 1명이 표시된다', async ({ page }) => {
    await page.goto(TRIP_URL)
    await waitForAppLoad(page)

    await expect(page.getByText('참여 인원 (1명)')).toBeVisible()
    await expect(page.getByText('테스트 유저')).toBeVisible()
  })

  // ──────────────────────────────────────────────────────────
  // [메모 카드] 서브탭 없이 항상 보이고, 클릭 시 다이얼로그로 열린다
  // ──────────────────────────────────────────────────────────

  test('메모 카드에 mock 메모 목록이 표시된다', async ({ page }) => {
    await page.goto(TRIP_URL)
    await waitForAppLoad(page)

    await expect(page.getByText('숙소 체크인 정보')).toBeVisible()
    await expect(page.getByText('도쿄 역 근처 라멘 맛집 찾아보기')).toBeVisible()
  })

  test('메모 항목을 클릭하면 메모 다이얼로그가 열린다', async ({ page }) => {
    await page.goto(TRIP_URL)
    await waitForAppLoad(page)

    await page.getByText('숙소 체크인 정보').click()

    // preview 텍스트가 목록 카드에도 있으므로 다이얼로그 범위로 좁힌다
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('체크인 시간 15:00, 체크아웃 11:00')).toBeVisible()
  })

  test('메모 다이얼로그에서 닫기 버튼을 누르면 다이얼로그가 닫힌다', async ({ page }) => {
    await page.goto(TRIP_URL)
    await waitForAppLoad(page)
    await page.getByText('숙소 체크인 정보').click()
    await expect(page.getByRole('dialog')).toBeVisible()

    await page.getByRole('button', { name: '닫기' }).click()

    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  // ──────────────────────────────────────────────────────────
  // [체크리스트 카드] 우측 카드에 항상 보인다
  // ──────────────────────────────────────────────────────────

  test('체크리스트 카드에 mock 항목들이 표시된다', async ({ page }) => {
    await page.goto(TRIP_URL)
    await waitForAppLoad(page)

    await expect(page.getByText('여권 챙기기')).toBeVisible()
    await expect(page.getByText('환전하기')).toBeVisible()
  })

  test('체크되지 않은 항목을 체크하면 완료 처리된다', async ({ page }) => {
    await page.goto(TRIP_URL)
    await waitForAppLoad(page)
    await expect(page.getByText('여권 챙기기')).toBeVisible()

    const checkbox = page.getByRole('checkbox').first()
    await checkbox.click()

    await expect(checkbox).toBeChecked()
  })

  // ──────────────────────────────────────────────────────────
  // [커뮤니티] 이 여행지를 다녀온 사람들
  // ──────────────────────────────────────────────────────────

  test('이 여행지를 다녀온 사람들 섹션이 표시된다', async ({ page }) => {
    await page.goto(TRIP_URL)
    await waitForAppLoad(page)

    await expect(page.getByText('이 여행지를 다녀온 사람들')).toBeVisible()
  })

  // ──────────────────────────────────────────────────────────
  // [채팅] 우하단 ChatFab으로 진입
  // ──────────────────────────────────────────────────────────

  test('ChatFab 클릭 시 채팅 오버레이가 열린다', async ({ page }) => {
    await page.goto(TRIP_URL)
    await waitForAppLoad(page)

    // ChatFab은 aria-label이 없는 플로팅 버튼 → ChatIcon을 가진 버튼으로 특정
    await page.locator('button').filter({ has: page.locator('[data-testid="ChatIcon"]') }).click()

    await expect(page.getByText('안녕하세요!')).toBeVisible()
    await expect(page.getByText('반가워요 :)')).toBeVisible()
  })
})
