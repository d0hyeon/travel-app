import { useSuspenseQuery } from '@tanstack/react-query'
import { explorerKey, getPlaceFeed } from './explorer.api'

export function useExplorerPlaceFeed(placeId: string) {
  return useSuspenseQuery({
    queryKey: [explorerKey, 'place-feed', placeId],
    queryFn: () => getPlaceFeed(placeId),
  })
}
