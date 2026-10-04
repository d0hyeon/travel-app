import { StyleSheet, ScrollView, useWindowDimensions, View } from 'react-native'
import { ExplorerPlaceCard } from '~features/explorer/explorer-place-item/ExplorerPlaceCard'
import { ExplorerEmptyState } from './ExplorerEmptyState'
import { useAppNavigation } from '~shared/hooks/useAppNavigation'
import { AppRoute } from '~app/AppRoute'
import type { useScrollStatus } from '~shared/hooks/interaction/useScrollStatus'
import type { ExplorerPlace } from '~features/explorer/useAttentionPlaces'

interface Props {
  places: ExplorerPlace[]
  onScroll: ReturnType<typeof useScrollStatus>['onScroll']
  contentTopInset: number
}

/** 순위 화면(top-visited/recent-hot/most-saved) 공통 2열 그리드 목록. */
export function ExplorerRankingGrid({ places, onScroll, contentTopInset }: Props) {
  const { width } = useWindowDimensions()
  const navigation = useAppNavigation()

  return (
    <ScrollView
      style={styles.scroll}
      onScroll={onScroll}
      scrollEventThrottle={16}
      contentContainerStyle={[styles.content, { paddingTop: contentTopInset + 16 }]}
    >
      <View style={styles.grid}>
        {places.map((place) => (
          <ExplorerPlaceCard
            key={place.placeId}
            width={(width - 44) / 2}
            place={place}
            onPress={() => navigation.navigate(AppRoute.장소_상세, { placeId: place.placeId })}
          />
        ))}
      </View>
      {places.length === 0 && <ExplorerEmptyState />}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingBottom: 40 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16 },
})
