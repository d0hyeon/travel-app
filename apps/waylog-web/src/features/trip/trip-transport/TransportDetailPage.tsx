import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Box, Container, IconButton, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router'
import { useTripId } from '../useTripId'
import { TransportDirectionsAction } from './transport-detail/TransportDirectionsAction'
import { TransportOperationalInfoSection } from './transport-detail/TransportOperationalInfoSection'
import { TransportRealtimeInfoSection } from './transport-detail/TransportRealtimeInfoSection'
import { TransportSummarySection } from './transport-detail/TransportSummarySection'
import { TransportTicketsSection } from './transport-detail/TransportTicketsSection'
import { useTransportId } from './useTransportId'

export default function TransportDetailPage() {
  const navigate = useNavigate()
  const tripId = useTripId()
  const transportId = useTransportId()

  return (
    <Box minHeight="100dvh" bgcolor="background.default">
      <Container
        maxWidth="sm"
        disableGutters
        sx={{ bgcolor: 'background.paper', minHeight: '100dvh' }}
      >
        <Stack
          direction="row"
          alignItems="center"
          px={2}
          height={64}
          borderBottom="1px solid"
          borderColor="divider"
        >
          <IconButton aria-label="뒤로가기" onClick={() => navigate(-1)}>
            <ArrowBackIcon />
          </IconButton>
          <Typography fontSize={18} fontWeight={700} flex={1}>
            탑승권 상세
          </Typography>
        </Stack>

        <Stack p={2.5} gap={1.5}>
          <TransportSummarySection tripId={tripId} transportId={transportId} />
          <TransportRealtimeInfoSection tripId={tripId} transportId={transportId} />
          <TransportOperationalInfoSection tripId={tripId} transportId={transportId} />
          <TransportTicketsSection tripId={tripId} transportId={transportId} />
          <TransportDirectionsAction tripId={tripId} transportId={transportId} />
        </Stack>
      </Container>
    </Box>
  )
}
