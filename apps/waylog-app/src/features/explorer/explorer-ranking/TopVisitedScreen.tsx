import { StyleSheet } from 'react-native'
import { Suspense } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppRoute } from '../../../app/AppRoute'
import { palette } from '../../../shared/config/tokens'
import { useScrollStatus } from '../../../shared/hooks/interaction/useScrollStatus'
import { useExplorerFilterParams } from '../explorer-filters/useExplorerFilterParams'
import type { ExplorerFilterParams } from '../explorerFilterParams'
import { ExplorerMap } from '../explorer-view/ExplorerMap'
import { ExplorerGridSkeleton, ExplorerMapSkeleton } from '../explorer-view/ExplorerSkeletons'
import { ExplorerRankingGrid } from '../explorer-view/ExplorerRankingGrid'
import { ExplorerScreenHeader, useExplorerScreenHeaderHeight } from '../explorer-view/ExplorerScreenHeader'
import { useExplorerViewMode } from '../explorer-view/useExplorerViewMode'
import { useExploredPlaces } from './useExploredPlaces'

declare module '~app/routes' {
  interface RouteParamsRegistry {
    [AppRoute.장소_최다방문순]: ExplorerFilterParams
  }
}

export function TopVisitedScreen() {
  const { location, category } = useExplorerFilterParams()
  const [viewMode, setViewMode] = useExplorerViewMode()
  const { isScrollDown, onScroll } = useScrollStatus()
  const headerHeight = useExplorerScreenHeaderHeight()

  return (
    <SafeAreaView edges={SCREEN_SAFE_AREA_EDGES} style={styles.screen}>
      <ExplorerScreenHeader
        title="최다 방문"
        showBack
        isScrollDown={isScrollDown}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
      />
      <Suspense fallback={viewMode === 'map' ? <ExplorerMapSkeleton /> : <ExplorerGridSkeleton />}>
        <TopVisitedContent location={location} category={category} viewMode={viewMode} onScroll={onScroll} contentTopInset={headerHeight} />
      </Suspense>
    </SafeAreaView>
  )
}

function TopVisitedContent({
  location,
  category,
  viewMode,
  onScroll,
  contentTopInset,
}: {
  location: ReturnType<typeof useExplorerFilterParams>['location']
  category: ReturnType<typeof useExplorerFilterParams>['category']
  viewMode: ReturnType<typeof useExplorerViewMode>[0]
  onScroll: ReturnType<typeof useScrollStatus>['onScroll']
  contentTopInset: number
}) {
  const { data: places } = useExploredPlaces({ location, category })

  if (viewMode === 'map') {
    return <ExplorerMap places={places} location={location} />
  }

  return (
    <ExplorerRankingGrid
      places={places}
      onScroll={onScroll} contentTopInset={contentTopInset}
    />
  )
}

/** top은 오버레이 헤더가 직접 처리한다. */
const SCREEN_SAFE_AREA_EDGES = ['left', 'right'] as const

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
})
