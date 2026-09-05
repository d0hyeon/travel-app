import type { Location } from '@waylog/domains/modules/location'
import type { PlaceCategoryType } from '@waylog/domains/modules/place'
import { useRouter } from 'expo-router'
import { View } from 'react-native'
import { ExplorerPlaceRow } from '../explorer-place-item/ExplorerPlaceCard'
import { buildExplorerPlaceDetailPath } from '../explorer.utils'
import { ExplorerEmptyState } from '../explorer-view/ExplorerEmptyState'
import { SectionHeader } from '../explorer-view/SectionHeader'
import { useExploredPlaces } from './useExploredPlaces'

interface Props {
  location?: Location
  category?: PlaceCategoryType
}

export function ExploredPlacesRankingSection({ location, category }: Props) {
  const { data: visitedPlaces } = useExploredPlaces({ location, category })
  const router = useRouter()
  const places = visitedPlaces.slice(0, 10)

  return (
    <View>
      <SectionHeader title="가장 많이 방문하는 곳이에요" onMore={() => router.push('/explorer/top-visited')} />
      {places.length === 0 ? (
        <ExplorerEmptyState />
      ) : (
        places.map((place) => (
          <ExplorerPlaceRow
            key={place.placeId}
            place={{ ...place, countLabel: `${place.visitorCount.toLocaleString()}명 다녀옴` }}
            onPress={() => router.push(buildExplorerPlaceDetailPath(place.placeId))}
          />
        ))
      )}
    </View>
  )
}
