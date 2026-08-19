import { useEffect } from 'react'
import { generatePath, useNavigate } from 'react-router'
import { useTripChatOverlay } from './trip-chat/useTripChatOverlay'
import { useTripId } from './useTripId'
import TripDetailPage from './TripDetailPage'
import { AppRoute } from '~app/routes'

export default function TripChatPage() {
  const tripId = useTripId()
  const navigate = useNavigate()
  const { open } = useTripChatOverlay()

  useEffect(() => {
    open(tripId);
    navigate(generatePath(AppRoute.여행_상세, { tripId }), { replace: true })
  }, [])

  return <TripDetailPage />
}
