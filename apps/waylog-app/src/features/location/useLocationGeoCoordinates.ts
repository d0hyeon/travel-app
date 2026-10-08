import { useQueries, UseQueryOptions } from "@tanstack/react-query";
import { Location } from "@waylog/domains/modules/location";
import { getLocationCoordinates } from "~shared/components/Map/getLocationCoordinates";


export function useLocationGeoCoordinates(location: Location | Location[]) {
  const locations = Array.isArray(location) ? location : [location];

  const shapeRingQueries = useQueries({
    queries: locations.map((location) => ({
      queryKey: ['location-coordinates', location],
      queryFn: () => getLocationCoordinates({ location }),
      enabled: locations.length > 0,
      throwOnError: false
    } satisfies UseQueryOptions)),
  })

  return shapeRingQueries.map(x => x.data).filter(x => x != null);
}