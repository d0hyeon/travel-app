import { focusManager, QueryClient } from '@tanstack/react-query'
import { AppState } from 'react-native'

/**
 * 웹 ~app/query-client 와 같은 역할이다.
 * 훅 밖(라우터 프리페치 등)에서도 캐시에 접근해야 해 모듈 단일 인스턴스로 둔다.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      throwOnError: true,
    },
  },
})

focusManager.setEventListener((handleFocus) => {
  const subscription = AppState.addEventListener('change', (state) => handleFocus(state === 'active'))
  return () => subscription.remove()
})
