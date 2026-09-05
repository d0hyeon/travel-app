import { useInvitedTrip } from '@waylog/domains/modules/trip'
import { assert } from '@waylog/utility'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Suspense, useTransition } from 'react'
import { ErrorBoundary } from '@waylog/react'
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from '../../../shared/components/mui'
import { palette } from '../../../shared/config/tokens'

export function TripInviteScreen() {
  return (
    <Box
      sx={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        paddingHorizontal: 24,
        backgroundColor: palette.background,
      }}
    >
      <ErrorBoundary
        fallback={({ error }) => (
          <Typography sx={{ color: palette.error }} textAlign="center">
            {error.message}
          </Typography>
        )}
      >
        <Suspense fallback={<CircularProgress />}>
          <Resolved />
        </Suspense>
      </ErrorBoundary>
    </Box>
  )
}

function Resolved() {
  const router = useRouter()

  const { shareLink } = useLocalSearchParams<{ shareLink: string }>()
  assert(!!shareLink, '잘못된 접근입니다.')
  const { data: trip, join } = useInvitedTrip({ sharedLink: shareLink })

  const [isPending, startTransition] = useTransition()

  const handleJoin = () => {
    startTransition(async () => {
      await join()
      router.replace(`/trip/${trip.id}`)
    })
  }

  return (
    <>
      <Stack alignItems="center" gap={1}>
        <Typography variant="h6" textAlign="center">
          {trip.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          {trip.destinations.join(', ')} · {trip.startDate} ~ {trip.endDate}
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" textAlign="center">
        이 여행에 참여하시겠어요?
      </Typography>
      <Button
        variant="contained"
        size="large"
        onClick={handleJoin}
        loading={isPending}
        sx={{ width: 200 }}
      >
        참여하기
      </Button>
    </>
  )
}
