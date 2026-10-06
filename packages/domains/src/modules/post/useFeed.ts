import { useSuspenseInfiniteQuery } from '@tanstack/react-query'
import { getFeedPage, postKey } from './post.api'
import { getNextFeedCursor } from './post.utils'
import type { PostCursor } from './post.types'

export function useFeed() {
  return useSuspenseInfiniteQuery({
    queryKey: useFeed.key(),
    queryFn: ({ pageParam }) => getFeedPage(pageParam),
    initialPageParam: undefined as PostCursor | undefined,
    getNextPageParam: getNextFeedCursor,
    select: (data) => data.pages.flat(),
  })
}

useFeed.key = () => [postKey, 'public']
