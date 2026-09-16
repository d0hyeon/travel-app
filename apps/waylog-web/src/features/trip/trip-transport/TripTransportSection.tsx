import AddIcon from '@mui/icons-material/Add'
import { Button, Stack, type StackProps } from '@mui/material'
import { ErrorBoundary } from '@waylog/react'
import { Suspense } from 'react'
import { Link, useNavigate } from 'react-router'
import { TripTransportList } from './TripTransportList'

interface Props extends StackProps {
  tripId: string
}

export function TripTransportSection({ tripId, ...props }: Props) {
  const navigate = useNavigate()

  return (
    <Stack gap={2} {...props}>
      <ErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          <TripTransportList
            tripId={tripId}
            onTransportClick={(transportId) => navigate(`/trip/${tripId}/transport/${transportId}`)}
          />
        </Suspense>
      </ErrorBoundary>

      <Button
        component={Link}
        to={`/trip/${tripId}/transport/new`}
        variant="contained"
        size="large"
        startIcon={<AddIcon />}
        fullWidth
      >
        교통편 추가
      </Button>
    </Stack>
  )
}
