import { AppRoute as BaseAppRoute } from '@waylog/routes'
import { StyleSheet } from 'react-native'
import { AuthError } from '@waylog/domains/clients'
import { useInvitedTrip } from '@waylog/domains/modules/trip'
import { Suspense, useTransition } from 'react'
import { ErrorBoundary } from '@waylog/react'
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from '~/shared/components/design-system'
import { useAppNavigation, useAppRoute } from '../../../shared/hooks/useAppNavigation'
import { AppRoute } from '../../../app/AppRoute'
import { palette } from '../../../shared/config/tokens'

export type TripInviteParams = { shareLink: string }

declare module '~app/routes' {
  interface RouteParamsRegistry {
    [BaseAppRoute.여행_초대]: TripInviteParams
  }
}

export function TripInviteScreen() {
  return (
    <Box
      style={styles.screen}
    >
      <ErrorBoundary
        ignoreError={AuthError.isAuthError}
        fallback={({ error }) => (
          <Typography style={styles.errorMessage} textAlign="center">
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
  const navigation = useAppNavigation()

  const { params } = useAppRoute<typeof BaseAppRoute.여행_초대>()
  const { shareLink } = params
  const { data: trip, join } = useInvitedTrip({ sharedLink: shareLink })

  const [isPending, startTransition] = useTransition()

  const handleJoin = () => {
    startTransition(async () => {
      await join()
      navigation.replace(AppRoute.여행_상세, { tripId: trip.id })
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
        onPress={handleJoin}
        loading={isPending}
        style={styles.joinButton}
      >
        참여하기
      </Button>
    </>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, paddingHorizontal: 24, backgroundColor: palette.background },
  errorMessage: { color: palette.error },
  joinButton: { width: 200 },
})
