import { useTripId } from '../../../src/features/trip/useTripId'
import TripPlaceContent from '../../../src/features/trip/trip-place/TripPlaceContent'

export default function TripDetailPlaceRoute() {
  const tripId = useTripId()

  return <TripPlaceContent tripId={tripId} />
}
