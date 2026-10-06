import { useSuspenseQuery } from '@tanstack/react-query'
import { getFeed, postKey } from './post.api'

export function useUserFeed(userId: string) {
  return useSuspenseQuery({
    queryKey: useUserFeed.key(userId),
    queryFn: () => getFeed(userId),
  })
}

useUserFeed.key = (userId: string) => [postKey, 'user', userId]
