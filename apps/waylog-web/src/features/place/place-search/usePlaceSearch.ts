import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { Coordinate } from '@waylog/domains/utils'
import type { MapType } from '../../../shared/components/Map/types'
import { searchPlaces } from './placeSearch.api'

export type { PlaceResult } from './placeSearch.api'

interface PageParam {
  page: number
  pageToken?: string
}

interface UsePlaceSearchOptions {
  service: MapType
  location?: Coordinate
  keyword?: string
}

export function usePlaceSearch({ service, keyword, location }: UsePlaceSearchOptions) {
  const provider = service === 'google' ? 'google' : 'kakao'

  const { data, isFetchingNextPage, hasNextPage, fetchNextPage, isLoading, error } =
    useInfiniteQuery({
      queryKey: ['place-search', keyword, location?.lat, location?.lng, provider] as const,
      queryFn: ({ pageParam }: { pageParam: PageParam }) =>
        searchPlaces({ keyword: keyword!, provider, page: pageParam.page, location, pageToken: pageParam.pageToken }),
      getNextPageParam: (lastPage, _, lastPageParam: PageParam) => {
        if (lastPage.isEnd) return undefined
        return { page: lastPageParam.page + 1, pageToken: lastPage.nextPageToken }
      },
      initialPageParam: { page: 1 } as PageParam,
      enabled: !!keyword,
    })

  const results = useMemo(() => data?.pages.flatMap((p) => p.results) ?? [], [data])

  return { data: results, isLoading, isFetchingNextPage, hasNextPage, error, fetchNextPage }
}
