import { Skeleton, Stack, Typography } from '@mui/material'
import { useTripTransport, useTripTransportDetail } from '@waylog/domains/modules/trip-transport'
import { AsyncBoundary } from '@waylog/react'
import { EditableText } from '../../../../shared/components/EditableText'
import { TransportDetailSectionError } from './TransportDetailSectionError'

const OPERATIONAL_FIELDS = [
  { name: 'terminal', label: '터미널' },
  { name: 'gate', label: '게이트' },
  { name: 'seat', label: '좌석(나)' },
] as const

const EMPTY_PLACEHOLDER = '—'

interface Props {
  tripId: string
  transportId: string
}

export function TransportOperationalInfoSection({ tripId, transportId }: Props) {
  return (
    <AsyncBoundary
      resetKeys={[tripId, transportId]}
      pendingFallback={<TransportOperationalInfoSkeleton />}
      rejectedFallback={({ error, resetError }) => (
        <TransportDetailSectionError message={error.message} onRetry={resetError} />
      )}
    >
      <Resolved tripId={tripId} transportId={transportId} />
    </AsyncBoundary>
  )
}

function Resolved({ tripId, transportId }: Props) {
  const { transport, primaryTicket } = useTripTransportDetail({ tripId, transportId })
  const { updateTicket } = useTripTransport(tripId)

  // 값이 없는 이유가 "탑승권이 없다"면 유도는 티켓 섹션이 한다.
  // 두 섹션이 맞붙어 있어 여기서도 하면 같은 버튼이 둘 뜬다.
  if (primaryTicket == null) return null

  return (
    <Stack direction="row" gap={1.25} my={1} aria-label={`${transport.type} 운행 정보`}>
      {OPERATIONAL_FIELDS.map(({ name, label }) => (
        <Stack
          key={name}
          flex={1}
          alignItems="center"
          gap={0.75}
          py={1.75}
          borderRadius={3}
          bgcolor="rgba(0,0,0,0.04)"
        >
          <Typography fontSize={12} color="text.secondary">
            {label}
          </Typography>
          <EditableText
            value={primaryTicket[name] ?? ''}
            format={(value) => (value === '' ? EMPTY_PLACEHOLDER : value)}
            onSubmit={(value) => {
              void updateTicket({ id: primaryTicket.id, [name]: value.trim() || undefined })
            }}
            fontSize={16}
            fontWeight={700}
          />
        </Stack>
      ))}
    </Stack>
  )
}

function TransportOperationalInfoSkeleton() {
  return (
    <Stack direction="row" gap={1.25} my={1}>
      {OPERATIONAL_FIELDS.map(({ name }) => (
        <Stack
          key={name}
          flex={1}
          alignItems="center"
          gap={0.75}
          py={1.75}
          borderRadius={3}
          bgcolor="rgba(0,0,0,0.04)"
        >
          <Skeleton width={36} height={14} />
          <Skeleton width={28} height={20} />
        </Stack>
      ))}
    </Stack>
  )
}
