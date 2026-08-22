import AsyncStorage from '@react-native-async-storage/async-storage'
import { initApi } from '@waylog/domains/api'
import { setLastReadStore } from '@waylog/domains/trip-chat'
import Constants from 'expo-constants'

const extra = Constants.expoConfig?.extra

export function setupApi() {
  initApi({
    url: extra?.supabaseUrl,
    anonKey: extra?.supabaseAnonKey,
    // 국내 날씨(기상청)가 쓴다. 없으면 인증 실패가 에러로 올라온다.
    governmentApiServiceKey: extra?.governmentApiServiceKey,
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

  setupLastReadStore()
}

const LAST_READ_PREFIX = 'chat_last_read_'

/**
 * 채팅 미읽음은 렌더 중에 동기로 읽는다.
 * AsyncStorage 는 비동기이므로 메모리 캐시를 앞에 두고, 시작 시 한 번 채운다.
 * 캐시가 비어 있는 첫 프레임은 "안 읽음"으로 보이지만 로드 직후 바로 맞춰진다.
 */
function setupLastReadStore() {
  const cache = new Map<string, string>()

  setLastReadStore({
    get: (key) => cache.get(key) ?? null,
    set: (key, value) => {
      cache.set(key, value)
      void AsyncStorage.setItem(key, value)
    },
  })

  void AsyncStorage.getAllKeys().then(async (keys) => {
    const lastReadKeys = keys.filter((key) => key.startsWith(LAST_READ_PREFIX))
    const entries = await AsyncStorage.multiGet(lastReadKeys)

    entries.forEach(([key, value]) => {
      if (value != null) cache.set(key, value)
    })
  })
}
