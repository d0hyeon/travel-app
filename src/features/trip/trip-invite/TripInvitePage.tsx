import { Box, Button, CircularProgress, Container, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { getTripByShareLink } from '../trip.api'
import { joinTrip } from '../trip-member/tripMember.api'
import type { Trip } from '../trip.types'

export default function TripInvitePage() {
  const { shareLink } = useParams<{ shareLink: string }>()
  const navigate = useNavigate()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!shareLink) return
    getTripByShareLink(shareLink)
      .then((t) => {
        if (!t) setError('유효하지 않은 초대 링크예요')
        else setTrip(t)
      })
      .catch(() => setError('초대 링크를 불러오지 못했어요'))
      .finally(() => setIsLoading(false))
  }, [shareLink])

  const handleJoin = async () => {
    if (!trip) return
    setIsJoining(true)
    try {
      await joinTrip(trip.id)
      navigate(`/trip/${trip.id}`, { replace: true })
    } catch {
      setError('참여에 실패했어요. 다시 시도해주세요')
      setIsJoining(false)
    }
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100dvh">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height="100dvh"
        gap={3}
        textAlign="center"
        px={3}
      >
        {error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <>
            <Box>
              <Typography variant="h6" fontWeight="bold" mb={1}>
                {trip?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {trip?.destination} · {trip?.startDate} ~ {trip?.endDate}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              이 여행에 참여하시겠어요?
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={handleJoin}
              disabled={isJoining}
              sx={{ width: 200 }}
            >
              {isJoining ? <CircularProgress size={20} /> : '참여하기'}
            </Button>
          </>
        )}
      </Box>
    </Container>
  )
}
