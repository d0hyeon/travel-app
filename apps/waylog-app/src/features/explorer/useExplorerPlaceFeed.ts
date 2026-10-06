import { useSuspenseQuery } from '@tanstack/react-query'
import { getPlaceFeed } from '@waylog/domains/modules/post'
import { explorerKey } from './explorer.api'

export function useExplorerPlaceFeed(placeId: string) {
  return useSuspenseQuery({
    queryKey: [explorerKey, 'place-feed', placeId],
    queryFn: () => getPlaceFeed(placeId),
  })
}
