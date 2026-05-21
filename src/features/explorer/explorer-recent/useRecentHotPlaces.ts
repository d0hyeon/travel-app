import { useSuspenseQuery } from '@tanstack/react-query'
import { explorerKey, getRecentHotPlaces } from '../explorer.api'
import { useMemo } from 'react'
import type { PlaceCategoryType } from '~features/place/place.types'
import { arrayIncludes } from '~shared/utils/types';
import type { Location } from '~features/location';

interface RecentHotPlaceOption {
  inquiryMonths: number;
  location?: Location;
  category?: PlaceCategoryType;
}

export function useRecentHotPlaces({ inquiryMonths, ...params }: RecentHotPlaceOption) {
  const query = useSuspenseQuery({
    queryKey: [explorerKey, 'recent-hot', inquiryMonths],
    queryFn: async () => {
      const { places } = await getRecentHotPlaces(inquiryMonths)
      if (places.length === 0) return []
      const maxVisitCount = Math.max(...places.map((p) => p.visitorCount))
      const threshold = maxVisitCount / 2
      return places.filter((p) => p.visitorCount >= threshold)
    },
  })

  const data = useMemo(() => {
    return query.data
      .filter((p) => !params.location || arrayIncludes(p.destinations, params.location) )
      .filter((p) => !params.category || arrayIncludes(p.categories, params.category))
  }, [query.data, params])

  return { ...query, data }
}
