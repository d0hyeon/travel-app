import type { SupabaseClient } from '@supabase/supabase-js'
import { setGovernmentApiServiceKey } from './governmentApi'
import type { Database } from './_database.types'
import type { AuthService } from '../auth/auth.types'
import { configureAuthService } from '../auth/auth.service'
import { configureStorage } from '../../modules/storage'
import type { PlatformStorage } from '../../modules/storage'

export type ApiConfig = {
  client: SupabaseClient<Database>
  auth: AuthService
  storage: PlatformStorage
  governmentKey?: string
}

let supabaseInstance: SupabaseClient<Database> | null = null

export function initializeClient({ client, auth, storage, governmentKey }: ApiConfig) {
  supabaseInstance = client

  if (governmentKey != null) {
    setGovernmentApiServiceKey(governmentKey)
  }

  configureAuthService(auth)
  configureStorage(storage)
}

// .api.ts 전체가 `import { supabase }` 로 모듈 스코프 인스턴스를 쓴다.
// 함수 인자로 client를 넘기면 모든 파일과 호출부가 바뀌므로, 참조는 그대로 두고
// 실제 인스턴스만 지연 생성한다.
function lazy<T extends object>(get: () => T | null, name: string): T {
  return new Proxy({} as T, {
    get(_, prop, receiver) {
      const target = get()
      if (target == null) {
        throw new Error(`${name}에 접근하기 전에 initializeClient()를 호출해야 합니다.`)
      }
      const value = Reflect.get(target, prop, receiver)
      // Reflect.get 만 쓰면 메서드의 this 바인딩이 끊겨 supabase.from(...) 이 깨진다.
      return typeof value === 'function' ? value.bind(target) : value
    },
  })
}

export const supabase = lazy(() => supabaseInstance, 'supabase')
