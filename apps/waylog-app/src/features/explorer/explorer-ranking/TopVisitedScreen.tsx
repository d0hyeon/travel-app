import { StyleSheet } from 'react-native'
import { Suspense } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { palette } from '../../../shared/config/tokens'
import { useScrollStatus } from '../../../shared/hooks/interaction/useScrollStatus'
import { useExplorerFilterParams } from '../explorer-filters/useExplorerFilterParams'
import { ExplorerMap } from '../explorer-view/ExplorerMap'
import { ExplorerGridSkeleton, ExplorerMapSkeleton } from '../explorer-view/ExplorerSkeletons'
import { ExplorerRankingGrid } from '../explorer-view/ExplorerRankingGrid'
import { ExplorerScreenHeader } from '../explorer-view/ExplorerScreenHeader'
import { useExplorerViewMode } from '../explorer-view/useExplorerViewMode'
import { useExploredPlaces } from './useExploredPlaces'

export function TopVisitedScreen() {
  const { location, category } = useExplorerFilterParams()
  const [viewMode, setViewMode] = useExplorerViewMode()
  const { isScrollDown, onScroll } = useScrollStatus()

  return (
    <SafeAreaView style={styles.screen}>
      <ExplorerScreenHeader
        title="최다 방문"
        showBack
        isScrollDown={isScrollDown}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
      />
      <Suspense fallback={viewMode === 'map' ? <ExplorerMapSkeleton /> : <ExplorerGridSkeleton />}>
        <TopVisitedContent location={location} category={category} viewMode={viewMode} onScroll={onScroll} />
      </Suspense>
    </SafeAreaView>
  )
}

function TopVisitedContent({
  location,
  category,
  viewMode,
  onScroll,
}: {
  location: ReturnType<typeof useExplorerFilterParams>['location']
  category: ReturnType<typeof useExplorerFilterParams>['category']
  viewMode: ReturnType<typeof useExplorerViewMode>[0]
  onScroll: ReturnType<typeof useScrollStatus>['onScroll']
}) {
  const { data: places } = useExploredPlaces({ location, category })

  if (viewMode === 'map') {
    return <ExplorerMap places={places} location={location} />
  }

  return <ExplorerRankingGrid places={places} countLabel={(place) => ('visitorCount' in place ? `${place.visitorCount.toLocaleString()}번 방문` : '')} onScroll={onScroll} />
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
})
