import type { Location } from '@waylog/domains/modules/location'
import type { PlaceCategoryType } from '@waylog/domains/modules/place'
import { StyleSheet, ScrollView, View } from 'react-native'
import { ExplorerPlaceCard } from '~features/explorer/explorer-place-item/ExplorerPlaceCard'
import { ExplorerEmptyState } from '~features/explorer/explorer-view/ExplorerEmptyState'
import { SectionHeader } from '~features/explorer/explorer-view/SectionHeader'
import { buildExplorerDetailParams } from '~features/explorer/explorer.utils'
import { useAppNavigation } from '~shared/hooks/useAppNavigation'
import { AppRoute } from '~app/AppRoute'
import { useMostSavedPlaces } from './useMostSavedPlaces'

interface Props {
  location?: Location
  category?: PlaceCategoryType
}

export function MostSavedPlacesSection({ location, category }: Props) {
  const { data: savedPlaces } = useMostSavedPlaces({ location, category })
  const navigation = useAppNavigation()
  const places = savedPlaces.slice(0, 10)

  return (
    <View>
      <SectionHeader title="많이 저장된 곳이에요" onMore={() => navigation.navigate(AppRoute.장소_저장순, buildExplorerDetailParams(location, category))} />
      {places.length === 0 ? (
        <ExplorerEmptyState />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.placesContent}>
          {places.map((place) => (
            <ExplorerPlaceCard
              key={place.placeId}
              width={160}
              place={place}
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
