import { QueryClient, type QueryClientConfig } from '@tanstack/react-query'

let instance: QueryClient | null = null

export function initQueryClient(config?: QueryClientConfig) {
  instance = new QueryClient(config)
  return instance
}

// api 계층의 supabase와 같은 이유로 Proxy를 쓴다.
// 모듈 스코프 queryClient를 참조하는 코드를 그대로 유지하면서
// 인스턴스 생성 시점만 앱으로 옮긴다.
export const queryClient = new Proxy({} as QueryClient, {
  get(_, prop, receiver) {
    if (instance == null) {
      throw new Error('queryClient에 접근하기 전에 initQueryClient()를 호출해야 합니다.')
    }
    const value = Reflect.get(instance, prop, receiver)
    return typeof value === 'function' ? value.bind(instance) : value
  },
})
