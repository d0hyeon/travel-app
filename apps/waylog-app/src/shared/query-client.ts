import { QueryClient } from '@tanstack/react-query'

/**
 * 웹 ~app/query-client 와 같은 역할이다.
 * 훅 밖(라우터 프리페치 등)에서도 캐시에 접근해야 해 모듈 단일 인스턴스로 둔다.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // RN 에는 window focus 개념이 없다.
      refetchOnWindowFocus: false,
      throwOnError: true,
    },
  },
})
