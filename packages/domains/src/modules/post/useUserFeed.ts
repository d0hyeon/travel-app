import { useSuspenseInfiniteQuery } from '@tanstack/react-query'
import { getFeedPage, postKey } from './post.api'
import { getNextFeedCursor } from './post.utils'
import type { PostCursor } from './post.types'

export function useUserFeed(userId: string) {
  return useSuspenseInfiniteQuery({
    queryKey: useUserFeed.key(userId),
    queryFn: ({ pageParam }) => getFeedPage(pageParam, userId),
    initialPageParam: undefined as PostCursor | undefined,
    getNextPageParam: getNextFeedCursor,
    select: (data) => data.pages.flat(),
  })
}

useUserFeed.key = (userId: string) => [postKey, 'user', userId]
