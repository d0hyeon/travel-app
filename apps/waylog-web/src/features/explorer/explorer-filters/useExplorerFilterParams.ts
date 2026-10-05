import type { Location } from '@waylog/domains/modules/location'
import type { PlaceCategoryType } from '@waylog/domains/modules/place'
import { useQueryParamState } from '~shared/hooks/urls/useQueryParamState'
import { useScheduledTripDestinations } from '~features/trip/useScheduledTripDestinations'

export function useExplorerFilterParams() {
  const tripDefaultLocation = useScheduledTripDestinations().at(0)

  const [location, setLocation] = useQueryParamState<Location>('location', {
    defaultValue: tripDefaultLocation,
  })
  const [category, setCategory] = useQueryParamState<PlaceCategoryType>('category', {
    defaultValue: undefined,
  })

  return { location, setLocation, category, setCategory }
}
