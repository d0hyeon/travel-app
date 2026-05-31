import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useTripChatOverlay } from './trip-chat/TripChatOverlay'
import { useTripId } from './useTripId'
import TripDetailPage from './TripDetailPage'
import { AppRoute } from '~/app/routes'

export default function TripChatPage() {
  const tripId = useTripId()
  const navigate = useNavigate()
  const { open } = useTripChatOverlay()

  useEffect(() => {
    open(tripId)
    navigate(AppRoute.여행_상세.replace(':tripId', tripId), { replace: true })
  }, [])

  return <TripDetailPage />
}
