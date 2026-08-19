import { useParams } from "react-router"
import { assert } from '@waylog/domains/utils'

export function useTripId() {
  const { tripId } = useParams<{ tripId: string }>()
  assert(!!tripId, 'tripId is required')

  return tripId;
}