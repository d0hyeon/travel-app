import { useRouter } from 'expo-router'
import { ScrollView, useWindowDimensions, View } from 'react-native'
import { ExplorerPlaceCard } from '../explorer-place-item/ExplorerPlaceCard'
import { buildExplorerPlaceDetailPath } from '../explorer.utils'
import { ExplorerEmptyState } from './ExplorerEmptyState'
import type { useScrollStatus } from '../../../shared/hooks/interaction/useScrollStatus'
import type { ExplorerPlace } from '../useAttentionPlaces'

interface Props {
  places: ExplorerPlace[]
  countLabel: (place: ExplorerPlace) => string
  onScroll: ReturnType<typeof useScrollStatus>['onScroll']
}

/** 순위 화면(top-visited/recent-hot/most-saved) 공통 2열 그리드 목록. */
export function ExplorerRankingGrid({ places, countLabel, onScroll }: Props) {
  const { width } = useWindowDimensions()
  const router = useRouter()

  return (
    <ScrollView style={{ flex: 1 }} onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16 }}>
        {places.map((place) => (
          <ExplorerPlaceCard
            key={place.placeId}
            width={(width - 44) / 2}
            place={{ ...place, countLabel: countLabel(place) }}
            onPress={() => router.push(buildExplorerPlaceDetailPath(place.placeId))}
          />
        ))}
      </View>
      {places.length === 0 && <ExplorerEmptyState />}
    </ScrollView>
  )
}
