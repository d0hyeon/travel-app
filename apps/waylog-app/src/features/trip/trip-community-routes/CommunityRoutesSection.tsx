import { MaterialIcons } from '@expo/vector-icons'
import { useCommunityRoutes, type CommunityTrip } from '@waylog/domains/modules/community-route'
import { Suspense } from 'react'
import { StyleSheet, Pressable, ScrollView } from 'react-native'
import { Box, Skeleton, Stack, Typography } from '~shared/components/design-system'
import { palette, radius } from '~shared/config/tokens'
import { useCommunityRouteDetailOverlay } from './CommunityRouteDetailOverlay'
import { CommunityRouteThumbnail } from './CommunityRouteThumbnail'

function getNightsAndDays(nights: number): string {
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
  const { data: trips } = useCommunityRoutes(tripId)
  const { open } = useCommunityRouteDetailOverlay()

  if (trips.length === 0) return null

  return (
    <Stack gap={1} style={{ marginHorizontal: -16 }}>
      <Typography variant="subtitle2" style={{ paddingHorizontal: 16 }}>
        이 여행지를 다녀온 사람들
      </Typography>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 16 }}>
        <Stack direction="row" gap={1.5} mr={1}>
          {trips.map((trip) => (
            <CommunityTripCard
              key={trip.communityKey}
              trip={trip}
              onPress={() => open({ communityTrip: trip, tripId })}
            />
          ))}
        </Stack>
      </ScrollView>
    </Stack>
  )
}

function CommunityTripCard({ trip, onPress }: { trip: CommunityTrip; onPress: () => void }) {
  const duration = getNightsAndDays(trip.nights)

  return (
    <Pressable onPress={onPress}>
      <Box
        style={[styles.card, { borderRadius: radius.md }]}
      >
        <CommunityRouteThumbnail
          destinations={trip.destinations}
          previewCoordinates={trip.previewCoordinates}
          width={140}
          height={95}
        />
        <Stack style={styles.details}>
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
          <Skeleton key={index} variant="rounded" width={140} height={85} />
        ))}
      </Stack>
    </Stack>
  )
}

const styles = StyleSheet.create({
  card: { width: 140, borderWidth: 1, borderColor: palette.divider, backgroundColor: palette.background, overflow: 'hidden' },
  details: { padding: 8 },
})
