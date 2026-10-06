import { useSuspenseQuery } from "@tanstack/react-query"
import { useMemo } from 'react'
import { Country, getCountryByLocation, isLocation, type Location } from '@waylog/domains/modules/location'
import { useTrips } from '@waylog/domains/modules/trip'
import { getAllTripPlaces, placeKey } from '@waylog/domains/modules/place'
import { getAllRoutes, routeKey } from "@waylog/domains/modules/route"

export interface VisitedLocation {
  id: string
  location: Location
  count: number
}

export function useVisitedPlaces(tripIds?: string[]) {
  const { data: trips } = useTrips()
  const { data, ...placesQuery } = useSuspenseQuery({
    queryKey: [placeKey, routeKey, 'confirmed-all'],
    queryFn: async () => {
      const [places, routes] = await Promise.all([getAllTripPlaces(), getAllRoutes()])
      const confirmedPlaceIds = new Set(routes.flatMap((route) => route.placeIds))
  
    
      return places.filter((place) => confirmedPlaceIds.has(place.id))
    },
  })
  

  const filteredTrips = useMemo(
    () => (
      !tripIds || tripIds.length === 0
        ? trips
        : trips.filter((trip) => tripIds.includes(trip.id))
    ),
    [tripIds, trips],
  )

  const filteredPlaces = useMemo(
    () => (
      !tripIds || tripIds.length === 0
        ? data
        : data.filter((place) => tripIds.includes(place.tripId))
    ),
    [data, tripIds],
  )

  const countries = useMemo(() => {
    const countMap: Partial<Record<Country, number>> = {}

    filteredTrips.forEach((trip) => {
      const countries = new Set(trip.destinations
        .map(destination => getCountryByLocation(destination))
        .filter(country => country != null)
      )

      countries.forEach((country) => {
        countMap[country] = (countMap[country] ?? 0) + 1
      });
    })

    return countMap
  }, [filteredTrips])

  const locations = useMemo(() => {
    const visitMap = new globalThis.Map<string, VisitedLocation>()

    filteredTrips.forEach((trip) => {
      trip.destinations.forEach(destination => {
        if (!isLocation(destination)) return

        const current = visitMap.get(destination)
        if (current) {
          current.count += 1
          return
        }

        visitMap.set(destination, {
          id: destination,
          location: destination,
          count: 1,
        })
      })
      
    })

    return [...visitMap.values()]
  }, [filteredTrips])

  return {
    data: { places: filteredPlaces, countries, locations },
    ...placesQuery,
  }
}
