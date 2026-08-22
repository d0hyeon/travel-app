import { useInvitedTrip } from '@waylog/domains/trip'
import { assert } from '@waylog/utility'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Suspense, useTransition } from 'react'
import { ErrorBoundary } from '../../../shared/components/ErrorBoundary'
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
        fallback={
          <Typography sx={{ color: '#d32f2f' }} textAlign="center">
            유효하지 않은 초대입니다.
          </Typography>
        }
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
        disabled={isPending}
        sx={{ width: 200 }}
      >
        참여하기
      </Button>
    </>
  )
}
