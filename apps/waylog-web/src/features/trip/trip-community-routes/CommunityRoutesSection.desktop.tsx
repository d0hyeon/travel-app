import { Card, CardContent, CardHeader } from '@mui/material'
import { Suspense } from 'react'
import { useCommunityRouteDetailOverlay } from './CommunityRouteDetailOverlay'
import { CommunityRouteList } from './CommunityRoutesSection'
import { useCommunityRoutes } from '@waylog/domains/modules/community-route'

export function CommunityRoutesSectionDesktop({ tripId }: { tripId: string }) {
  return (
    <Suspense fallback={null}>
      <CommunityRoutesSectionDesktopContent tripId={tripId} />
    </Suspense>
  )
}

function CommunityRoutesSectionDesktopContent({ tripId }: { tripId: string }) {
  const { data: allTrips } = useCommunityRoutes(tripId)
  const trips = allTrips.filter((t) => t.id !== tripId)
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
