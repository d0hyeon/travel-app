import type { QueryClient } from '@tanstack/react-query'

let queryClientInstance: QueryClient | null = null

// 웹·앱이 각자 만든 QueryClient 를 주입한다.
// 훅 안에서는 useQueryClient() 를 쓰면 되지만, prefetch 처럼 React 밖에서
// 호출되는 경로가 있어 모듈 스코프 참조가 필요하다.
export function initQueryClient(client: QueryClient) {
  queryClientInstance = client
}

// api/client.ts 의 lazy 와 같은 이유다 — 참조는 그대로 두고 인스턴스만 지연 생성한다.
export const queryClient = new Proxy({} as QueryClient, {
  get(_, prop, receiver) {
    if (queryClientInstance == null) {
      throw new Error('queryClient 에 접근하기 전에 initQueryClient() 를 호출해야 합니다.')
    }
    const value = Reflect.get(queryClientInstance, prop, receiver)
    return typeof value === 'function' ? value.bind(queryClientInstance) : value
  },
})
