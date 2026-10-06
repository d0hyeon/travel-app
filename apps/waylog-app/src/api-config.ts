import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import { initializeClient } from '@waylog/domains/clients'
import Constants from 'expo-constants'
import { createAuthService } from './supabase-auth'
import type { Database } from '@waylog/domains/clients'

const extra = Constants.expoConfig?.extra

export function setupApi() {
  const client = createClient<Database>(extra?.supabaseUrl, extra?.supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      // 콜백이 딥링크로 돌아오므로 URL 조각에 토큰을 싣는 implicit 대신 코드 교환을 쓴다.
      flowType: 'pkce',
    },
  })

  initializeClient({
    client,
    auth: createAuthService(client),
    storage: AsyncStorage,
    // 국내 날씨(기상청)가 쓴다. 없으면 인증 실패가 에러로 올라온다.
    governmentKey: extra?.governmentApiServiceKey,
    // 지역 경계 geojson 은 웹이 서빙한다. 앱에는 정적 파일이 없다.
    // extra 가 아닌 이유: extra 는 네이티브 빌드에 구워져 재빌드해야 바뀐다.
    boundaryBaseUrl: process.env.EXPO_PUBLIC_WEB_BASE_URL,
  })

}
