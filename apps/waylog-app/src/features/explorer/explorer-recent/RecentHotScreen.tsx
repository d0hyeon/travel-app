import { StyleSheet } from 'react-native'
import { Suspense, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { palette } from '../../../shared/config/tokens'
import { useScrollStatus } from '../../../shared/hooks/interaction/useScrollStatus'
import { useExplorerFilterParams } from '../explorer-filters/useExplorerFilterParams'
import { ExplorerMap } from '../explorer-view/ExplorerMap'
import { ExplorerGridSkeleton, ExplorerMapSkeleton } from '../explorer-view/ExplorerSkeletons'
import { ExplorerRankingGrid } from '../explorer-view/ExplorerRankingGrid'
import { ExplorerScreenHeader } from '../explorer-view/ExplorerScreenHeader'
import { useExplorerViewMode } from '../explorer-view/useExplorerViewMode'
import { PeriodFilterChip } from './PeriodFilterChip'
import type { RecentHotPeriodMonths } from './recentHotPeriod.constants'
import { useRecentHotPlaces } from './useRecentHotPlaces'

export function RecentHotScreen() {
  const { location, category } = useExplorerFilterParams()
  const [viewMode, setViewMode] = useExplorerViewMode()
  const [months, setMonths] = useState<RecentHotPeriodMonths>(3)
  const { isScrollDown, onScroll } = useScrollStatus()

  return (
    <SafeAreaView style={styles.screen}>
      <ExplorerScreenHeader
        title="핫플레이스"
        showBack
        isScrollDown={isScrollDown}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        filterExtras={<PeriodFilterChip months={months} onChange={setMonths} />}
      />
      <Suspense fallback={viewMode === 'map' ? <ExplorerMapSkeleton /> : <ExplorerGridSkeleton />}>
        <RecentHotContent location={location} category={category} months={months} viewMode={viewMode} onScroll={onScroll} />
      </Suspense>
    </SafeAreaView>
  )
}

function RecentHotContent({
  location,
  category,
  months,
  viewMode,
  onScroll,
}: {
  location: ReturnType<typeof useExplorerFilterParams>['location']
  category: ReturnType<typeof useExplorerFilterParams>['category']
  months: RecentHotPeriodMonths
  viewMode: ReturnType<typeof useExplorerViewMode>[0]
  onScroll: ReturnType<typeof useScrollStatus>['onScroll']
}) {
  const { data: places } = useRecentHotPlaces(months, { location, category })

  if (viewMode === 'map') {
    return <ExplorerMap places={places} location={location} />
  }

  return <ExplorerRankingGrid places={places} countLabel={(place) => ('visitorCount' in place ? `${place.visitorCount.toLocaleString()}번 방문` : '')} onScroll={onScroll} />
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
})
