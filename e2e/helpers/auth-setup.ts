import { chromium, type FullConfig } from '@playwright/test'
import { MOCK_SESSION } from '../../src/features/auth/auth.mock'

// ────────────────────────────────────────────────────────────
// globalSetup: 모든 테스트가 시작하기 전에 딱 한 번 실행된다.
//
// supabase-js는 네트워크 요청 전에 localStorage의
// sb-<ref>-auth-token 키를 먼저 확인한다.
// 유효한 세션이 있으면 getSession()이 네트워크 없이 바로 반환한다.
//
// 이 setup은 인증된 사용자 상태의 localStorage를 파일로 저장해두고,
// playwright.config.ts의 storageState로 모든 테스트에 자동 주입한다.
// ────────────────────────────────────────────────────────────

const SUPABASE_PROJECT_REF = 'feubgswdgmxrbpbfbqje'
const STORAGE_STATE_PATH = 'e2e/.auth/user.json'

export default async function globalSetup(_config: FullConfig) {
  const browser = await chromium.launch()
  const context = await browser.newContext({ baseURL: 'http://localhost:5173' })
  const page = await context.newPage()

  // 빈 페이지에서 localStorage에 세션을 심는다
  await page.goto('/')
  await page.evaluate(
    ({ key, session }) => {
      localStorage.setItem(key, JSON.stringify(session))
    },
    {
      key: `sb-${SUPABASE_PROJECT_REF}-auth-token`,
      session: MOCK_SESSION,
    }
  )

  // storageState를 파일로 저장 — localStorage + cookies 포함
  await context.storageState({ path: STORAGE_STATE_PATH })
  await browser.close()
}
