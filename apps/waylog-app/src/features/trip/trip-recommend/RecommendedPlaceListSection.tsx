import { MaterialIcons } from '@expo/vector-icons'
import { PlaceCategoryColorCode } from '@waylog/domains/place'
import { useRecommendedPlaces } from '@waylog/domains/trip-recommend'
import type { RecommendedPlace } from '@waylog/domains/trip-recommend'
import { Suspense, type ReactNode } from 'react'
import { Image, Pressable, ScrollView } from 'react-native'
import { Box, Chip, Skeleton, Stack, Typography } from '../../../shared/components/mui'
import { palette, radius } from '../../../shared/config/tokens'
import { useRecommendedPlaceDetailOverlay } from './RecommendedPlaceDetailOverlay'

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
              onClick={() => openBottomSheet({ place, tripId })}
            />
          ))}
        </Stack>
      </ScrollView>
    </Stack>
  )
}

function RecommendedPlaceCard({
  place,
  onClick,
}: {
  place: RecommendedPlace
  onClick: () => void
}) {
  const accentColor = place.category ? PlaceCategoryColorCode[place.category] : undefined

  return (
    <Pressable onPress={onClick}>
      <Box
        sx={{
          width: 110,
          borderRadius: radius.sm,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: palette.divider,
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <Box
            sx={{
              width: '100%',
              height: 72,
              backgroundColor: accentColor ? `${accentColor}22` : 'rgba(0,0,0,0.06)',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {place.photos[0] ? (
              <Image source={{ uri: place.photos[0] }} style={{ width: '100%', height: '100%' }} />
            ) : (
              <MaterialIcons name="room" size={28} color={accentColor ?? palette.textSecondary} />
            )}
          </Box>
          {place.tripCount > 1 && (
            <Chip
              label={`${place.tripCount}회`}
              size="small"
              sx={{
                position: 'absolute',
                top: 4,
                right: 4,
                backgroundColor: 'rgba(0,0,0,0.55)',
              }}
            />
          )}
        </Box>
        <Box sx={{ padding: 6 }}>
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
