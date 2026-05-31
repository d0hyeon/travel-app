import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useTripChatOverlay } from './trip-chat/TripChatOverlay'
import { useTripId } from './useTripId'
import TripDetailPage from './TripDetailPage'

export default function TripChatPage() {
  const tripId = useTripId()
  const navigate = useNavigate()
  const { open } = useTripChatOverlay()

  useEffect(() => {
    open(tripId)
    navigate(`/trip/${tripId}`, { replace: true })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <TripDetailPage />
}
