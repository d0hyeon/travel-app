import { createClient } from '@supabase/supabase-js'
import { initializeClient } from '@waylog/domains/api'
import { setLastReadStore } from '@waylog/domains/trip-chat'
import { createAuthService } from './supabase-auth'
import type { Database } from '@waylog/domains/api'

export const isDev = import.meta.env.DEV;

export const GOVERNMENT_API_SERVICE_KEY = import.meta.env
  .VITE_DATA_GO_SERVICE_KEY;

// 공유 패키지는 환경변수를 직접 읽지 않는다. 앱이 읽어서 주입한다.
// 어떤 .api.ts 보다 먼저 실행되어야 하므로 entry.client.tsx 최상단에서 import 한다.
const client = createClient<Database>(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

initializeClient({
  client,
  auth: createAuthService(client),
  governmentKey: GOVERNMENT_API_SERVICE_KEY,
})

// 채팅 미읽음 계산은 렌더 중에 동기로 읽는다. 웹은 localStorage 가 그대로 맞다.
setLastReadStore({
  get: (key) => localStorage.getItem(key),
  set: (key, value) => localStorage.setItem(key, value),
})
