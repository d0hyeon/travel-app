import { useSuspenseQuery } from '@tanstack/react-query'
import { explorerKey, getExploredPlaces } from '../explorer.api'
import { useMemo } from 'react'
import type { PlaceCategoryType } from '@waylog/domains/place'

export function useExploredPlaces(location?: string | null, category?: PlaceCategoryType | null) {
  const query = useSuspenseQuery({
    queryKey: [explorerKey, 'explored'],
    queryFn: async () => {
      const { places } = await getExploredPlaces()
      const maxVisitCount = Math.max(...places.map((p) => p.visitorCount))
      const threshold = maxVisitCount / 2;
      
      return places.filter((p) => p.visitorCount >= threshold)
    },
  })

  const data = useMemo(() => {
    return query.data
      .filter((p) => !location || p.destinations.includes(location))
      .filter((p) => !category || p.categories.includes(category))
  }, [query.data, location, category])

  return { ...query, data }
}
