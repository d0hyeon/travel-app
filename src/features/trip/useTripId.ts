import { useParams } from "react-router-dom"
import { assert } from "../../shared/lib/assert"

export function useTripId() {
  const { tripId } = useParams<{ tripId: string }>()
  assert(!!tripId, 'tripId is required')

  return tripId;
}