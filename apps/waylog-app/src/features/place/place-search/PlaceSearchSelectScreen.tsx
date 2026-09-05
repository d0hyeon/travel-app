import { calcDistance } from '@waylog/utility'
import { usePlaceSearch, type PlaceResult } from '@waylog/domains/modules/place'
import type { Coordinate, MapBounds, MapProvider, MapRef } from '@waylog/domains/modules/map'
import { usePreservedValue } from '@waylog/react'
import { useEffect, useRef, useState, useTransition } from 'react'
import { ActivityIndicator, FlatList, View } from 'react-native'
import { Map } from '../../../shared/components/Map'
import { Button, Chip } from '../../../shared/components/mui'
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
  const { data: results, hasNextPage, isFetchingNextPage, fetchNextPage } = usePlaceSearch({
    keyword,
    service: mapServiceProvider,
    location: searchCenter,
  })
  const mapRef = useRef<MapRef>(null)

  useEffect(() => {
    const [result] = results
    if (result) {
      mapRef.current?.panTo(result.lat, result.lng, 2)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword])

  const [mapBoundsCenter, setMapBoundsCenter] = useState<Coordinate | null>(null)
  const getLastSearchedCenter = usePreservedValue(mapBoundsCenter)
  const isFarFromLastSearch = mapBoundsCenter != null && isFarEnough(mapBoundsCenter, getLastSearchedCenter())

  const [isPendingSelect, startTransition] = useTransition()

  return (
    <View style={{ flex: 1 }}>
      <View style={{ height: '40%', position: 'relative' }}>
        <Map
          ref={mapRef}
          defaultCenter={center}
          autoFocus="marker"
          onBoundsChange={(bounds) => setMapBoundsCenter(boundsToCenter(bounds))}
        >
          {results.map((place, index) => (
            <Map.Marker
              key={place.externalId}
              lat={place.lat}
              lng={place.lng}
              label={place.name}
              color={MARKER_COLORS[index % MARKER_COLORS.length]}
            />
          ))}
        </Map>
        {isFarFromLastSearch && (
          <View style={{ position: 'absolute', top: 12, alignSelf: 'center' }}>
            <Chip
              label="이 장소에서 검색"
              color="primary"
              onClick={() => setSearchCenter(mapBoundsCenter!)}
            />
          </View>
        )}
      </View>

      <FlatList
        style={{ flex: 1 }}
        data={results}
        keyExtractor={(place) => place.externalId}
        contentContainerStyle={{ gap: 8, padding: 16 }}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage()
        }}
        onEndReachedThreshold={0.5}
        renderItem={({ item, index }) => (
          <ListItem
            leftAddon={<MarkerDot color={MARKER_COLORS[index % MARKER_COLORS.length]!} />}
            rightAddon={
              <Button
                variant="contained"
                loading={isPendingSelect}
                onClick={() => startTransition(() => onSelect(item))}
              >
                선택
              </Button>
            }
          >
            <ListItem.Title onPress={() => mapRef.current?.panTo(item.lat, item.lng, 2)}>
              {item.name}
            </ListItem.Title>
            {item.address !== '' && <ListItem.Text>{item.address}</ListItem.Text>}
          </ListItem>
        )}
        ListFooterComponent={
          isFetchingNextPage ? <ActivityIndicator style={{ paddingVertical: 8 }} color={palette.primary} /> : null
        }
      />
    </View>
  )
}

function MarkerDot({ color }: { color: string }) {
  return (
    <View
      style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color }}
    />
  )
}
