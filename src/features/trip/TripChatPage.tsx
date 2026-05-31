import { useEffect } from 'react'
import { useTripChatOverlay } from './trip-chat/TripChatOverlay'
import { useTripId } from './useTripId'
import TripDetailPage from './TripDetailPage'

export default function TripChatPage() {
  const tripId = useTripId()
  const { open } = useTripChatOverlay()

  useEffect(() => {
    open(tripId)
  }, [])

  return <TripDetailPage />
}
