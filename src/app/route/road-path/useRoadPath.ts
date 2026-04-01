import { useSuspenseQuery } from '@tanstack/react-query';
import { database } from '~app/database';
import { isOverseasByCoordinate } from '~shared/utils/geo';
import type { Coordinate } from '../../../shared/components/Map/types';
import { getGlobalRoadDirections, getRoadDirections } from './roadPath.api';

interface UseDirectionsOptions {
  waypoints: Coordinate[];
}

/**
 * 도로 기반 경로 좌표를 가져오는 hook
 * type에 따라 카카오 모빌리티 또는 Google Directions API 사용
 */
export function useRoadPath({ waypoints }: UseDirectionsOptions) {
  const serialized = waypoints?.map((p) => `${p.lat},${p.lng}`).join('|');

  const { data } = useSuspenseQuery({
    queryKey: ['directions', serialized],
    queryFn: async () => {
      if (waypoints.length < 2) return waypoints;
      
      const localData = await database.roadPaths.get(serialized!);
      const isOverseas = waypoints?.some(x => isOverseasByCoordinate(x.lat, x.lng));

      if (localData == null) {
        const coordinates = isOverseas
          ? await getGlobalRoadDirections(waypoints!)
          : await getRoadDirections(waypoints!);
        
        database.roadPaths.add({ key: serialized!, coordinates });

        return coordinates;
      }

      return localData.coordinates;
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
    refetchInterval: false,
    refetchOnMount: false,
  });

  return data ?? waypoints;
}

