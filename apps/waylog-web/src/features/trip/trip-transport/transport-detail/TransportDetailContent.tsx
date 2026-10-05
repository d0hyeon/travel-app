import { Box, Stack, type StackProps } from '@mui/material'
import { Suspense } from 'react'
import { PushNotificationCard } from '~features/auth/PushNotificationCard'
import { TransportDirectionsAction } from '../TransportDirectionsAction'
import { TransportOperationalInfoSection } from '../TransportOperationalInfoSection'
import { TransportRealtimeInfoSection } from '../TransportRealtimeInfoSection'
import { TransportSummarySection } from '../TransportSummarySection'
import { TransportTicketsSection } from '../transport-ticket/TransportTicketsSection'
import { AirportArrivalGuidanceSection } from '../AirportArrivalGuidanceSection'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'

interface Props extends StackProps {
  tripId: string
  transportId: string
}

export function TransportDetailContent({ tripId, transportId, ...props }: Props) {
  const isMobile = useIsMobile();
  return (
    <Stack gap={1.5} {...props}>
      <Box marginX={isMobile ? -2 : 0}>
        <Suspense>
          <PushNotificationCard margin={2} />
        </Suspense>
      </Box>
      <TransportSummarySection tripId={tripId} transportId={transportId} />
      <TransportRealtimeInfoSection tripId={tripId} transportId={transportId} />
      <AirportArrivalGuidanceSection tripId={tripId} transportId={transportId} />
      <TransportOperationalInfoSection tripId={tripId} transportId={transportId} />
      <TransportTicketsSection tripId={tripId} transportId={transportId} />
      <TransportDirectionsAction tripId={tripId} transportId={transportId} />
    </Stack>
  )
}
