import type { Location } from '@waylog/domains/modules/location'
import type { PlaceCategoryType } from '@waylog/domains/modules/place'
import { ScrollView, StyleSheet, View } from 'react-native'
import { ExplorerPlaceCard } from '../explorer-place-item/ExplorerPlaceCard'
import { ExplorerEmptyState } from '../explorer-view/ExplorerEmptyState'
import { SectionHeader } from '../explorer-view/SectionHeader'
import { useAppNavigation } from '../../../shared/hooks/useAppNavigation'
import { AppRoute } from '../../../app/AppRoute'
import { useRecentHotPlaces } from './useRecentHotPlaces'

interface Props {
  location?: Location
  category?: PlaceCategoryType
}

export function RecentHotPlacesSection({ location, category }: Props) {
  const { data: hotPlaces } = useRecentHotPlaces(3, { location, category })
  const navigation = useAppNavigation()
  const places = hotPlaces.slice(0, 10);

  return (
    <View>
      <SectionHeader
        title="최근 핫한 곳이에요"
        onMore={() => {
          navigation.navigate(AppRoute.장소_급상승, { category, location })
        }}
      />
      {places.length === 0 ? (
        <ExplorerEmptyState />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.placesContent}>
          {places.map((place) => (
            <ExplorerPlaceCard
              key={place.placeId}
              width={160}
              place={{ ...place, countLabel: `${place.visitorCount.toLocaleString()}번 방문` }}
              onPress={() => navigation.navigate(AppRoute.장소_상세, { placeId: place.placeId })}
            />
          ))}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  placesContent: { paddingHorizontal: 16, gap: 12 },
})
