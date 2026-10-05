import AccessTimeIcon from '@mui/icons-material/AccessTime'
import AddIcon from '@mui/icons-material/Add'
import CheckIcon from '@mui/icons-material/Check'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff'
import PriorityHighIcon from '@mui/icons-material/PriorityHigh'
import { Box, Button, Divider, Stack, Typography } from '@mui/material'
import { DOMESTIC_CONGESTION_AIRPORT_CODES } from '@waylog/domains/modules/airport-arrival-guidance'
import { useAirports } from '@waylog/domains/modules/airport'
import { getSupportedFlightStatusAirportCodes } from '@waylog/domains/modules/flight-status'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useOverlay } from '~shared/hooks/useOverlay'
import { SupportedNotificationSheet } from './SupportedNotificationSheet.mobile'

const BenefitTint = { primary: '#EEF2FF', error: '#FFEBEE', success: '#E5F8EF' } as const

interface Props {
  tripId: string
}

export function TransportEmptyCard({ tripId }: Props) {
  const navigate = useNavigate()

  return (
    <Stack alignItems="center" p={3} gap={1.5} border="1px solid" borderColor="divider" borderRadius={4} bgcolor={BenefitTint.primary}>
      <Box display="flex" alignItems="center" justifyContent="center" width={56} height={56} borderRadius="50%" bgcolor="background.paper">
        <FlightTakeoffIcon color="primary" />
      </Box>
      <Stack alignItems="center" gap={0.5} mb={1} width="100%">
        <Typography variant="h6">탑승권을 등록해보세요</Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          중요한 상황을 놓치지 않도록 알려드려요
        </Typography>
        <Stack gap={1} width="100%" mt={1.5} p={1.5} borderRadius={4} bgcolor="background.paper">
          <Benefit icon={<PriorityHighIcon sx={{ fontSize: 14, color: 'error.main' }} />} tint={BenefitTint.error}>
            <Typography variant="subtitle2">여정 변동 안내</Typography>
            <Typography variant="caption" color="text.disabled">지연, 결항, 탑승구 변경</Typography>
          </Benefit>
          <Divider />
          <Benefit icon={<AccessTimeIcon sx={{ fontSize: 14, color: 'primary.main' }} />} tint={BenefitTint.primary}>
            <Typography variant="subtitle2">공항 도착 권장시간 안내</Typography>
          </Benefit>
          <Divider />
          <Benefit icon={<CheckIcon sx={{ fontSize: 14, color: 'success.main' }} />} tint={BenefitTint.success}>
            <Typography variant="subtitle2">탑승 안내</Typography>
          </Benefit>
        </Stack>
      </Stack>
      <Button fullWidth size="large" variant="contained" startIcon={<AddIcon />} onClick={() => navigate(`/trip/${tripId}/transport/new`)}>
        탑승권 등록
      </Button>
      <SupportedNotificationButton />
    </Stack>
  )
}

interface BenefitProps {
  icon: ReactNode
  tint: string
  children: ReactNode
}

function Benefit({ icon, tint, children }: BenefitProps) {
  return (
    <Stack direction="row" alignItems="center" gap={1} minHeight={36}>
      <Box display="flex" alignItems="center" justifyContent="center" width={28} height={28} borderRadius={2} bgcolor={tint}>
        {icon}
      </Box>
      <Stack gap={0.25}>{children}</Stack>
    </Stack>
  )
}

function SupportedNotificationButton() {
  const overlay = useOverlay()
  const { data: airports } = useAirports()

  const toAirportNames = (airportCodes: readonly string[]) =>
    airportCodes
      .map((airportCode) => airports.find((airport) => airport.code === airportCode)?.nameKo)
      .filter((airportName): airportName is string => airportName != null)
      .map((airportName) => airportName.replace(/(국제)?공항$/, ''))

  const openSupportedNotification = () => {
    overlay.open(({ isOpen, close }) => (
      <SupportedNotificationSheet
        isOpen={isOpen}
        onClose={close}
        flightStatusAirportNames={toAirportNames(getSupportedFlightStatusAirportCodes())}
        guidanceAirportNames={toAirportNames(DOMESTIC_CONGESTION_AIRPORT_CODES)}
      />
    ))
  }

  return (
    <Stack direction="row" alignItems="center" alignSelf="flex-end" mb={-1} onClick={openSupportedNotification} sx={{ cursor: 'pointer' }}>
      <Typography variant="caption" color="text.disabled">
        자세히 보기
      </Typography>
      <ChevronRightIcon sx={{ fontSize: 24, color: 'text.disabled' }} />
    </Stack>
  )
}
