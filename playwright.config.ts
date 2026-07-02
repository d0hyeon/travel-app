import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  globalSetup: './e2e/helpers/auth-setup.ts',
  workers: 10,
  timeout: 15_000,

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // 모든 테스트에 인증된 localStorage 상태를 자동 주입
    storageState: 'e2e/.auth/user.json',
  },

  projects: [
    {
      name: 'mobile',
      // mobile + 공통 스펙만 실행 (desktop 전용 스펙은 제외)
      testIgnore: /\.desktop\.spec\.ts$/,
      use: {
        // iPhone 14 viewport, Chromium 엔진으로 실행 (webkit 별도 설치 불필요)
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'desktop',
      // desktop + 공통 스펙만 실행 (mobile 전용 스펙은 제외)
      testIgnore: /\.mobile\.spec\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],

  // 테스트 실행 전 dev 서버를 자동으로 띄운다
  webServer: {
    // --mode test → Vite가 .env.test를 로드 → VITE_MSW=true 주입
    command: 'pnpm dev --mode test',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
