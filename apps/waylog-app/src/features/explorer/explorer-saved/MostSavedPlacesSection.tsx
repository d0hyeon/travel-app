import type { Location } from '@waylog/domains/modules/location'
import type { PlaceCategoryType } from '@waylog/domains/modules/place'
import { useRouter } from 'expo-router'
import { ScrollView, View } from 'react-native'
import { ExplorerPlaceCard } from '../explorer-place-item/ExplorerPlaceCard'
import { buildExplorerPlaceDetailPath } from '../explorer.utils'
import { ExplorerEmptyState } from '../explorer-view/ExplorerEmptyState'
import { SectionHeader } from '../explorer-view/SectionHeader'
import { useMostSavedPlaces } from './useMostSavedPlaces'

interface Props {
  location?: Location
  category?: PlaceCategoryType
}

export function MostSavedPlacesSection({ location, category }: Props) {
  const { data: savedPlaces } = useMostSavedPlaces({ location, category })
  const router = useRouter()
  const places = savedPlaces.slice(0, 10)

  return (
    <View>
      <SectionHeader title="많이 저장된 곳이에요" onMore={() => router.push('/explorer/most-saved')} />
      {places.length === 0 ? (
        <ExplorerEmptyState />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
          {places.map((place) => (
            <ExplorerPlaceCard
              key={place.placeId}
              width={160}
              place={{ ...place, countLabel: `${place.saveCount.toLocaleString()}번 저장됨` }}
              onPress={() => router.push(buildExplorerPlaceDetailPath(place.placeId))}
            />
          ))}
        </ScrollView>
      )}
    </View>
  )
}
