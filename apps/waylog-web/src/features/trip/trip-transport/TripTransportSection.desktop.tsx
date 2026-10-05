import { Button, Card, CardContent, CardHeader, Stack } from '@mui/material'
import { AsyncBoundary } from '@waylog/react'
import { Link, useNavigate } from 'react-router'
import { TransportDetailSectionError } from './transport-detail/TransportDetailSectionError'
import { TransportEmptyCard } from './TransportEmptyCard.desktop'
import { TripTransportList } from './TripTransportList'

interface Props {
  tripId: string
}

// 데스크톱 정보 탭의 카드와 헤더 액션은 이 섹션이 함께 소유한다.
export function TripTransportSection({ tripId }: Props) {
  const navigate = useNavigate()

  return (
    <Card variant="outlined">
      <Stack direction="row" paddingY={1} marginTop={0.5} paddingX={2} alignItems="center" justifyContent="space-between">
        <CardHeader title="탑승권" />
        <Button component={Link} to={`/trip/${tripId}/transport/new`} variant="contained" size="small">
          추가
        </Button>
      </Stack>
      <CardContent>
        <AsyncBoundary
          resetKeys={[tripId]}
          pendingFallback={<TripTransportList.Skeleton />}
          rejectedFallback={({ error, resetError }) => (
            <TransportDetailSectionError message={error.message} onRetry={resetError} />
          )}
        >
          <TripTransportList
            tripId={tripId}
            emptyFallback={<TransportEmptyCard />}
          />
        </AsyncBoundary>
      </CardContent>
    </Card>
  )
}
