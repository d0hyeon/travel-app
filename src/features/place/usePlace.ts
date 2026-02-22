import { useSuspenseQuery } from "@tanstack/react-query"
import { getPlaceById, placeKey } from "./place.api"

export function usePlace(placeId: string) {
  return useSuspenseQuery({
    queryKey: usePlace.key(placeId),
    queryFn: () => getPlaceById(placeId),
  })
}

usePlace.key = (id: string) => [placeKey, id];