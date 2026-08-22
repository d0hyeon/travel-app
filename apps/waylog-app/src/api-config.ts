import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import { initializeClient } from '@waylog/domains/api'
import Constants from 'expo-constants'
import { createAuthService } from './supabase-auth'
import type { Database } from '@waylog/domains/api'

const extra = Constants.expoConfig?.extra

export function setupApi() {
  const client = createClient<Database>(extra?.supabaseUrl, extra?.supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  })

  initializeClient({
    client,
    auth: createAuthService(client),
    storage: AsyncStorage,
    // 국내 날씨(기상청)가 쓴다. 없으면 인증 실패가 에러로 올라온다.
    governmentKey: extra?.governmentApiServiceKey,
  })

}
