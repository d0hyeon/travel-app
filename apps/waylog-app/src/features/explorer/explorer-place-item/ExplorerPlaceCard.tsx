import { MaterialIcons } from '@expo/vector-icons'
import { PlaceCategoryColorCode, PlaceCategoryTypeLabel, type PlaceCategoryType } from '@waylog/domains/modules/place'
import { StyleSheet, Pressable, View } from 'react-native'
import { palette, radius } from '../../../shared/config/tokens'
import { Typography } from '~/shared/components/design-system'
import { LoadableImage } from '../../../shared/components/LoadableImage'

interface PlaceCardData {
  placeId: string
  name: string
  destinations?: string[]
  address?: string
  categories: PlaceCategoryType[]
  thumbnailUrl?: string
  countLabel: string
}

interface Props {
  place: PlaceCardData
  onPress: () => void
  width?: number
}

export function ExplorerPlaceCard({ place, onPress, width }: Props) {
  const accentColor = place.categories[0] == null ? palette.textSecondary : PlaceCategoryColorCode[place.categories[0]]
  const subtitle = place.destinations?.join(', ') ?? place.address ?? ''

  return (
    <Pressable onPress={onPress} style={{ width, flex: width == null ? 1 : undefined }}>
      <View
        style={styles.card}
      >
        <View style={[styles.cover, { backgroundColor: `${accentColor}22` }]}>
          {place.thumbnailUrl == null ? (
            <MaterialIcons name="location-on" size={36} color={accentColor} />
          ) : (
            <LoadableImage source={{ uri: place.thumbnailUrl }} style={styles.photo} resizeMode="cover" />
          )}
        </View>
        <View style={styles.details}>
          <Typography variant="body2" fontWeight="bold" numberOfLines={1}>
            {place.name}
          </Typography>
          {subtitle !== '' && (
            <Typography variant="caption" color="text.secondary" numberOfLines={1}>
              {subtitle}
            </Typography>
          )}
          <Typography variant="caption" color="primary" fontWeight="bold">
            {place.countLabel}
          </Typography>
        </View>
      </View>
    </Pressable>
  )
}

export function ExplorerPlaceRow({ place, onPress }: Omit<Props, 'width'>) {
  const [primaryCategory] = place.categories
  const accentColor = primaryCategory == null ? palette.textSecondary : PlaceCategoryColorCode[primaryCategory]
  const categoryLabel = primaryCategory == null ? undefined : PlaceCategoryTypeLabel[primaryCategory]

  return (
    <Pressable
      onPress={onPress}
      style={styles.listItem}
    >
      <View style={[styles.thumbnail, { backgroundColor: `${accentColor}22` }]}>
        {place.thumbnailUrl == null ? (
          <MaterialIcons name="location-on" size={24} color={accentColor} />
        ) : (
          <LoadableImage source={{ uri: place.thumbnailUrl }} style={styles.photo} resizeMode="cover" />
        )}
      </View>
      <View style={styles.listDetails}>
        <Typography variant="body2" fontWeight="bold" numberOfLines={1}>
          {place.name}
        </Typography>
        <Typography variant="caption" color="text.secondary" numberOfLines={1}>
          {[categoryLabel, place.address].filter(Boolean).join(' · ')}
        </Typography>
        <Typography variant="caption" color="primary" fontWeight="bold">
          {place.countLabel}
        </Typography>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: palette.divider, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: palette.background },
  cover: { aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  photo: { width: '100%', height: '100%' },
  details: { padding: 12, gap: 3 },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: palette.divider },
  thumbnail: { width: 64, height: 64, borderRadius: radius.md, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  listDetails: { flex: 1, gap: 3 },
})
