import { MaterialIcons } from '@expo/vector-icons'
import { useCommunityRoutes, type CommunityTrip } from '@waylog/domains/community-route'
import { Suspense } from 'react'
import { Pressable, ScrollView } from 'react-native'
import { Box, Skeleton, Stack, Typography } from '../../../shared/components/mui'
import { palette, radius } from '../../../shared/config/tokens'
import { useCommunityRouteDetailOverlay } from './CommunityRouteDetailOverlay'
import { CommunityRouteThumbnail } from './CommunityRouteThumbnail'

function getNightsAndDays(startDate: string, endDate: string): string {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const nights = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  if (nights <= 0) return '당일치기'
  return `${nights}박 ${nights + 1}일`
}

interface Props {
  tripId: string
}

export function CommunityRoutesSection(props: Props) {
  return (
    <Suspense fallback={<CommunityRoutesSkeleton />}>
      <CommunityRoutesSectionContent {...props} />
    </Suspense>
  )
}

function CommunityRoutesSectionContent({ tripId }: Props) {
  const { data: allTrips } = useCommunityRoutes(tripId)
  const trips = allTrips.filter((trip) => trip.id !== tripId)
  const { open } = useCommunityRouteDetailOverlay()

  if (trips.length === 0) return null

  return (
    <Stack gap={1}>
      <Typography variant="subtitle2" color="text.secondary">
        이 여행지를 다녀온 사람들
      </Typography>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Stack direction="row" gap={1.5}>
          {trips.map((trip) => (
            <CommunityTripCard
              key={trip.id}
              trip={trip}
              onClick={() => open({ communityTrip: trip, tripId })}
            />
          ))}
        </Stack>
      </ScrollView>
    </Stack>
  )
}

function CommunityTripCard({ trip, onClick }: { trip: CommunityTrip; onClick: () => void }) {
  const duration = getNightsAndDays(trip.startDate, trip.endDate)

  return (
    <Pressable onPress={onClick}>
      <Box
        sx={{
          width: 140,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: palette.divider,
          backgroundColor: palette.background,
          overflow: 'hidden',
        }}
      >
        <CommunityRouteThumbnail
          destinations={trip.destinations}
          previewRoutes={trip.previewRoutes}
          width={140}
          height={80}
        />
        <Stack sx={{ padding: 8 }}>
          <Stack direction="row" alignItems="center" gap={0.5}>
            <MaterialIcons name="people" size={11} color={palette.textSecondary} />
            <Typography variant="caption" color="text.secondary">
              {duration}
            </Typography>
          </Stack>
        </Stack>
      </Box>
    </Pressable>
  )
}

function CommunityRoutesSkeleton() {
  return (
    <Stack gap={1}>
      <Skeleton variant="text" width={120} height={20} />
      <Stack direction="row" gap={1.5}>
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} variant="rounded" width={130} height={72} />
        ))}
      </Stack>
    </Stack>
  )
}
