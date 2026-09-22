import { Stack, type StackProps } from '@mui/material'
import { AsyncBoundary } from '@waylog/react'
import { useNavigate } from 'react-router'
import { TransportDetailSectionError } from './transport-detail/TransportDetailSectionError'
import { TripTransportList } from './TripTransportList'

interface Props extends StackProps {
  tripId: string
}

// 모바일 추가 동작은 기본정보 탭의 FAB가 소유한다.
export function TripTransportSection({ tripId, ...props }: Props) {
  const navigate = useNavigate()

  return (
    <Stack gap={2} {...props}>
      <AsyncBoundary
        resetKeys={[tripId]}
        pendingFallback={<TripTransportList.Skeleton />}
        rejectedFallback={({ error, resetError }) => (
          <TransportDetailSectionError message={error.message} onRetry={resetError} />
        )}
      >
        <TripTransportList
          tripId={tripId}
          onTransportClick={(transportId) => navigate(`/trip/${tripId}/transport/${transportId}`)}
        />
      </AsyncBoundary>
    </Stack>
  )
}
