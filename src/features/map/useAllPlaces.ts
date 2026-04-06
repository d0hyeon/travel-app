import { useSuspenseQuery } from "@tanstack/react-query"
import { getAllPlaces, placeKey } from "../place/place.api"

export function useAllPlaces() {
  return useSuspenseQuery({
    queryKey: [placeKey, 'all'],
    queryFn: getAllPlaces,
  })
}
