import { useSuspenseQuery } from '@tanstack/react-query'
import { queryClient } from '~app/query-client'
import { getPublicFeed, postKey } from './post.api'

export function usePublicFeed() {
  return useSuspenseQuery({
    queryKey: usePublicFeed.key(),
    queryFn: getPublicFeed,
  })
}

usePublicFeed.key = () => [postKey, 'public']
usePublicFeed.prefetch = () => {
  queryClient.prefetchQuery({
    queryKey: usePublicFeed.key(),
    queryFn: getPublicFeed,
  })
}
