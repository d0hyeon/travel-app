import { MaterialIcons } from '@expo/vector-icons'
import { PlaceCategoryColorCode } from '@waylog/domains/modules/place'
import { useRecommendedPlaces } from '@waylog/domains/modules/trip-recommend'
import type { RecommendedPlace } from '@waylog/domains/modules/trip-recommend'
import { Suspense, type ReactNode } from 'react'
import { StyleSheet, Pressable, ScrollView } from 'react-native'
import { Box, Skeleton, Stack, Typography } from '~/shared/components/design-system'
import { palette, radius } from '../../../shared/config/tokens'
import { useRecommendedPlaceDetailOverlay } from './RecommendedPlaceDetailOverlay'
import { LoadableImage } from '../../../shared/components/LoadableImage'

interface Props {
  tripId: string
  header?: ReactNode
}

export function RecommendedPlaceListSection(props: Props) {
  return (
    <Suspense fallback={<RecommendedPlacesSkeleton />}>
      <RecommendedPlacesSectionContent {...props} />
    </Suspense>
  )
}

function RecommendedPlacesSectionContent({ tripId, header }: Props) {
  const { data: places } = useRecommendedPlaces(tripId)
  const { openBottomSheet } = useRecommendedPlaceDetailOverlay()

  if (places.length === 0) return null

  return (
    <Stack gap={1}>
      {header}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Stack direction="row" gap={1.5}>
          {places.map((place) => (
            <RecommendedPlaceCard
              key={place.id}
              place={place}
              onPress={() => openBottomSheet({ place, tripId })}
            />
          ))}
        </Stack>
      </ScrollView>
    </Stack>
  )
}

function RecommendedPlaceCard({
  place,
  onPress,
}: {
  place: RecommendedPlace
  onPress: () => void
}) {
  const accentColor = place.category ? PlaceCategoryColorCode[place.category] : undefined

  return (
    <Pressable onPress={onPress}>
      <Box
        style={[styles.card, { borderRadius: radius.sm }]}
      >
        <Box style={styles.imageArea}>
          <Box
            style={[styles.imagePlaceholder, { backgroundColor: accentColor ? `${accentColor}22` : 'rgba(0,0,0,0.06)' }]}
          >
            {place.photos[0] ? (
              <LoadableImage source={{ uri: place.photos[0] }} style={styles.image} resizeMode="cover" />
            ) : (
              <MaterialIcons name="room" size={28} color={accentColor ?? palette.textSecondary} />
            )}
          </Box>
        </Box>
        <Box style={styles.details}>
          <Typography variant="caption" numberOfLines={1}>
            {place.name}
          </Typography>
        </Box>
      </Box>
    </Pressable>
  )
}

function RecommendedPlacesSkeleton() {
  return (
    <Stack gap={1}>
      <Skeleton variant="text" width={60} height={20} />
      <Stack direction="row" gap={1.5}>
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} variant="rounded" width={110} height={96} />
        ))}
      </Stack>
    </Stack>
  )
}

const styles = StyleSheet.create({
  card: { width: 110, overflow: 'hidden', borderWidth: 1, borderColor: palette.divider },
  imageArea: { position: 'relative' },
  imagePlaceholder: { width: '100%', height: 72, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  details: { padding: 6 },
})
