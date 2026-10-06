import { useSuspenseQuery } from '@tanstack/react-query'
import type { Location } from '@waylog/domains/modules/location'
import type { PlaceCategoryType } from '@waylog/domains/modules/place'
import { explorerKey, getMostSavedPlaces } from '../explorer.api'
import { bySaveRank } from './mostSavedPlaces.utils'

interface MostSavedPlacesOption {
  location?: Location | null
  category?: PlaceCategoryType | null
}

export function useMostSavedPlaces({ location, category }: MostSavedPlacesOption = {}) {
  return useSuspenseQuery({
    queryKey: [explorerKey, 'most-saved', location, category],
    queryFn: async () => {
      const { places } = await getMostSavedPlaces({ location, category })
      if (places.length === 0) return []
      const maxSaveCount = Math.max(...places.map((p) => p.saveCount))
      const threshold = maxSaveCount / 2
      return places.filter((p) => p.saveCount >= threshold).toSorted(bySaveRank)
    },
  })
}
