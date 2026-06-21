import { useSuspenseQuery } from '@tanstack/react-query';
import { clientDatabase } from '~app/client-database';
import { isOverseasByCoordinate } from '~shared/utils/geo';
import type { Coordinate } from '../../../shared/components/Map/types';
import type { RoadRoute } from '../route.types';
import { getRoadDirections } from './roadRoute.api';

interface UseDirectionsOptions {
  waypoints: Coordinate[];
}

export function useRoadRoute({ waypoints }: UseDirectionsOptions): RoadRoute {
  const serialized = waypoints?.map((p) => `${p.lat},${p.lng}`).join('|');

  const { data } = useSuspenseQuery({
    queryKey: ['directions', serialized],
    queryFn: async (): Promise<RoadRoute> => {
      const localData = await clientDatabase.roadRoutes.get(serialized);

      if (localData != null) {
        return { coordinates: localData.coordinates, legs: localData.legs ?? [] };
      }

      const region = waypoints?.some(x => isOverseasByCoordinate(x.lat, x.lng)) ? 'global' : 'korea';
      const roadRoute = await getRoadDirections(waypoints!, region);

      clientDatabase.roadRoutes.add({ key: serialized!, ...roadRoute });

      return roadRoute;
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
    refetchInterval: false,
    refetchOnMount: false,
  });

  return data ?? { coordinates: waypoints, legs: [] };
}
