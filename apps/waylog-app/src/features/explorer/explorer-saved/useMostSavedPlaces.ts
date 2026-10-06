import { useSuspenseQuery } from '@tanstack/react-query'
import type { Location } from '@waylog/domains/modules/location'
import type { PlaceCategoryType } from '@waylog/domains/modules/place'
import { useMemo } from 'react'
import { explorerKey, getMostSavedPlaces } from '~features/explorer/explorer.api'
import { bySaveRank } from './mostSavedPlaces.utils'

interface PlaceFilters {
  location?: Location
  category?: PlaceCategoryType
}

export function useMostSavedPlaces(filters: PlaceFilters = {}) {
  const query = useSuspenseQuery({
    queryKey: [explorerKey, 'most-saved', filters.location, filters.category],
    queryFn: () => getMostSavedPlaces(filters),
  })

  const places = useMemo(() => {
    const highestSaveCount = Math.max(...query.data.map((place) => place.saveCount), 0)
    const minimumSaveCount = highestSaveCount / 2

    return query.data
      .filter((place) => place.saveCount >= minimumSaveCount)
      .toSorted(bySaveRank)
  }, [query.data])

  return { ...query, data: places }
}
