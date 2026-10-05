import { useParams } from "react-router"
import { assert } from '@waylog/utility'

export function useTripId() {
  const { tripId } = useParams<{ tripId: string }>()
  assert(!!tripId, 'tripId is required')

  return tripId;
}