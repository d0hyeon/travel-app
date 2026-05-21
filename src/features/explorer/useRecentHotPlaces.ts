import { useSuspenseQuery } from '@tanstack/react-query'
import { explorerKey, getRecentHotPlaces } from './explorer.api'
import { useMemo } from 'react'
import type { PlaceCategoryType } from '~features/place/place.types'

export function useRecentHotPlaces(months: number, location?: string | null, category?: PlaceCategoryType | null) {
  const query = useSuspenseQuery({
    queryKey: [explorerKey, 'recent-hot', months],
    queryFn: async () => {
      const { places } = await getRecentHotPlaces(months)
      if (places.length === 0) return []
      const maxVisitCount = Math.max(...places.map((p) => p.visitorCount))
      const threshold = maxVisitCount / 2
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
