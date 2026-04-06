import { useSuspenseQuery } from "@tanstack/react-query"
import { getAllPlaces, placeKey } from "../place/place.api"
import { getAllRoutes, routeKey } from "../route/route.api"

export function useAllPlaces() {
  return useSuspenseQuery({
    queryKey: [placeKey, routeKey, 'confirmed-all'],
    queryFn: async () => {
      const [places, routes] = await Promise.all([getAllPlaces(), getAllRoutes()])
      const confirmedPlaceIds = new Set(routes.flatMap((route) => route.placeIds))

      return places.filter((place) => confirmedPlaceIds.has(place.id))
    },
  })
}
