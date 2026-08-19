import { useSuspenseQuery } from '@tanstack/react-query'
import { explorerKey, getRecentHotPlaces } from '../explorer.api'
import { useMemo } from 'react'
import type { PlaceCategoryType } from '~features/place/place.types'
import { arrayIncludes } from '@waylog/domains/utils';
import type { Location } from '@waylog/domains/location';

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
      const maxScore = Math.max(...places.map((p) => p.score))
      const threshold = maxScore / 2
      return places
        .filter((p) => p.score >= threshold)
        .toSorted((a, b) => b.score - a.score)
    },
  })

  const data = useMemo(() => {
    return query.data
      .filter((p) => !params.location || arrayIncludes(p.destinations, params.location) )
      .filter((p) => !params.category || arrayIncludes(p.categories, params.category))
  }, [query.data, params.location, params.category])

  return { ...query, data }
}
