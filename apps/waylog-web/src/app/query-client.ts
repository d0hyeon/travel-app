import { initQueryClient, queryClient } from '@waylog/domains/query'

initQueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: false,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: true,
      throwOnError: true
    }
  }
})

export { queryClient }
