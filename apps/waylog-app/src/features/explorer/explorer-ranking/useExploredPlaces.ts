import { useSuspenseQuery } from '@tanstack/react-query'
import type { Location } from '@waylog/domains/modules/location'
import type { PlaceCategoryType } from '@waylog/domains/modules/place'
import { useMemo } from 'react'
import { explorerKey, getExploredPlaces } from '../explorer.api'

interface PlaceFilters {
  location?: Location
  category?: PlaceCategoryType
}

export function useExploredPlaces(filters: PlaceFilters = {}) {
  const query = useSuspenseQuery({
    queryKey: [explorerKey, 'explored'],
    queryFn: () => getExploredPlaces(),
  })

  const places = useMemo(() => {
    const highestVisitorCount = Math.max(...query.data.map((place) => place.visitorCount), 0)
    const minimumVisitorCount = highestVisitorCount / 2

    return query.data
      .filter((place) => place.visitorCount >= minimumVisitorCount)
      .filter((place) => !filters.location || place.destinations.includes(filters.location))
      .filter((place) => !filters.category || place.categories.includes(filters.category))
      .toSorted((first, second) => second.visitorCount - first.visitorCount)
  }, [filters.category, filters.location, query.data])

  return { ...query, data: places }
}
