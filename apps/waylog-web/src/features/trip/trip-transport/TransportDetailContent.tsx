import { Stack, type StackProps } from '@mui/material'
import { TransportDirectionsAction } from './transport-detail/TransportDirectionsAction'
import { TransportOperationalInfoSection } from './transport-detail/TransportOperationalInfoSection'
import { TransportRealtimeInfoSection } from './transport-detail/TransportRealtimeInfoSection'
import { TransportSummarySection } from './transport-detail/TransportSummarySection'
import { TransportTicketsSection } from './transport-detail/TransportTicketsSection'

interface Props extends StackProps {
  tripId: string
  transportId: string
}

export function TransportDetailContent({ tripId, transportId, ...props }: Props) {
  return (
    <Stack gap={1.5} {...props}>
      <TransportSummarySection tripId={tripId} transportId={transportId} />
      <TransportRealtimeInfoSection tripId={tripId} transportId={transportId} />
      <TransportOperationalInfoSection tripId={tripId} transportId={transportId} />
      <TransportTicketsSection tripId={tripId} transportId={transportId} />
      <TransportDirectionsAction tripId={tripId} transportId={transportId} />
    </Stack>
  )
}
