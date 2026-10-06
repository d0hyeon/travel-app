import { QueryClient } from "@tanstack/react-query";

const DEFAULT_RETRY_COUNT = 3;
const isMockedEnvironment = import.meta.env.VITE_MSW === "true";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: isMockedEnvironment ? false : DEFAULT_RETRY_COUNT,
      refetchInterval: false,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: true,
      throwOnError: true
    }
  }
})
