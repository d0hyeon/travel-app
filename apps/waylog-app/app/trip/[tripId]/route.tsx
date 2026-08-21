import { useTripId } from '../../../src/features/trip/useTripId'
import TripRoutesContent from '../../../src/features/trip/trip-route/TripRoutesContent'

export default function TripDetailRouteRoute() {
  const tripId = useTripId()

  return <TripRoutesContent tripId={tripId} />
}
