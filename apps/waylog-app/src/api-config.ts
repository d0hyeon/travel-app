import AsyncStorage from '@react-native-async-storage/async-storage'
import { initApi } from '@waylog/domains/api'
import { initQueryClient } from '@waylog/domains/query'
import Constants from 'expo-constants'

const extra = Constants.expoConfig?.extra

export function setupApi() {
  initApi({
    url: extra?.supabaseUrl,
    anonKey: extra?.supabaseAnonKey,
    auth: {
      // supabase-js 의 auth storage 는 비동기 인터페이스를 허용하므로
      // AsyncStorage 를 그대로 넘길 수 있다.
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      // RN 에는 URL 콜백이 없다.
      detectSessionInUrl: false,
    },
  })

  initQueryClient({
    defaultOptions: {
      queries: {
        // RN 에는 window focus 개념이 없다.
        refetchOnWindowFocus: false,
        throwOnError: true,
      },
    },
  })
}
