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
import { useMostSavedPlaces } from './useMostSavedPlaces'

export function MostSavedScreen() {
  const { location, category } = useExplorerFilterParams()
  const [viewMode, setViewMode] = useExplorerViewMode()
  const { isScrollDown, onScroll } = useScrollStatus()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      <ExplorerScreenHeader
        title="많이 저장된 곳"
        showBack
        isScrollDown={isScrollDown}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
      />
      <Suspense fallback={viewMode === 'map' ? <ExplorerMapSkeleton /> : <ExplorerGridSkeleton />}>
        <MostSavedContent location={location} category={category} viewMode={viewMode} onScroll={onScroll} />
      </Suspense>
    </SafeAreaView>
  )
}

function MostSavedContent({
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
  const { data: places } = useMostSavedPlaces({ location, category })

  if (viewMode === 'map') {
    return <ExplorerMap places={places} location={location} />
  }

  return <ExplorerRankingGrid places={places} countLabel={(place) => ('saveCount' in place ? `${place.saveCount.toLocaleString()}번 저장됨` : '')} onScroll={onScroll} />
}
