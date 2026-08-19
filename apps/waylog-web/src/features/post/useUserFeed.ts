import { useSuspenseQuery } from '@tanstack/react-query'
import { queryClient } from '~app/query-client'
import { getUserFeed, postKey } from './post.api'

export function useUserFeed(userId: string) {
  return useSuspenseQuery({
    queryKey: useUserFeed.key(userId),
    queryFn: () => getUserFeed(userId),
  })
}

useUserFeed.key = (userId: string) => [postKey, 'user', userId]
useUserFeed.prefetch = (userId: string) => {
  queryClient.prefetchQuery({
    queryKey: useUserFeed.key(userId),
    queryFn: () => getUserFeed(userId),
  })
}
