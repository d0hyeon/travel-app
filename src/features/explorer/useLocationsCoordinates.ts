import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { Location } from '~features/location'
import {
  getLocationCoordinates,
  type Coordinate,
  type LocationCoordinateLevel,
} from '~shared/components/Map'

interface UseLocationsCoordinatesItem {
  id: string
  location: Location
}

export function useLocationsCoordinates(
  items: UseLocationsCoordinatesItem[],
  level: LocationCoordinateLevel = 'auto',
) {
  const uniqueItems = useMemo(
    () => [...new globalThis.Map(items.map((item) => [item.id, item])).values()],
    [items],
  )

  return useQuery<Record<string, Coordinate[][]>>({
    queryKey: ['place-explorer', 'location-coordinates', level, uniqueItems],
    enabled: uniqueItems.length > 0,
    staleTime: Infinity,
    queryFn: async () => {
      const polygons = await Promise.all(
        uniqueItems.map(async (item) => {
          const coordinates = await getLocationCoordinates({
            location: item.location,
            level,
          })
          return coordinates ? ({ id: item.id, coordinates }) : null
        }),
      )

      return polygons.reduce<Record<string, Coordinate[][]>>((result, polygon) => {
        if (!polygon) return result
        result[polygon.id] = polygon.coordinates
        return result
      }, {})
    },
  })
}
