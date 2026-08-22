import { MaterialIcons } from '@expo/vector-icons'
import { SeasonLabel, useRegionTourismTrends } from '@waylog/domains/modules/tourism-trend'
import { formatKoreanCount } from '@waylog/utility'
import { Suspense, useCallback, useState } from 'react'
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { getCoordinateByLocation, type Location } from '@waylog/domains/modules/location'
import type { PlaceCategoryType } from '@waylog/domains/modules/place'
import { Map } from '../../shared/components/Map'
import { ErrorBoundary } from '../../shared/components/ErrorBoundary'
import { BottomSheet } from '../../shared/components/bottom-sheet/BottomSheet'
import { Chip, Skeleton, ToggleButton, ToggleButtonGroup, Typography } from '../../shared/components/mui'
import { useOverlay } from '../../shared/hooks/useOverlay'
import { palette, radius } from '../../shared/config/tokens'
import { ExplorerFilterBar } from './ExplorerFilterBar'
import { FilterNavigation } from './FilterNavigation'
import { Extrude } from '../../shared/components/animation/Extrude'
import { ExplorerPlaceCard, ExplorerPlaceRow } from './ExplorerPlaceCard'
import { useExplorerFilterParams } from './useExplorerFilterParams'
import { useAttentionPlaces, useExploredPlaces, useMostSavedPlaces, useRecentHotPlaces, type ExplorerPlace } from './useExplorerData'
import { useQueryParamState } from '../../shared/hooks/useQueryParamState'
import { buildExplorerPlaceDetailPath } from './explorer.utils'
import { useScrollStatus } from '../../shared/hooks/interaction/useScrollStatus'
import { SafeAreaView } from 'react-native-safe-area-context'

export type ExplorerScreenMode = 'catalog' | 'top-visited' | 'recent-hot' | 'most-saved'
type ViewMode = 'list' | 'map'
type PeriodMonths = 3 | 6 | 12

const PERIOD_OPTIONS: Array<{ label: string; value: PeriodMonths }> = [
  { label: '3개월', value: 3 },
  { label: '6개월', value: 6 },
  { label: '1년', value: 12 },
]

interface ExplorerScreenProps {
  mode?: ExplorerScreenMode
  bottomContentInset?: number
}

export function ExplorerScreen({ mode = 'catalog', bottomContentInset = 0 }: ExplorerScreenProps) {
  const { location, category } = useExplorerFilterParams()
  const [viewMode, setViewMode] = useViewMode()
  const [months, setMonths] = useState<PeriodMonths>(3)
  const title = getExplorerTitle(mode)
  const router = useRouter()
  const [titleNode, setTitleNode] = useState<View | null>(null)
  const { isScrollDown, onScroll } = useScrollStatus()
  const titleRef = useCallback((node: View | null) => { setTitleNode(node) }, [])


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      <View style={{ height: 50, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {mode !== 'catalog' && <Pressable onPress={() => router.back()} hitSlop={8}><MaterialIcons name="arrow-back" size={22} color={palette.text} /></Pressable>}
          <View collapsable={false} ref={titleRef}><Typography variant="h6">{title}</Typography></View>
        </View>
        <ExplorerViewToggle value={viewMode} onChange={setViewMode} />
      </View>

      <FilterNavigation>
        <Extrude active={isScrollDown} target={titleNode} axis={mode === 'catalog' ? 'y' : 'both'}>
          <View style={{ paddingBottom: 8 }}>
            <ExplorerFilterBar>
              {mode === 'recent-hot' && <PeriodFilterChip months={months} onChange={setMonths} />}
            </ExplorerFilterBar>
          </View>
        </Extrude>
      </FilterNavigation>

      <View style={{ flex: 1 }}>
        {mode === 'catalog' ? (
          <ExplorerCatalogContent location={location} category={category} viewMode={viewMode} bottomContentInset={bottomContentInset} onScroll={onScroll} />
        ) : (
          <Suspense fallback={viewMode === 'map' ? <ExplorerMapSkeleton /> : <ExplorerGridSkeleton />}>
            <ExplorerRankingContent mode={mode} location={location} category={category} viewMode={viewMode} months={months} onScroll={onScroll} />
          </Suspense>
        )}
      </View>
    </SafeAreaView>
  )
}

function ExplorerCatalogContent({ location, category, viewMode, bottomContentInset, onScroll }: { location?: Location; category?: PlaceCategoryType; viewMode: ViewMode; bottomContentInset: number; onScroll: ReturnType<typeof useScrollStatus>['onScroll'] }) {
  if (viewMode === 'map') {
    return (
      <Suspense fallback={<ExplorerMapSkeleton />}>
        <ExplorerCatalogMap location={location} category={category} />
      </Suspense>
    )
  }

  return (
    <ScrollView style={{ flex: 1 }} onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingTop: 16, gap: 24, paddingBottom: bottomContentInset + 24 }}>
      <ErrorBoundary fallback={<EmptyState />}>
        <Suspense fallback={<SeasonalRegionsSectionSkeleton />}><SeasonalRegionsSection /></Suspense>
      </ErrorBoundary>
      <Suspense fallback={<PlaceCardSectionSkeleton />}><RecentHotPlacesSection location={location} category={category} /></Suspense>
      <Suspense fallback={<PlaceCardSectionSkeleton />}><MostSavedPlacesSection location={location} category={category} /></Suspense>
      <Suspense fallback={<PlaceListSectionSkeleton />}><MostVisitedPlacesSection location={location} category={category} /></Suspense>
    </ScrollView>
  )
}

function ExplorerCatalogMap({ location, category }: { location?: Location; category?: PlaceCategoryType }) {
  const attentionPlaces = useAttentionPlaces({ location, category })
  return <ExplorerMap places={attentionPlaces} location={location} />
}

function MostVisitedPlacesSection({ location, category }: { location?: Location; category?: PlaceCategoryType }) {
  const { data: visitedPlaces } = useExploredPlaces({ location, category })
  return <ExplorerPlaceSection title="가장 많이 방문하는 곳이에요" places={visitedPlaces.slice(0, 10)} countLabel={(place) => `${place.visitorCount.toLocaleString()}명 다녀옴`} detailPath="/explorer/top-visited" />
}

function RecentHotPlacesSection({ location, category }: { location?: Location; category?: PlaceCategoryType }) {
  const { data: hotPlaces } = useRecentHotPlaces(3, { location, category })
  return <ExplorerCardSection title="최근 핫한 곳이에요" places={hotPlaces.slice(0, 10)} countLabel={(place) => 'visitorCount' in place ? `${place.visitorCount.toLocaleString()}번 방문` : ''} detailPath="/explorer/recent-hot" />
}

function MostSavedPlacesSection({ location, category }: { location?: Location; category?: PlaceCategoryType }) {
  const { data: savedPlaces } = useMostSavedPlaces({ location, category })
  return <ExplorerCardSection title="많이 저장된 곳이에요" places={savedPlaces.slice(0, 10)} countLabel={(place) => 'saveCount' in place ? `${place.saveCount.toLocaleString()}번 저장됨` : ''} detailPath="/explorer/most-saved" />
}

function ExplorerRankingContent({ mode, location, category, viewMode, months, onScroll }: { mode: Exclude<ExplorerScreenMode, 'catalog'>; location?: Location; category?: PlaceCategoryType; viewMode: ViewMode; months: PeriodMonths; onScroll: ReturnType<typeof useScrollStatus>['onScroll'] }) {
  const { data: visitedPlaces } = useExploredPlaces({ location, category })
  const { data: hotPlaces } = useRecentHotPlaces(months, { location, category })
  const { data: savedPlaces } = useMostSavedPlaces({ location, category })
  const { width } = useWindowDimensions()
  const places = mode === 'top-visited' ? visitedPlaces : mode === 'recent-hot' ? hotPlaces : savedPlaces
  const router = useRouter()

  if (viewMode === 'map') {
    return <ExplorerMap places={places} location={location} />
  }

  return (
    <ScrollView style={{ flex: 1 }} onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16 }}>
        {places.map((place) => (
          <ExplorerPlaceCard
            key={place.placeId}
            width={(width - 44) / 2}
            place={{ ...place, countLabel: getCountLabel(mode, place) }}
            onPress={() => router.push(buildExplorerPlaceDetailPath(place.placeId))}
          />
        ))}
      </View>
      {places.length === 0 && <EmptyState />}
    </ScrollView>
  )
}

function ExplorerViewToggle({ value, onChange }: { value: ViewMode; onChange: (value: ViewMode) => void }) {
  return (
    <ToggleButtonGroup value={value} exclusive onChange={(_, next) => { if (next === 'list' || next === 'map') onChange(next) }} size="small">
      <ToggleButton value="list"><MaterialIcons name="format-list-bulleted" size={16} /></ToggleButton>
      <ToggleButton value="map"><MaterialIcons name="map" size={16} /></ToggleButton>
    </ToggleButtonGroup>
  )
}

function ExplorerMap({ places, location }: { places: Array<{ placeId: string; name: string; lat: number; lng: number; thumbnailUrl?: string }>; location?: Location }) {
  const router = useRouter()
  const defaultCenter = location == null ? undefined : getLocationCenter(location)

  return (
    <View style={{ flex: 1 }}>
      <Map defaultCenter={defaultCenter} autoFocus="marker" clustering clusterGridSize={60}>
        {places.map((place) => (
          <Map.Marker
            key={place.placeId}
            id={place.placeId}
            lat={place.lat}
            lng={place.lng}
            label={place.name}
            thumbnailUrl={place.thumbnailUrl}
            onClick={() => router.push(buildExplorerPlaceDetailPath(place.placeId))}
          />
        ))}
      </Map>
      <View pointerEvents="none" style={{ position: 'absolute', left: 16, right: 16, bottom: 16, padding: 10, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.92)' }}><Typography variant="caption" color="text.secondary">마커를 누르면 장소 정보를 볼 수 있어요</Typography></View>
    </View>
  )
}

function ExplorerPlaceSection({ title, places, countLabel, detailPath }: { title: string; places: Array<{ placeId: string; name: string; address: string; categories: PlaceCategoryType[]; thumbnailUrl?: string; destinations: string[]; visitorCount: number }>; countLabel: (place: (typeof places)[number]) => string; detailPath: string }) {
  const router = useRouter()

  return (
    <View>
      <SectionHeader title={title} onMore={() => router.push(detailPath)} />
      {places.length === 0 ? <EmptyState /> : places.map((place) => <ExplorerPlaceRow key={place.placeId} place={{ ...place, countLabel: countLabel(place) }} onPress={() => router.push(buildExplorerPlaceDetailPath(place.placeId))} />)}
    </View>
  )
}

function ExplorerCardSection({ title, places, countLabel, detailPath }: { title: string; places: ExplorerPlace[]; countLabel: (place: (typeof places)[number]) => string; detailPath: string }) {
  const router = useRouter()

  return (
    <View>
      <SectionHeader title={title} onMore={() => router.push(detailPath)} />
      {places.length === 0 ? <EmptyState /> : <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>{places.map((place) => <ExplorerPlaceCard key={place.placeId} width={160} place={{ ...place, countLabel: countLabel(place) }} onPress={() => router.push(buildExplorerPlaceDetailPath(place.placeId))} />)}</ScrollView>}
    </View>
  )
}

function SeasonalRegionsSection() {
  const { data: trends, season, referenceYear } = useRegionTourismTrends()
  const router = useRouter()

  return (
    <View>
      <SectionHeader title={`이번 ${SeasonLabel[season]} 국내 인기 여행지`} onMore={() => router.push('/explorer/top-visited')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
        {trends.slice(0, 10).map((trend, index) => <Pressable key={trend.location} onPress={() => router.push(`/explorer?location=${encodeURIComponent(trend.location)}`)} style={{ width: 160, padding: 14, borderWidth: 1, borderColor: palette.divider, borderRadius: radius.lg, gap: 8 }}><Typography variant="caption" color="text.secondary">{referenceYear}년 기준 · {index + 1}위</Typography><Typography variant="subtitle1">{trend.location}</Typography><Typography variant="h6" color="primary">+{Math.round(trend.growthRate * 100)}%</Typography><Typography variant="caption" color="text.secondary">{formatKoreanCount(trend.visitorGrowth)}명 증가</Typography></Pressable>)}
      </ScrollView>
    </View>
  )
}

function SectionHeader({ title, onMore }: { title: string; onMore: () => void }) {
  return <View style={{ paddingHorizontal: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Typography variant="subtitle1">{title}</Typography><Pressable onPress={onMore}><Typography variant="caption" color="text.secondary">더보기 ›</Typography></Pressable></View>
}

function PeriodFilterChip({ months, onChange }: { months: PeriodMonths; onChange: (months: PeriodMonths) => void }) {
  const overlay = useOverlay()
  const currentLabel = PERIOD_OPTIONS.find((option) => option.value === months)?.label ?? ''

  return <Chip label={currentLabel} size="small" variant="outlined" color="primary" onClick={() => overlay.open(({ isOpen, close }) => <BottomSheet isOpen={isOpen} onDismiss={close}><BottomSheet.Header>기간 선택</BottomSheet.Header><BottomSheet.Body><View style={{ padding: 16, gap: 8 }}>{PERIOD_OPTIONS.map((option) => <Pressable key={option.value} onPress={() => { onChange(option.value); close() }} style={{ paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between' }}><Typography fontWeight={option.value === months ? 'bold' : 'medium'}>{option.label}</Typography>{option.value === months && <Typography color="primary">✓</Typography>}</Pressable>)}</View></BottomSheet.Body></BottomSheet>)} />
}

function EmptyState() {
  return <View style={{ alignItems: 'center', paddingHorizontal: 16, paddingVertical: 32 }}><Typography variant="body2" color="text.secondary">자료를 찾을 수 없어요</Typography></View>
}

function SeasonalRegionsSectionSkeleton() {
  return (
    <View style={{ gap: 12 }}>
      <Skeleton width={200} height={28} sx={{ marginHorizontal: 16 }} />
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, overflow: 'hidden' }}>
        {Array.from({ length: 3 }).map((_, index) => (
          <View key={index} style={{ width: 150, flexShrink: 0, padding: 16, gap: 8, borderWidth: 1, borderColor: palette.divider, borderRadius: radius.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Skeleton variant="circular" width={20} height={20} />
              <Skeleton width="55%" height={24} />
            </View>
            <Skeleton width="45%" height={32} />
            <Skeleton width="60%" height={16} />
            <Skeleton width="55%" height={16} />
          </View>
        ))}
      </View>
    </View>
  )
}

function PlaceCardSectionSkeleton() {
  return (
    <View style={{ gap: 12 }}>
      <Skeleton width={140} height={28} sx={{ marginHorizontal: 16 }} />
      <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 16, overflow: 'hidden' }}>
        {Array.from({ length: 3 }).map((_, index) => (
          <View key={index} style={{ width: 160, flexShrink: 0, overflow: 'hidden', borderWidth: 1, borderColor: palette.divider, borderRadius: radius.lg }}>
            <Skeleton variant="rectangular" width="100%" height={160} />
            <View style={{ padding: 12, gap: 6 }}>
              <Skeleton width="80%" height={16} />
              <Skeleton width={60} height={14} />
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}

function PlaceListSectionSkeleton() {
  return (
    <View>
      <Skeleton width={180} height={28} sx={{ marginHorizontal: 16, marginBottom: 12 }} />
      {Array.from({ length: 5 }).map((_, index) => (
        <View key={index} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 }}>
          <Skeleton variant="rounded" width={64} height={64} />
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton width="60%" height={16} />
            <Skeleton width="80%" height={14} />
            <Skeleton width={80} height={14} />
          </View>
        </View>
      ))}
    </View>
  )
}

function ExplorerGridSkeleton() {
  const { width } = useWindowDimensions()
  const cardWidth = (width - 44) / 2

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 16 }}>
      {Array.from({ length: 10 }).map((_, index) => (
        <View key={index} style={{ width: cardWidth, overflow: 'hidden', borderWidth: 1, borderColor: palette.divider, borderRadius: radius.lg }}>
          <Skeleton variant="rectangular" width="100%" height={cardWidth} />
          <View style={{ padding: 12, gap: 6 }}>
            <Skeleton width="70%" height={16} />
            <Skeleton width={60} height={14} />
          </View>
        </View>
      ))}
    </View>
  )
}

function ExplorerMapSkeleton() {
  return <Skeleton variant="rectangular" width="100%" height="100%" />
}

function getExplorerTitle(mode: ExplorerScreenMode): string {
  if (mode === 'top-visited') return '최다 방문'
  if (mode === 'recent-hot') return '핫플레이스'
  if (mode === 'most-saved') return '많이 저장된 곳'
  return '탐색'
}

function getCountLabel(mode: Exclude<ExplorerScreenMode, 'catalog'>, place: ExplorerPlace): string {
  if (mode === 'most-saved' && 'saveCount' in place) return `${place.saveCount.toLocaleString()}번 저장됨`
  if ('visitorCount' in place) return `${place.visitorCount.toLocaleString()}번 방문`
  return ''
}

function getLocationCenter(location: Location) {
  return getCoordinateByLocation(location)
}

function useViewMode(): [ViewMode, (next: ViewMode) => void] {
  const [viewMode, setViewMode] = useQueryParamState<ViewMode>('view', { defaultValue: 'list', parse: parseViewMode })
  return [viewMode, setViewMode]
}

function parseViewMode(value: string): ViewMode {
  return value === 'map' ? 'map' : 'list'
}
