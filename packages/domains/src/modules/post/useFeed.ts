import { useSuspenseQuery } from '@tanstack/react-query'
import { getFeed, postKey } from './post.api'

export function useFeed() {
  return useSuspenseQuery({
    queryKey: useFeed.key(),
    queryFn: getFeed,
  })
}

useFeed.key = () => [postKey, 'public']
