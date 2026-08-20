import { QueryClient } from "@tanstack/react-query";
import { initQueryClient } from "@waylog/domains/query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: false,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: true,
      throwOnError: true
    }
  }
})

initQueryClient(queryClient)
