import { useSuspenseQuery } from '@tanstack/react-query'
import { queryClient } from '~app/query-client'
import { getFeed, postKey } from './post.api'



export function useFeed() {
  return useSuspenseQuery({
    queryKey: useFeed.key(),
    queryFn: getFeed,
  })
}

useFeed.key = () => [postKey, 'public']
useFeed.prefetch = () => {
  queryClient.prefetchQuery({
    queryKey: useFeed.key(),
    queryFn: getFeed,
  })
}
