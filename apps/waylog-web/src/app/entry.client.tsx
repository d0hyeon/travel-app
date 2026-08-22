// 공유 패키지(@waylog/domains)의 supabase 클라이언트를 초기화한다.
// 다른 어떤 모듈보다 먼저 실행되어야 한다.
import './env'

import { createClient } from '@supabase/supabase-js'
import { initializeClient } from '@waylog/domains/api'
import type { Database } from '@waylog/domains/api'
import { createAuthService } from './supabase-auth'
import { GOVERNMENT_API_SERVICE_KEY, SUPABASE_ANON_KEY, SUPABASE_URL } from './env'
import { startTransition, StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { HydratedRouter } from 'react-router/dom'

const client = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)

initializeClient({
  client,
  auth: createAuthService(client),
  storage: localStorage,
  governmentKey: GOVERNMENT_API_SERVICE_KEY,
})


// E2E 테스트 환경에서만 MSW를 활성화한다.
// VITE_MSW=true는 .env.test에서 주입되며 프로덕션 빌드에는 포함되지 않는다.
// await worker.start()가 완료된 후 앱을 마운트해서 첫 요청부터 MSW가 인터셉트한다.
if (import.meta.env.VITE_MSW === 'true') {
  const { worker } = await import('../mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
}

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>,
  )
})
