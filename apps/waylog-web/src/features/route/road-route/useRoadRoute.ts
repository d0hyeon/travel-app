import { clientDatabase } from '~app/client-database';
import { useQuery } from '@waylog/react';
import { isOverseasByCoordinate } from '@waylog/domains/utils';
import type { Coordinate } from '../../../shared/components/Map/types';
import type { RoadRoute } from '@waylog/domains/route';
import { getRoadDirections } from './roadRoute.api';
import { keepPreviousData } from '@tanstack/react-query';

interface UseDirectionsOptions {
  waypoints: Coordinate[];
  suspense?: boolean;
}

export function useRoadRoute({ waypoints, suspense = true }: UseDirectionsOptions) {
  const serialized = waypoints?.map((p) => `${p.lat},${p.lng}`).join('|');

  const query =  useQuery({
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
    placeholderData: keepPreviousData,
    suspense,
  });

  return { ...query, data: query.data ?? { coordinates: waypoints, legs: []}  }
}
