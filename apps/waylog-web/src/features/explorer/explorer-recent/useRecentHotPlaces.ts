import { useSuspenseQuery } from '@tanstack/react-query'
import { explorerKey, getRecentHotPlaces } from '../explorer.api'
import { byHotRank } from './recentHotPlaces.utils'
import type { PlaceCategoryType } from '@waylog/domains/modules/place'
import type { Location } from '@waylog/domains/modules/location';

interface RecentHotPlaceOption {
  inquiryMonths: number;
  location?: Location;
  category?: PlaceCategoryType;
}

export function useRecentHotPlaces({ inquiryMonths, location, category }: RecentHotPlaceOption) {
  return useSuspenseQuery({
    queryKey: [explorerKey, 'recent-hot', inquiryMonths, location, category],
    queryFn: async () => {
      const { places } = await getRecentHotPlaces(inquiryMonths, { location, category })
      if (places.length === 0) return []
      const maxScore = Math.max(...places.map((p) => p.score))
      const threshold = maxScore / 2
      return places.filter((p) => p.score >= threshold).toSorted(byHotRank)
    },
  })
}
