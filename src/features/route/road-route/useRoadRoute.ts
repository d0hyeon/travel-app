import { useSuspenseQuery } from '@tanstack/react-query';
import { clientDatabase } from '~features/route/road-route/client-database';
import { isOverseasByCoordinate } from '~shared/utils/geo';
import type { Coordinate } from '../../../shared/components/Map/types';
import { getRoadDirections } from './roadRoute.api';

interface UseDirectionsOptions {
  waypoints: Coordinate[];
}

export function useRoadRoute({ waypoints }: UseDirectionsOptions) {
  const serialized = waypoints?.map((p) => `${p.lat},${p.lng}`).join('|');

  const { data } = useSuspenseQuery({
    queryKey: ['directions', serialized],
    queryFn: async () => {
      const localData = await clientDatabase.roadRoutes.get(serialized);

      if (localData == null) {
        const region = waypoints?.some(x => isOverseasByCoordinate(x.lat, x.lng)) ? 'global' : 'korea';
        const coordinates = await getRoadDirections(waypoints!, region);

        clientDatabase.roadRoutes.add({ key: serialized!, coordinates });

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
