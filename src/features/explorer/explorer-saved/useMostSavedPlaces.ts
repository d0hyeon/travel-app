import { useSuspenseQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { Location } from '~features/location'
import type { PlaceCategoryType } from '~features/place/place.types'
import { arrayIncludes } from '~shared/utils/types'
import { explorerKey, getMostSavedPlaces } from '../explorer.api'

interface MostSavedPlacesOption {
  location?: Location | null
  category?: PlaceCategoryType | null
}

export function useMostSavedPlaces({ location, category }: MostSavedPlacesOption = {}) {
  const query = useSuspenseQuery({
    queryKey: [explorerKey, 'most-saved'],
    queryFn: async () => {
      const { places } = await getMostSavedPlaces()
      if (places.length === 0) return []
      const maxSaveCount = Math.max(...places.map((p) => p.saveCount))
      const threshold = maxSaveCount / 2
      return places
        .filter((p) => p.saveCount >= threshold)
        .toSorted((a, b) => b.saveCount - a.saveCount)
    },
  })

  const data = useMemo(() => {
    return query.data
      .filter((p) => !location || arrayIncludes(p.destinations, location))
      .filter((p) => !category || arrayIncludes(p.categories, category))
  }, [query.data, location, category])

  return { ...query, data }
}
