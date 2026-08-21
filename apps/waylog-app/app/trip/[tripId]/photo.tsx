import { useTripId } from '../../../src/features/trip/useTripId'
import { TripPhotoContent } from '../../../src/features/trip/trip-photo/TripPhotoContent'

export default function TripDetailPhotoRoute() {
  const tripId = useTripId()

  return <TripPhotoContent tripId={tripId} />
}
