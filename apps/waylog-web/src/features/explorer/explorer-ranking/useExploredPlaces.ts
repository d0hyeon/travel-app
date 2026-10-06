import { useSuspenseQuery } from '@tanstack/react-query'
import { explorerKey, getExploredPlaces } from '../explorer.api'
import type { PlaceCategoryType } from '@waylog/domains/modules/place'

export function useExploredPlaces(location?: string | null, category?: PlaceCategoryType | null) {
  return useSuspenseQuery({
    queryKey: [explorerKey, 'explored', location, category],
    queryFn: async () => {
      const { places } = await getExploredPlaces({ location, category })
      if (places.length === 0) return []
      const maxVisitCount = Math.max(...places.map((p) => p.visitorCount))
      const threshold = maxVisitCount / 2

      return places.filter((p) => p.visitorCount >= threshold)
    },
  })
}
