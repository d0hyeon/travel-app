import { Box, Typography } from '@mui/material'
import { AsyncBoundary } from '@waylog/react'
import { TopNavigation } from '~shared/components/layout/TopNavigation.mobile'
import { useTripId } from '../../useTripId'
import { TransportDetailContent } from './TransportDetailContent'
import { TransportDetailMenu } from './TransportDetailMenu'
import { useTransportId } from '../useTransportId'

export function TransportDetailPageMobile() {
  const tripId = useTripId()
  const transportId = useTransportId()

  return (
    <Box minHeight="100dvh" bgcolor="background.default" pt={`${TopNavigation.HEIGHT}px`}>
      <TopNavigation
        rightElement={
          <AsyncBoundary resetKeys={[tripId, transportId]} pendingFallback={null} rejectedFallback={() => null}>
            <TransportDetailMenu tripId={tripId} transportId={transportId} />
          </AsyncBoundary>
        }
      >
        <Typography fontSize={16} fontWeight={700}>탑승권 상세</Typography>
      </TopNavigation>
      <TransportDetailContent tripId={tripId} transportId={transportId} p={2.5} />
    </Box>
  )
}
