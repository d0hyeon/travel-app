import { useLocalSearchParams } from 'expo-router'
import { TripExpenseContent } from '../../../src/features/trip/trip-expense/TripExpenseContent'

export default function TripDetailExpenseRoute() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>()

  return <TripExpenseContent tripId={tripId} />
}
