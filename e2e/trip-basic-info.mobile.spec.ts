import { test, expect, type Page } from '@playwright/test'
import { MOCK_TRIP_ID } from '~features/trip/trip.mock'

// ────────────────────────────────────────────────────────────
// MSW가 모든 Supabase 요청을 가로채므로 별도 Mock 등록 불필요.
// mock 여행: 도쿄 여행, 2025-07-01 ~ 2025-07-07 (과거 여행)
// mock 체크리스트: 여권 챙기기(미완료), 환전하기(완료)
// mock 메모: 숙소 체크인 정보 (pinned), 도쿄 역 근처 라멘 맛집 찾아보기
// mock 커뮤니티: 도쿄 여행한 다른 유저 1명
// ────────────────────────────────────────────────────────────

const TRIP_URL = `/trip/${MOCK_TRIP_ID}`
const INFO_URL = `${TRIP_URL}?content=Info`

async function waitForAppLoad(page: Page) {
  // [CI-DEBUG] 앱 로드 실패 시 페이지 상태를 CI 로그에 출력
  page.on('console', (m) => console.log(`[browser:${m.type()}] ${m.text()}`))
  page.on('pageerror', (e) => console.log(`[pageerror] ${e.message}`))
  page.on('requestfailed', (r) => console.log(`[reqfail] ${r.url()} :: ${r.failure()?.errorText}`))
  try {
    // 헤더의 여행 이름 버튼이 렌더되면 앱과 인증이 모두 준비된 상태
    await expect(page.getByRole('button', { name: '도쿄 여행' })).toBeVisible()
  } catch (e) {
    console.log('[CI-DEBUG] url =', page.url())
    console.log('[CI-DEBUG] body =', (await page.locator('body').innerText().catch(() => '<none>')).slice(0, 800))
    throw e
  }
}

test.describe('TripBasicInfoContent — 기본정보탭 (모바일)', () => {

  // ──────────────────────────────────────────────────────────
  // [기본정보 서브탭] 진입 및 구조 검증
  // ──────────────────────────────────────────────────────────

  test('기본정보 서브탭이 기본으로 활성화된다', async ({ page }) => {
    await page.goto(TRIP_URL)
    await waitForAppLoad(page)

    await expect(page.getByRole('tab', { name: '기본정보' })).toBeVisible()
    await expect(page.getByRole('tab', { name: '체크리스트' })).toBeVisible()
    await expect(page.getByRole('tab', { name: '메모' })).toBeVisible()
    await expect(page.getByRole('tab', { name: '기본정보' })).toHaveAttribute('aria-selected', 'true')
  })

  test('과거 여행이므로 D-Day 카드에 "지난 여행이에요"가 표시된다', async ({ page }) => {
    await page.goto(TRIP_URL)
    await waitForAppLoad(page)

    await expect(page.getByText('지난 여행이에요')).toBeVisible()
  })

  test('여행 기본 정보에 목적지와 여행 기간이 표시된다', async ({ page }) => {
    await page.goto(TRIP_URL)
    await waitForAppLoad(page)

    await expect(page.getByText('목적지')).toBeVisible()
    await expect(page.getByText('도쿄', { exact: true })).toBeVisible()
    await expect(page.getByText('여행 기간')).toBeVisible()
    await expect(page.getByText(/7\/1/)).toBeVisible()
    await expect(page.getByText(/7\/7/)).toBeVisible()
  })

  test('과거 여행이므로 회고 포스트 작성 카드가 표시된다', async ({ page }) => {
    await page.goto(TRIP_URL)
    await waitForAppLoad(page)

    await expect(page.getByText('여행을 회고하는 포스트 만들기')).toBeVisible()
  })

  test('인원 섹션에 멤버 1명이 표시된다', async ({ page }) => {
    await page.goto(TRIP_URL)
    await waitForAppLoad(page)

    await expect(page.getByText('인원 (1명)')).toBeVisible()
    await expect(page.getByText('테스트 유저')).toBeVisible()
  })

  test('"여행에서 나가기" 버튼이 표시된다', async ({ page }) => {
    await page.goto(TRIP_URL)
    await waitForAppLoad(page)

    await expect(page.getByRole('button', { name: '여행에서 나가기' })).toBeVisible()
  })

  // ──────────────────────────────────────────────────────────
  // [서브탭 전환] URL query param 연동
  // ──────────────────────────────────────────────────────────

  test('체크리스트 서브탭을 클릭하면 체크리스트 목록이 표시된다', async ({ page }) => {
    await page.goto(TRIP_URL)
    await waitForAppLoad(page)

    await page.getByRole('tab', { name: '체크리스트' }).click()

    await expect(page.getByRole('tab', { name: '체크리스트' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByText('여권 챙기기')).toBeVisible()
    await expect(page.getByText('환전하기')).toBeVisible()
  })

  test('메모 서브탭을 클릭하면 메모 목록이 표시된다', async ({ page }) => {
    await page.goto(TRIP_URL)
    await waitForAppLoad(page)

    await page.getByRole('tab', { name: '메모' }).click()

    await expect(page.getByRole('tab', { name: '메모' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByText('숙소 체크인 정보')).toBeVisible()
  })

  test('새로고침 후 체크리스트 탭이 유지된다', async ({ page }) => {
    await page.goto(`${INFO_URL}&info-tab=checklist`)
    await waitForAppLoad(page)

    await expect(page.getByRole('tab', { name: '체크리스트' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByText('여권 챙기기')).toBeVisible()
  })

  test('새로고침 후 메모 탭이 유지된다', async ({ page }) => {
    await page.goto(`${INFO_URL}&info-tab=memo`)
    await waitForAppLoad(page)

    await expect(page.getByRole('tab', { name: '메모' })).toHaveAttribute('aria-selected', 'true')
  })

  // ──────────────────────────────────────────────────────────
  // [메모 서브탭] 목록 표시 및 상세 진입
  // ──────────────────────────────────────────────────────────

  test('메모 탭에 mock 메모 목록이 표시된다', async ({ page }) => {
    await page.goto(`${INFO_URL}&info-tab=memo`)
    await waitForAppLoad(page)

    await expect(page.getByText('숙소 체크인 정보')).toBeVisible()
    await expect(page.getByText('도쿄 역 근처 라멘 맛집 찾아보기')).toBeVisible()
  })

  test('메모 항목 클릭 시 메모 상세 페이지로 이동한다', async ({ page }) => {
    await page.goto(`${INFO_URL}&info-tab=memo`)
    await waitForAppLoad(page)

    await page.getByText('숙소 체크인 정보').click()

    await expect(page).toHaveURL(/\/trip\/.+\/memo\/memo-001/)
    await expect(page.getByText('체크인 시간 15:00, 체크아웃 11:00')).toBeVisible()
  })

  test('메모 상세에서 뒤로가기 시 메모 탭으로 돌아온다', async ({ page }) => {
    await page.goto(`${INFO_URL}&info-tab=memo`)
    await waitForAppLoad(page)
    await page.getByText('숙소 체크인 정보').click()
    await expect(page).toHaveURL(/\/trip\/.+\/memo\/memo-001/)

    await page.goBack()

    await expect(page).toHaveURL(/info-tab=memo/)
    await expect(page.getByText('숙소 체크인 정보')).toBeVisible()
  })

  test('핀된 메모에는 핀 아이콘이 표시된다', async ({ page }) => {
    await page.goto(`${INFO_URL}&info-tab=memo`)
    await waitForAppLoad(page)

    const pinnedMemoRow = page.locator('a').filter({ hasText: '숙소 체크인 정보' })
    await expect(pinnedMemoRow).toBeVisible()
    await expect(pinnedMemoRow.locator('svg').first()).toBeVisible()
  })

  test('메모 탭에 새 메모 추가 버튼이 표시된다', async ({ page }) => {
    await page.goto(`${INFO_URL}&info-tab=memo`)
    await waitForAppLoad(page)

    await expect(page.getByRole('button', { name: '추가' })).toBeVisible()
  })

  test('메모 상세에서 수정 버튼을 누르면 편집 페이지로 이동한다', async ({ page }) => {
    await page.goto(`${INFO_URL}&info-tab=memo`)
    await waitForAppLoad(page)
    await page.getByText('숙소 체크인 정보').click()
    await expect(page).toHaveURL(/\/trip\/.+\/memo\/memo-001/)

    await page.getByRole('button', { name: '더보기 메뉴' }).click()
    await page.getByText('수정').click()

    await expect(page).toHaveURL(/\/trip\/.+\/memo\/memo-001\/edit/)
  })

  test('메모를 수정하면 저장 후 상세 페이지로 돌아온다', async ({ page }) => {
    await page.goto(`${INFO_URL}&info-tab=memo`)
    await waitForAppLoad(page)
    await page.getByText('숙소 체크인 정보').click()
    await expect(page).toHaveURL(/\/trip\/.+\/memo\/memo-001/)
    await page.getByRole('button', { name: '더보기 메뉴' }).click()
    await page.getByText('수정').click()
    await expect(page).toHaveURL(/\/trip\/.+\/memo\/memo-001\/edit/)

    await page.getByPlaceholder('제목').fill('수정된 제목')
    await page.getByRole('button', { name: '저장' }).click()

    await expect(page).toHaveURL(/\/trip\/.+\/memo\/memo-001/)
  })

  test('메모 상세에서 삭제하면 메모 목록으로 돌아온다', async ({ page }) => {
    await page.goto(`${INFO_URL}&info-tab=memo`)
    await waitForAppLoad(page)
    await page.getByText('숙소 체크인 정보').click()
    await expect(page).toHaveURL(/\/trip\/.+\/memo\/memo-001/)

    await page.getByRole('button', { name: '더보기 메뉴' }).click()
    await page.getByText('삭제').click()
    await page.getByRole('button', { name: '확인' }).click()

    await expect(page).toHaveURL(/info-tab=memo/)
  })

  test('메모 탭에서 새 메모를 작성할 수 있다', async ({ page }) => {
    await page.goto(`${INFO_URL}&info-tab=memo`)
    await waitForAppLoad(page)

    await page.getByRole('button', { name: '추가' }).click()
    // BottomSheet 헤더 "메모" 확인
    await expect(page.getByRole('button', { name: '저장' })).toBeVisible()

    await page.getByPlaceholder('메모를 입력하세요').fill('새 메모 내용')
    await page.getByRole('button', { name: '저장' }).click()

    await expect(page.getByRole('button', { name: '저장' })).not.toBeVisible()
  })

  // ──────────────────────────────────────────────────────────
  // [체크리스트] 작성 / 체크 / 삭제
  // ──────────────────────────────────────────────────────────

  test('체크리스트 탭에 mock 항목들이 표시된다', async ({ page }) => {
    await page.goto(`${INFO_URL}&info-tab=checklist`)
    await waitForAppLoad(page)

    await expect(page.getByText('여권 챙기기')).toBeVisible()
    await expect(page.getByText('환전하기')).toBeVisible()
  })

  test('체크되지 않은 항목을 체크하면 완료 처리된다', async ({ page }) => {
    await page.goto(`${INFO_URL}&info-tab=checklist`)
    await waitForAppLoad(page)

    const unchecked = page.getByText('여권 챙기기')
    await expect(unchecked).toBeVisible()

    const checkbox = page.getByRole('checkbox').first()
    await checkbox.click()

    await expect(checkbox).toBeChecked()
  })

  test('체크리스트 추가 버튼을 누르면 입력 폼이 열린다', async ({ page }) => {
    await page.goto(`${INFO_URL}&info-tab=checklist`)
    await waitForAppLoad(page)

    await page.getByRole('button', { name: '추가' }).click()

    // BottomSheet 안의 "체크리스트" 헤더와 제목 입력 필드가 보임
    await expect(page.getByRole('button', { name: '확인' })).toBeVisible()
  })

  test('체크리스트를 작성하고 확인하면 폼이 닫힌다', async ({ page }) => {
    await page.goto(`${INFO_URL}&info-tab=checklist`)
    await waitForAppLoad(page)

    await page.getByRole('button', { name: '추가' }).click()
    await expect(page.getByRole('button', { name: '확인' })).toBeVisible()

    // MUI TextField의 실제 input 요소 (checkbox 제외한 첫 번째 text input)
    await page.locator('input[type="text"]').first().fill('새 체크리스트')
    await page.getByRole('button', { name: '확인' }).click()

    await expect(page.getByRole('button', { name: '확인' })).not.toBeVisible()
  })

  test('체크리스트 항목 메뉴에서 삭제할 수 있다', async ({ page }) => {
    await page.goto(`${INFO_URL}&info-tab=checklist`)
    await waitForAppLoad(page)

    await page.getByText('여권 챙기기').waitFor()
    // MoreVertIcon 버튼 (aria-label 없음) → nth(0) = 첫 항목의 메뉴 버튼
    await page.locator('button').filter({ has: page.locator('[data-testid="MoreVertIcon"]') }).first().click()
    await page.getByRole('menuitem', { name: '삭제' }).click()
    await page.getByRole('button', { name: '확인' }).click()

    await expect(page.getByRole('presentation')).not.toBeVisible()
  })

  // ──────────────────────────────────────────────────────────
  // [기본정보 서브탭] 커뮤니티 장소 및 경로
  // ──────────────────────────────────────────────────────────

  test('기본정보 탭에 이 여행지를 다녀온 사람들 섹션이 표시된다', async ({ page }) => {
    await page.goto(TRIP_URL)
    await waitForAppLoad(page)

    await expect(page.getByText('이 여행지를 다녀온 사람들')).toBeVisible()
  })

  test('커뮤니티 여행 카드를 클릭하면 경로 상세 시트가 열린다', async ({ page }) => {
    await page.goto(TRIP_URL)
    await waitForAppLoad(page)

    await page.getByText('이 여행지를 다녀온 사람들').waitFor()
    // 4박 5일 카드 (2025-05-01 ~ 2025-05-05)
    await page.getByText(/박/).first().click()

    await expect(page.getByText('시부야', { exact: true })).toBeVisible()
  })

  test('커뮤니티 경로 상세에서 장소 추가 버튼이 표시된다', async ({ page }) => {
    await page.goto(TRIP_URL)
    await waitForAppLoad(page)

    await page.getByText('이 여행지를 다녀온 사람들').waitFor()
    await page.getByText(/박/).first().click()
    await page.getByText('시부야', { exact: true }).waitFor()

    await expect(page.getByRole('button', { name: '추가' })).toBeVisible()
  })

  // ──────────────────────────────────────────────────────────
  // [채팅] 헤더 아이콘 클릭 → 채팅 오버레이 열기
  // ──────────────────────────────────────────────────────────

  test('헤더 채팅 버튼 클릭 시 채팅 오버레이가 열린다', async ({ page }) => {
    await page.goto(TRIP_URL)
    await waitForAppLoad(page)

    await page.getByRole('button', { name: '채팅 열기' }).click()

    await expect(page.getByText('채팅')).toBeVisible()
  })

  test('채팅 오버레이에 mock 메시지가 표시된다', async ({ page }) => {
    await page.goto(TRIP_URL)
    await waitForAppLoad(page)

    await page.getByRole('button', { name: '채팅 열기' }).click()

    await expect(page.getByText('안녕하세요!')).toBeVisible()
    await expect(page.getByText('반가워요 :)')).toBeVisible()
  })

  test('채팅 오버레이에서 닫기 버튼을 누르면 채팅이 닫힌다', async ({ page }) => {
    await page.goto(TRIP_URL)
    await waitForAppLoad(page)
    await page.getByRole('button', { name: '채팅 열기' }).click()
    await expect(page.getByText('채팅')).toBeVisible()

    await page.getByRole('button', { name: '채팅 닫기' }).click()

    await expect(page.getByText('채팅')).not.toBeVisible()
  })

  test('채팅 오버레이에서 메시지를 입력하고 전송할 수 있다', async ({ page }) => {
    await page.goto(TRIP_URL)
    await waitForAppLoad(page)
    await page.getByRole('button', { name: '채팅 열기' }).click()
    await expect(page.getByText('채팅')).toBeVisible()

    await page.getByPlaceholder('메시지를 입력하세요').fill('테스트 메시지')
    await page.getByRole('button', { name: '메시지 전송' }).click()

    await expect(page.getByPlaceholder('메시지를 입력하세요')).toHaveValue('')
  })
})
