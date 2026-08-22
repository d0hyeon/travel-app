import { createClient } from '@supabase/supabase-js'
import { initializeClient } from '@waylog/domains/client'
import { createAuthService } from '~app/supabase-auth'

// 테스트는 entry.client.tsx 를 거치지 않으므로 여기서 공유 패키지를 초기화한다.
// 실제 네트워크 요청은 MSW가 가로채므로 값 자체는 형식만 유효하면 된다.
const client = createClient(
  import.meta.env.VITE_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'placeholder',
)

initializeClient({
  client,
  auth: createAuthService(client),
  storage: window.localStorage,
})
