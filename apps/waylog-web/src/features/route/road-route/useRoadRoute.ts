import { clientDatabase } from '~app/client-database';
import { useQuery } from '@waylog/react';
import { isOverseasByCoordinate } from '@waylog/utility';
import type { Coordinate } from '../../../shared/components/Map/types';
import type { RoadRoute } from '@waylog/domains/modules/route';
import { getRoadDirections } from '@waylog/domains/modules/route';
import { keepPreviousData } from '@tanstack/react-query';

interface UseDirectionsOptions {
  waypoints: Coordinate[];
  /** 교통 구간의 경계. 이 인덱스와 다음 인덱스 사이는 도로로 잇지 않는다. */
  breakIndices?: number[];
  suspense?: boolean;
}

export function useRoadRoute({ waypoints, breakIndices, suspense = true }: UseDirectionsOptions) {
  const serialized = waypoints?.map((p) => `${p.lat},${p.lng}`).join('|');
  // 같은 좌표라도 경계가 다르면 다른 경로다.
  const cacheKey = breakIndices?.length ? `${serialized}#${breakIndices.join(',')}` : serialized;

  const query =  useQuery({
    queryKey: ['directions', cacheKey],
    queryFn: async (): Promise<RoadRoute> => {
      const localData = await clientDatabase.roadRoutes.get(cacheKey);

      if (localData != null) {
        return { coordinates: localData.coordinates, legs: localData.legs ?? [] };
      }

      const region = waypoints?.some(x => isOverseasByCoordinate(x.lat, x.lng)) ? 'global' : 'korea';
      const roadRoute = await getRoadDirections(waypoints!, region, breakIndices);

      clientDatabase.roadRoutes.add({ key: cacheKey!, ...roadRoute });

      return roadRoute;
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
    refetchInterval: false,
    refetchOnMount: false,
    placeholderData: keepPreviousData,
    suspense,
  });

  return { ...query, data: query.data ?? { coordinates: waypoints, legs: []}  }
}
