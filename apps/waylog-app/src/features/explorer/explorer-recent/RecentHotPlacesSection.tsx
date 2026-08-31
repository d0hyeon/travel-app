import type { Location } from '@waylog/domains/modules/location'
import type { PlaceCategoryType } from '@waylog/domains/modules/place'
import { useRouter } from 'expo-router'
import { ScrollView, View } from 'react-native'
import { ExplorerPlaceCard } from '../explorer-place-item/ExplorerPlaceCard'
import { buildExplorerPlaceDetailPath } from '../explorer.utils'
import { ExplorerEmptyState } from '../explorer-view/ExplorerEmptyState'
import { SectionHeader } from '../explorer-view/SectionHeader'
import { useRecentHotPlaces } from './useRecentHotPlaces'

interface Props {
  location?: Location
  category?: PlaceCategoryType
}

export function RecentHotPlacesSection({ location, category }: Props) {
  const { data: hotPlaces } = useRecentHotPlaces(3, { location, category })
  const router = useRouter()
  const places = hotPlaces.slice(0, 10)

  return (
    <View>
      <SectionHeader title="최근 핫한 곳이에요" onMore={() => router.push('/explorer/recent-hot')} />
      {places.length === 0 ? (
        <ExplorerEmptyState />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
          {places.map((place) => (
            <ExplorerPlaceCard
              key={place.placeId}
              width={160}
              place={{ ...place, countLabel: `${place.visitorCount.toLocaleString()}번 방문` }}
              onPress={() => router.push(buildExplorerPlaceDetailPath(place.placeId))}
            />
          ))}
        </ScrollView>
      )}
    </View>
  )
}
