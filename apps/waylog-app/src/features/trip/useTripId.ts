import { assert } from '@waylog/utility'
import { useTripDetailTabRoute } from '../../shared/hooks/useAppNavigation'

/** TripDetail 탭(정보/장소/계획/정산/사진) 내부에서만 쓴다. */
export function useTripDetailTabTripId() {
  const { params } = useTripDetailTabRoute()
  assert(!!params?.tripId, 'tripId is required')

  return params.tripId
}
