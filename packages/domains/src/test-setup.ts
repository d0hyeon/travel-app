import { initApi } from './api'

// 공유 패키지 테스트는 앱 진입점을 거치지 않으므로 여기서 초기화한다.
initApi({
  url: 'https://placeholder.supabase.co',
  anonKey: 'placeholder',
})

