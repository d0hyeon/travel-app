import { useSuspenseQuery } from '@tanstack/react-query'
import type { Location } from '@waylog/domains/modules/location'
import type { PlaceCategoryType } from '@waylog/domains/modules/place'
import { useMemo } from 'react'
import { explorerKey, getExploredPlaces } from '~features/explorer/explorer.api'

interface PlaceFilters {
  location?: Location
  category?: PlaceCategoryType
}

export function useExploredPlaces(filters: PlaceFilters = {}) {
  const query = useSuspenseQuery({
    queryKey: [explorerKey, 'explored', filters.location, filters.category],
    queryFn: () => getExploredPlaces(filters),
  })

  const places = useMemo(() => {
    const highestVisitorCount = Math.max(...query.data.map((place) => place.visitorCount), 0)
    const minimumVisitorCount = highestVisitorCount / 2

    return query.data
      .filter((place) => place.visitorCount >= minimumVisitorCount)
      .toSorted((first, second) => second.visitorCount - first.visitorCount)
  }, [query.data])

  return { ...query, data: places }
}
