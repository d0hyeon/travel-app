import type { PlaceCategoryType } from '@waylog/domains/modules/place'
import type { Location } from '@waylog/domains/modules/location'
import { useRouter } from 'expo-router'
import { Suspense } from 'react'
import { ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ErrorBoundary } from '@waylog/react'
import { palette } from '../../shared/config/tokens'
import { useScrollStatus } from '../../shared/hooks/interaction/useScrollStatus'
import { useExplorerFilterParams } from './explorer-filters/useExplorerFilterParams'
import { ExploredPlacesRankingSection } from './explorer-ranking/ExploredPlacesRankingSection'
import { RecentHotPlacesSection } from './explorer-recent/RecentHotPlacesSection'
import { MostSavedPlacesSection } from './explorer-saved/MostSavedPlacesSection'
import { SeasonalRegionsSummarySection, SeasonalRegionsSummarySectionSkeleton } from './explorer-seasonal-regions/SeasonalRegionsSummarySection'
import { ExplorerMap } from './explorer-view/ExplorerMap'
import { ExplorerMapSkeleton, ExplorerPlaceCardSectionSkeleton, ExplorerPlaceListSectionSkeleton } from './explorer-view/ExplorerSkeletons'
import { ExplorerScreenHeader } from './explorer-view/ExplorerScreenHeader'
import { useExplorerViewMode } from './explorer-view/useExplorerViewMode'
import { useAttentionPlaces } from './useAttentionPlaces'

interface Props {
  bottomContentInset?: number
}

export function ExplorerCatalogScreen({ bottomContentInset = 0 }: Props) {
  const { location, category } = useExplorerFilterParams()
  const [viewMode, setViewMode] = useExplorerViewMode()
  const { isScrollDown, onScroll } = useScrollStatus()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      <ExplorerScreenHeader
        title="탐색"
        isScrollDown={isScrollDown}
        extrudeAxis="y"
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
      />

      {viewMode === 'map' ? (
        <Suspense fallback={<ExplorerMapSkeleton />}>
          <ExplorerCatalogMap location={location} category={category} />
        </Suspense>
      ) : (
        <ScrollView style={{ flex: 1 }} onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingTop: 16, gap: 24, paddingBottom: bottomContentInset + 24 }}>
          <ErrorBoundary fallback={null}>
            <Suspense fallback={<SeasonalRegionsSummarySectionSkeleton />}>
              <SeasonalRegionsSummarySection />
            </Suspense>
          </ErrorBoundary>
          <Suspense fallback={<ExplorerPlaceCardSectionSkeleton />}>
            <RecentHotPlacesSection location={location} category={category} />
          </Suspense>
          <Suspense fallback={<ExplorerPlaceCardSectionSkeleton />}>
            <MostSavedPlacesSection location={location} category={category} />
          </Suspense>
          <Suspense fallback={<ExplorerPlaceListSectionSkeleton />}>
            <ExploredPlacesRankingSection location={location} category={category} />
          </Suspense>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

function ExplorerCatalogMap({ location, category }: { location?: Location; category?: PlaceCategoryType }) {
  const attentionPlaces = useAttentionPlaces({ location, category })
  return <ExplorerMap places={attentionPlaces} location={location} />
}
