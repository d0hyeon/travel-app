import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useRef } from 'react';
import { type Coordinate } from '~shared/model/coordinate.model';
import { assert } from '~shared/utils/types';
import { loadGoogleMaps } from '../../../shared/components/Map/google/loader';
import { loadKakaoMap } from '../../../shared/components/Map/kakao/loader';
import type { MapType } from '../../../shared/components/Map/types';
import { use } from 'react';

export interface PlaceResult {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

interface PageResult {
  results: PlaceResult[];
  isEnd: boolean;
}

interface UsePlaceSearchOptions {
  type: MapType;
  location?: Coordinate;
  keyword?: string;
}


export function usePlaceSearch({ type, keyword, location }: UsePlaceSearchOptions) {
  use(type === 'google' ? loadGoogleMaps() : loadKakaoMap());

  const div = useMemo(() => document.createElement('div'), []);
  const kakaoServiceRef = useRef(type === 'kakao' ? new kakao.maps.services.Places() : null);
  const googleServiceRef = useRef(type === 'google' ? new google.maps.places.PlacesService(div) : null);

  const googlePaginationRef = useRef<google.maps.places.PlaceSearchPagination | null>(null);
  const googleSessionRef = useRef(0);
  const googleResolverRef = useRef<((r: PageResult) => void) | null>(null);
  const googleRejectorRef = useRef<((e: unknown) => void) | null>(null);

  // stableGoogleCallback은 textSearch에 한 번 전달되면 nextPage()도 이 함수를 재호출한다.
  // 각 페이지의 resolve/reject는 ref를 통해 교체되며, session ID로 stale 콜백을 무시한다.
  const stableGoogleCallback = useCallback(
    (
      results: google.maps.places.PlaceResult[] | null,
      status: google.maps.places.PlacesServiceStatus,
      pagination: google.maps.places.PlaceSearchPagination | null
    ) => {
      googlePaginationRef.current = pagination;
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        googleResolverRef.current?.({
          results: results.map((item) => ({
            id: item.place_id ?? crypto.randomUUID(),
            name: item.name ?? '',
            address: item.formatted_address ?? '',
            lat: item.geometry?.location?.lat() ?? 0,
            lng: item.geometry?.location?.lng() ?? 0,
          })),
          isEnd: !pagination?.hasNextPage,
        });
      } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        googleResolverRef.current?.({ results: [], isEnd: true });
      } else {
        googleRejectorRef.current?.(new Error(status));
      }
    },
    []
  );

  const searchKakao = (query: string, page: number): Promise<PageResult> => {
    const service = kakaoServiceRef.current;
    assert(!!service, '잘못된 호출입니다.');

    return new Promise<PageResult>((resolve, reject) => {
      const options: kakao.maps.services.PlacesSearchOptions = {
        ...(location ? { location: new kakao.maps.LatLng(location.lat, location.lng) } : {}),
        page,
      };
      service.keywordSearch(query, (data, status, pagination) => {
        if (status === kakao.maps.services.Status.ERROR) {
          return reject(new Error('검색 중 오류가 발생했습니다.'));
        }
        if (status === kakao.maps.services.Status.ZERO_RESULT) {
          return resolve({ results: [], isEnd: true });
        }
        resolve({
          results: data.map((item) => ({
            id: item.id,
            name: item.place_name,
            address: item.road_address_name || item.address_name,
            lat: parseFloat(item.y),
            lng: parseFloat(item.x),
          })),
          isEnd: !pagination.hasNextPage,
        });
      }, options);
    });
  };

  const searchGoogle = (query: string, page: number): Promise<PageResult> => {
    const service = googleServiceRef.current;
    assert(!!service, '잘못된 호출입니다.');

    if (page === 1) {
      googleSessionRef.current += 1;
      googlePaginationRef.current = null;
    }
    const session = googleSessionRef.current;

    return new Promise<PageResult>((resolve, reject) => {
      // session ID로 감싸 stale 콜백이 현재 쿼리를 오염시키지 않도록 한다.
      googleResolverRef.current = (result) => {
        if (googleSessionRef.current === session) resolve(result);
      };
      googleRejectorRef.current = (err) => {
        if (googleSessionRef.current === session) reject(err);
      };

      if (page > 1 && googlePaginationRef.current?.hasNextPage) {
        googlePaginationRef.current.nextPage();
      } else {
        const request: google.maps.places.TextSearchRequest = {
          query,
          language: 'ko',
          location,
        };
        service.textSearch(request, stableGoogleCallback);
      }
    });
  };

  const { data, isFetchingNextPage, hasNextPage, fetchNextPage, isLoading, error } = useInfiniteQuery({
    queryKey: ['place-search', keyword, location?.lat, location?.lng],
    queryFn: ({ pageParam }) => {
      if (type === 'google') return searchGoogle(keyword!, pageParam);
      return searchKakao(keyword!, pageParam);
    },
    getNextPageParam: (lastPage, _, lastPageParam) =>
      lastPage.isEnd ? undefined : lastPageParam + 1,
    initialPageParam: 1,
    enabled: !!keyword,
  });

  const results = data?.pages.flatMap((p) => p.results) ?? [];

  return { data: results, isLoading, isFetchingNextPage, hasNextPage, error, fetchNextPage };
}
