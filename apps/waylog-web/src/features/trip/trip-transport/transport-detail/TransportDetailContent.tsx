import { Stack, type StackProps } from '@mui/material'
import { Suspense } from 'react'
import { PushNotificationCard } from '~features/auth/PushNotificationCard'
import { TransportDirectionsAction } from '../TransportDirectionsAction'
import { TransportOperationalInfoSection } from '../TransportOperationalInfoSection'
import { TransportRealtimeInfoSection } from '../TransportRealtimeInfoSection'
import { TransportSummarySection } from '../TransportSummarySection'
import { TransportTicketsSection } from '../transport-ticket/TransportTicketsSection'

interface Props extends StackProps {
  tripId: string
  transportId: string
}

export function TransportDetailContent({ tripId, transportId, ...props }: Props) {
  return (
    <Stack gap={1.5} {...props}>
      <Suspense>
        <PushNotificationCard />
      </Suspense>
      <TransportSummarySection tripId={tripId} transportId={transportId} />
      <TransportRealtimeInfoSection tripId={tripId} transportId={transportId} />
      <TransportOperationalInfoSection tripId={tripId} transportId={transportId} />
      <TransportTicketsSection tripId={tripId} transportId={transportId} />
      <TransportDirectionsAction tripId={tripId} transportId={transportId} />
    </Stack>
  )
}
