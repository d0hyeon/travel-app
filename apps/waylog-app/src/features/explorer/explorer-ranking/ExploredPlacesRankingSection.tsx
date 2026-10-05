import type { Location } from '@waylog/domains/modules/location'
import type { PlaceCategoryType } from '@waylog/domains/modules/place'
import { View } from 'react-native'
import { ExplorerPlaceRow } from '~features/explorer/explorer-place-item/ExplorerPlaceCard'
import { ExplorerEmptyState } from '~features/explorer/explorer-view/ExplorerEmptyState'
import { SectionHeader } from '~features/explorer/explorer-view/SectionHeader'
import { useAppNavigation } from '~shared/hooks/useAppNavigation'
import { AppRoute } from '~app/AppRoute'
import { useExploredPlaces } from './useExploredPlaces'

interface Props {
  location?: Location
  category?: PlaceCategoryType
}

export function ExploredPlacesRankingSection({ location, category }: Props) {
  const { data: visitedPlaces } = useExploredPlaces({ location, category })
  const navigation = useAppNavigation()
  const places = visitedPlaces.slice(0, 10)

  return (
    <View>
      <SectionHeader title="가장 많이 방문하는 곳이에요" onMore={() => navigation.navigate(AppRoute.장소_최다방문순, { category, location })} />
      {places.length === 0 ? (
        <ExplorerEmptyState />
      ) : (
        places.map((place) => (
          <ExplorerPlaceRow
            key={place.placeId}
            place={place}
            onPress={() => navigation.navigate(AppRoute.장소_상세, { placeId: place.placeId })}
          />
        ))
      )}
    </View>
  )
}
