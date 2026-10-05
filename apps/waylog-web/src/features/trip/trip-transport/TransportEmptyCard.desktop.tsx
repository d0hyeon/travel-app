import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Box, Stack, Typography } from '@mui/material'
import { DOMESTIC_CONGESTION_AIRPORT_CODES } from '@waylog/domains/modules/airport-arrival-guidance'
import { useAirports } from '@waylog/domains/modules/airport'
import { getSupportedFlightStatusAirportCodes } from '@waylog/domains/modules/flight-status'
import { useOverlay } from '~shared/hooks/useOverlay'
import { SupportedNotificationDialog } from './SupportedNotificationDialog.desktop'

export function TransportEmptyCard() {
  return (
    <Stack gap={1.5} >
      <Stack alignItems="center" gap={0.75} py={4.5} border="1px dashed" borderColor="divider" borderRadius={3} bgcolor="action.hover" paddingX={2}>
        <Typography variant="subtitle1" fontWeight={700}>
          등록된 탑승권이 없어요
        </Typography>
        <Typography variant="body2" color="text.secondary">
          등록하면 여정 변동(지연, 결항, 탑승구 변경), 공항 도착 권장시간, 탑승 안내를 알려드려요
        </Typography>
      </Stack>
      <SupportedNotificationLink />
    </Stack>
  )
}

function SupportedNotificationLink() {
  const overlay = useOverlay()
  const { data: airports } = useAirports()

  const toAirportNames = (airportCodes: readonly string[]) =>
    airportCodes
      .map((airportCode) => airports.find((airport) => airport.code === airportCode)?.nameKo)
      .filter((airportName): airportName is string => airportName != null)
      .map((airportName) => airportName.replace(/(국제)?공항$/, ''))

  const openSupportedNotification = () => {
    overlay.open(({ isOpen, close }) => (
      <SupportedNotificationDialog
        isOpen={isOpen}
        onClose={close}
        flightStatusAirportNames={toAirportNames(getSupportedFlightStatusAirportCodes())}
        guidanceAirportNames={toAirportNames(DOMESTIC_CONGESTION_AIRPORT_CODES)}
      />
    ))
  }

  return (
    <Box display="flex" justifyContent="flex-end">
      <Stack direction="row" alignItems="center" onClick={openSupportedNotification} sx={{ cursor: 'pointer' }}>
        <Typography variant="caption" color="text.disabled">
          자세히 보기
        </Typography>
        <ChevronRightIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
      </Stack>
    </Box>
  )
}
