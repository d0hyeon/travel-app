import { useMemo } from 'react'
import { useTrips } from '@waylog/domains/modules/trip'
import { isLocation, type Location } from '@waylog/domains/modules/location'
import { PlaceCategoryTypes, type PlaceCategoryType } from '@waylog/domains/modules/place'
import { useQueryParamState } from '../../shared/hooks/useQueryParamState'

export function useExplorerFilterParams() {
  const { data: trips } = useTrips()
  const defaultLocation = useMemo(() => {
    const today = new Date().toISOString().split('T')[0] ?? ''
    const scheduledTrip = trips
      .filter((trip) => trip.endDate >= today)
      .toSorted((first, second) => first.startDate.localeCompare(second.startDate))[0]

    return scheduledTrip?.destinations.find(isLocation)
  }, [trips])
  const [location, setLocation] = useQueryParamState<Location | undefined>('location', {
    defaultValue: defaultLocation,
    parse: parseLocation,
  })
  const [category, setCategory] = useQueryParamState<PlaceCategoryType | undefined>('category', {
    defaultValue: undefined,
    parse: parseCategory,
  })

  return { location, setLocation, category, setCategory }
}

function parseLocation(value: string): Location | undefined {
  return isLocation(value) ? value : undefined
}

function parseCategory(value: string): PlaceCategoryType | undefined {
  return PlaceCategoryTypes.find((category) => category === value)
}
