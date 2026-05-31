import PeopleIcon from '@mui/icons-material/People'
import { Box, Card, CardContent, CardHeader, Skeleton, Stack, Typography, type StackProps } from '@mui/material'
import { Suspense } from 'react'
import { useCommunityRouteDetailOverlay } from './CommunityRouteDetailOverlay'
import { CommunityRouteThumbnail } from './CommunityRouteThumbnail'
import { useCommunityRoutes } from './useCommunityRoutes'
import type { CommunityTrip } from './communityRoute.types'

function getNightsAndDays(startDate: string, endDate: string): string {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const nights = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  if (nights <= 0) return '당일치기'
  return `${nights}박 ${nights + 1}일`
}

interface Props extends StackProps {
  tripId: string
}

export function CommunityRoutesSection(props: Props) {
  return (
    <Suspense fallback={<CommunityRoutesSkeleton {...props} />}>
      <CommunityRoutesSectionContent {...props} />
    </Suspense>
  )
}

export function CommunityRoutesSection_Desktop({ tripId }: { tripId: string }) {
  return (
    <Suspense fallback={null}>
      <CommunityRoutesSectionDesktopContent tripId={tripId} />
    </Suspense>
  )
}

function CommunityRoutesSectionDesktopContent({ tripId }: { tripId: string }) {
  const { data: trips } = useCommunityRoutes(tripId)
  const { open } = useCommunityRouteDetailOverlay()

  if (trips.length === 0) return null

  return (
    <Card variant="outlined">
      <CardHeader title="이 여행지를 다녀온 사람들" />
      <CardContent>
        <CommunityRouteList
          trips={trips}
          onTripClick={(trip) => open({ communityTrip: trip, tripId })}
        />
      </CardContent>
    </Card>
  )
}

function CommunityRoutesSectionContent({ tripId, sx, ...props }: Props) {
  const { data: trips } = useCommunityRoutes(tripId)
  const { open } = useCommunityRouteDetailOverlay()

  if (trips.length === 0) return null

  return (
    <Stack gap={1} {...props}>
      <Typography variant="subtitle2" color="text.secondary">
        이 여행지를 다녀온 사람들
      </Typography>
      <CommunityRouteList
        trips={trips}
        onTripClick={(trip) => open({ communityTrip: trip, tripId })}
        sx={sx}
      />
    </Stack>
  )
}

interface CommunityRouteListProps extends StackProps {
  trips: CommunityTrip[]
  onTripClick: (trip: CommunityTrip) => void
}

export function CommunityRouteList({ trips, onTripClick, sx, ...props }: CommunityRouteListProps) {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={[
        { overflowX: 'auto', pb: 0.5, '::-webkit-scrollbar': { display: 'none' } },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    >
      {trips.map((trip) => (
        <CommunityTripCard
          key={trip.id}
          trip={trip}
          onClick={() => onTripClick(trip)}
        />
      ))}
    </Stack>
  )
}

function CommunityTripCard({ trip, onClick }: { trip: CommunityTrip; onClick: () => void }) {
  const duration = getNightsAndDays(trip.startDate, trip.endDate)

  return (
    <Box
      onClick={onClick}
      sx={{
        width: 140,
        flexShrink: 0,
        cursor: 'pointer',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        overflow: 'hidden',
        '&:hover': { borderColor: 'primary.light', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
    >
      {/* SVG 썸네일 */}
      <CommunityRouteThumbnail
        destinations={trip.destinations}
        previewRoutes={trip.previewRoutes}
        width={140}
        height={80}
      />

      {/* 텍스트 정보 */}
      <Stack p={1}>
        <Stack direction="row" alignItems="center" gap={0.5}>
          <PeopleIcon sx={{ fontSize: 11, color: 'text.disabled' }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
            {duration}
          </Typography>
        </Stack>
      </Stack>
    </Box>
  )
}

function CommunityRoutesSkeleton({ ...props }: StackProps) {
  return (
    <Stack gap={1} {...props}>
      <Skeleton variant="text" width={120} height={20} />
      <Stack direction="row" spacing={1.5}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} variant="rounded" width={130} height={72} />
        ))}
      </Stack>
    </Stack>
  )
}
