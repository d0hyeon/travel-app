import { Box, Button, CircularProgress, Container, Typography } from '@mui/material'
import { Suspense } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ErrorBoundary } from '~shared/components/ErrorBoundary'
import { assert } from '~shared/utils/assert'
import { useInvitedTrip } from './useInvitedTrip'

export default function TripInvitePage() {

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
        <ErrorBoundary fallback={({ error }) => <Typography color="error">{error.message}</Typography>}>
          <Suspense
            fallback={(
              <Box display="flex" justifyContent="center" alignItems="center" height="100dvh">
                <CircularProgress />
              </Box>
            )}
          >
            <Resolved />
          </Suspense>
        </ErrorBoundary>
      </Box>
    </Container>
  )
}

function Resolved() {
  const navigate = useNavigate()

  const { shareLink } = useParams<{ shareLink: string }>()
  assert(!!shareLink, '잘못된 접근입니다.');
  const { data: trip, join } = useInvitedTrip({ sharedLink: shareLink })

  const handleJoin = async () => {
    await join()
    navigate(`/trip/${trip.id}`, { replace: true })
  }

  return (
    <>
      <Box>
        <Typography variant="h6" fontWeight="bold" mb={1}>
          {trip.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {trip.destination} · {trip.startDate} ~ {trip.endDate}
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary">
        이 여행에 참여하시겠어요?
      </Typography>
      <Button
        variant="contained"
        size="large"
        onClick={handleJoin}
        disabled={join.isPending}
        loading={join.isPending}
        loadingPosition="start"
        sx={{ width: 200 }}
      >
        참여하기
      </Button>
    </>
  )
}
