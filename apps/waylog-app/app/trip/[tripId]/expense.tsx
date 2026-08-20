import { useTripId } from '../../../src/features/trip/useTripId'
import TripExpenseContent from '../../../src/features/trip/trip-expense/TripExpenseContent'

export default function TripDetailExpenseRoute() {
  const tripId = useTripId()

  return <TripExpenseContent tripId={tripId} />
}
