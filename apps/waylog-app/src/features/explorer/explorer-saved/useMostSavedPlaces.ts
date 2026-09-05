import { useSuspenseQuery } from '@tanstack/react-query'
import type { Location } from '@waylog/domains/modules/location'
import type { PlaceCategoryType } from '@waylog/domains/modules/place'
import { useMemo } from 'react'
import { explorerKey, getMostSavedPlaces } from '../explorer.api'

interface PlaceFilters {
  location?: Location
  category?: PlaceCategoryType
}

export function useMostSavedPlaces(filters: PlaceFilters = {}) {
  const query = useSuspenseQuery({
    queryKey: [explorerKey, 'most-saved'],
    queryFn: getMostSavedPlaces,
  })

  const places = useMemo(() => {
    const highestSaveCount = Math.max(...query.data.map((place) => place.saveCount), 0)
    const minimumSaveCount = highestSaveCount / 2

    return query.data
      .filter((place) => place.saveCount >= minimumSaveCount)
      .filter((place) => !filters.location || place.destinations.includes(filters.location))
      .filter((place) => !filters.category || place.categories.includes(filters.category))
      .toSorted((first, second) => second.saveCount - first.saveCount)
  }, [filters.category, filters.location, query.data])

  return { ...query, data: places }
}
