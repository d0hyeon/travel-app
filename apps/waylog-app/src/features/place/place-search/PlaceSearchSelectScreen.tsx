import { calcDistance } from '@waylog/utility'
import { usePlaceSearch, type PlaceResult } from '@waylog/domains/modules/place'
import type { Coordinate, MapBounds, MapProvider, MapRef } from '@waylog/domains/modules/map'
import { useEffect, useRef, useState, useTransition } from 'react'
import { StyleSheet, ActivityIndicator, FlatList, View } from 'react-native'
import { Map } from '../../../shared/components/Map'
import { Button, Chip } from '~/shared/components/design-system'
import { ListItem } from '../../../shared/components/ListItem'
import { palette } from '../../../shared/config/tokens'

const MARKER_COLORS = ['#66BB6A', '#EB5757', '#5DADE2', '#7986CB']

const SEARCH_HERE_THRESHOLD_M = 500

function boundsToCenter(bounds: MapBounds): Coordinate {
  return {
    lat: (bounds.north + bounds.south) / 2,
    lng: (bounds.east + bounds.west) / 2,
  }
}

function isFarEnough(a: Coordinate, b: Coordinate | null): boolean {
  if (b == null) return false
  return calcDistance(a, b) >= SEARCH_HERE_THRESHOLD_M
}

interface Props {
  keyword?: string
  center?: Coordinate
  mapServiceProvider?: MapProvider
  onSelect: (value: PlaceResult) => void
}

// 웹 PlaceSearchSelectScreen 의 지도+리스트 스플릿을 세로 배치로 옮긴다.
// SplitView(리사이즈 가능한 좌우 분할)는 데스크탑 전용 표현이라 대응 개념이 없다.
export function PlaceSearchSelectScreen({ keyword, center, mapServiceProvider = 'kakao', onSelect }: Props) {
  const [searchCenter, setSearchCenter] = useState(center)
  // 버튼 노출 판정 기준. 실제로 검색에 쓴 중심을 따라간다.
  const [searchedCenter, setSearchedCenter] = useState<Coordinate | null>(center ?? null)
  const { data: results, hasNextPage, isFetchingNextPage, fetchNextPage } = usePlaceSearch({
    keyword,
    service: mapServiceProvider,
    location: searchCenter,
  })
  const mapRef = useRef<MapRef>(null)
  const listRef = useRef<FlatList<PlaceResult>>(null)
  const [activeExternalId, setActiveExternalId] = useState<string | null>(null)

  useEffect(() => {
    const [result] = results
    if (result) {
      mapRef.current?.panTo(result.lat, result.lng, 2)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword])

  // 축척은 그대로 두고 중심만 옮긴다. 보던 범위가 매번 바뀌면 맥락을 잃는다.
  const focusFromList = (place: PlaceResult) => {
    setActiveExternalId(place.externalId)
    mapRef.current?.panTo(place.lat, place.lng)
  }

  // 마커에서 온 경우에만 목록을 옮긴다. 행을 눌렀을 때도 스크롤하면
  // 이미 보고 있던 항목이 가운데로 튄다.
  const focusFromMarker = (place: PlaceResult, index: number) => {
    focusFromList(place)
    listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 })
  }

  const [mapBoundsCenter, setMapBoundsCenter] = useState<Coordinate | null>(null)
  // 직전 렌더의 지도 중심이 아니라 실제로 검색에 쓴 중심과 비교해야 한다.
  // 자기 자신과 비교하면 다음 렌더에서 거리가 0 이 되어 버튼이 뜨자마자 사라진다.
  const isFarFromLastSearch = mapBoundsCenter != null && isFarEnough(mapBoundsCenter, searchedCenter)

  const [isPendingSelect, startTransition] = useTransition()

  return (
    <View style={styles.screen}>
      <View style={styles.mapArea}>
        <Map
          ref={mapRef}
          defaultCenter={center}
          autoFocus="marker"
          onBoundsChange={(bounds) => {
            const nextCenter = boundsToCenter(bounds)
            setMapBoundsCenter(nextCenter)
            // center 없이 열리면 비교 기준이 없다. 첫 지도 중심을 기준으로 삼는다.
            // searchCenter 를 건드리면 쿼리 키가 바뀌어 불필요한 재검색이 돈다.
            setSearchedCenter((current) => current ?? nextCenter)
          }}
        >
          {results.map((place, index) => (
            <Map.Marker
              key={place.externalId}
              lat={place.lat}
              lng={place.lng}
              label={place.name}
              color={MARKER_COLORS[index % MARKER_COLORS.length]}
              onPress={() => focusFromMarker(place, index)}
            />
          ))}
        </Map>
        {isFarFromLastSearch && (
          <View style={styles.searchStatus}>
            <Chip
              label="이 장소에서 검색"
              color="primary"
              onPress={() => {
                setSearchCenter(mapBoundsCenter)
                setSearchedCenter(mapBoundsCenter)
              }}
            />
          </View>
        )}
      </View>

      <FlatList
        ref={listRef}
        style={styles.results}
        data={results}
        keyExtractor={(place) => place.externalId}
        contentContainerStyle={styles.resultsContent}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage()
        }}
        onEndReachedThreshold={0.5}
        // 행 높이가 주소 유무로 달라 오프셋을 미리 알 수 없다.
        // 대략 위치로 옮긴 뒤 다음 프레임에 다시 맞춘다.
        onScrollToIndexFailed={({ index, averageItemLength }) => {
          listRef.current?.scrollToOffset({ offset: index * averageItemLength, animated: true })
          requestAnimationFrame(() => {
            listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 })
          })
        }}
        renderItem={({ item, index }) => (
          <ListItem.Button
            focused={item.externalId === activeExternalId}
            onPress={() => focusFromList(item)}
            leftAddon={<MarkerDot color={MARKER_COLORS[index % MARKER_COLORS.length]!} />}
            rightAddon={
              <Button
                variant="contained"
                loading={isPendingSelect}
                onPress={() => startTransition(() => onSelect(item))}
              >
                선택
              </Button>
            }
          >
            <ListItem.Title>{item.name}</ListItem.Title>
            {item.address !== '' && <ListItem.Text>{item.address}</ListItem.Text>}
          </ListItem.Button>
        )}
        ListFooterComponent={
          isFetchingNextPage ? <ActivityIndicator style={styles.loadingMore} color={palette.primary} /> : null
        }
      />
    </View>
  )
}

function MarkerDot({ color }: { color: string }) {
  return (
    <View
      style={[styles.categoryDot, { backgroundColor: color }]}
    />
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  mapArea: { height: '40%', position: 'relative' },
  searchStatus: { position: 'absolute', top: 12, alignSelf: 'center' },
  results: { flex: 1 },
  resultsContent: { gap: 8, padding: 16 },
  loadingMore: { paddingVertical: 8 },
  categoryDot: { width: 12, height: 12, borderRadius: 6 },
})
