import { MaterialIcons } from '@expo/vector-icons'
import { usePlace } from '@waylog/domains/modules/place'
import { useRouter } from 'expo-router'
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native'
import { useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Map } from '../../shared/components/Map'
import { Tab, Tabs, Typography } from '../../shared/components/mui'
import { palette, radius } from '../../shared/config/tokens'
import { BottomSheet } from '../../shared/components/bottom-sheet/BottomSheet'
import { useOverlay } from '../../shared/hooks/useOverlay'
import { PostCard } from '../post/PostCard'
import { useQueryParamState } from '../../shared/hooks/useQueryParamState'
import { useExplorerPlaceFeed } from './useExplorerPlaceFeed'
import { useExplorerPlacePhotos } from './useExplorerPlacePhotos'
import { LoadableImage } from '../../shared/components/LoadableImage'

type PlaceDetailTab = 'info' | 'feed'

export function PlaceDetailScreen({ placeId }: { placeId: string }) {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [currentTab, selectTab] = useQueryParamState<PlaceDetailTab>('tab', {
    defaultValue: 'info',
    parse: parsePlaceDetailTab,
  })
  const { data: place } = usePlace(placeId)

  return (
    <View style={{ flex: 1, backgroundColor: palette.background, paddingTop: insets.top }}>
      <View style={{ height: 52, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: palette.divider }}>
        <Pressable accessibilityLabel="장소 상세 닫기" onPress={() => router.back()} hitSlop={8} style={{ padding: 8 }}>
          <MaterialIcons name="arrow-back" size={22} color={palette.text} />
        </Pressable>
        <Typography variant="subtitle1" numberOfLines={1} sx={{ flex: 1, textAlign: 'center' }}>{place.name}</Typography>
        <View style={{ width: 38 }} />
      </View>
      <Tabs value={currentTab} onChange={(_, next) => selectTab(parsePlaceDetailTab(next))}>
        <Tab value="info" label="기본정보" />
        <Tab value="feed" label="피드" />
      </Tabs>
      {currentTab === 'info' ? <PlaceInfoContent placeId={placeId} /> : <PlaceFeedContent placeId={placeId} />}
    </View>
  )
}

function PlaceInfoContent({ placeId }: { placeId: string }) {
  const { data: place } = usePlace(placeId)
  const { data: photos } = useExplorerPlacePhotos(placeId)

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
      <View style={{ height: 220, borderRadius: radius.lg, overflow: 'hidden' }}>
        <Map defaultCenter={{ lat: place.lat, lng: place.lng }}>
          <Map.Marker id={place.id} lat={place.lat} lng={place.lng} label={place.name} />
        </Map>
      </View>
      <View style={{ gap: 8 }}>
        <Typography variant="subtitle1">{place.name}</Typography>
        {place.address !== '' && <Typography variant="body2" color="text.secondary">{place.address}</Typography>}
      </View>
      {photos.length > 0 && <PlacePhotoStrip photos={photos.map((photo) => photo.url)} />}
    </ScrollView>
  )
}

function PlacePhotoStrip({ photos }: { photos: string[] }) {
  const { width } = useWindowDimensions()
  const photoWidth = Math.min(120, Math.max(96, width * 0.28))
  const overlay = useOverlay()

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {photos.map((photoUrl, index) => (
        <Pressable key={photoUrl} onPress={() => overlay.open(({ isOpen, onClose }) => <PlacePhotoViewer photos={photos} initialIndex={index} isOpen={isOpen} onClose={onClose} />)}>
          <LoadableImage source={{ uri: photoUrl }} style={{ width: photoWidth, height: 92, borderRadius: radius.md }} resizeMode="cover" />
        </Pressable>
      ))}
    </ScrollView>
  )
}

function PlacePhotoViewer({ photos, initialIndex, isOpen, onClose }: { photos: string[]; initialIndex: number; isOpen: boolean; onClose: () => void }) {
  const { width } = useWindowDimensions()
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  return (
    <BottomSheet isOpen={isOpen} onDismiss={onClose} snapPoints={[0.9]} safeArea sx={{ backgroundColor: '#111' }}>
      <BottomSheet.Header><Typography color="#fff">사진 {currentIndex + 1} / {photos.length}</Typography></BottomSheet.Header>
      <BottomSheet.Body>
        <ScrollView
          horizontal
          pagingEnabled
          contentOffset={{ x: initialIndex * width, y: 0 }}
          onMomentumScrollEnd={(event) => setCurrentIndex(Math.round(event.nativeEvent.contentOffset.x / width))}
        >
          {photos.map((photoUrl) => <LoadableImage key={photoUrl} source={{ uri: photoUrl }} style={{ width, height: 420 }} resizeMode="contain" />)}
        </ScrollView>
      </BottomSheet.Body>
    </BottomSheet>
  )
}

function PlaceFeedContent({ placeId }: { placeId: string }) {
  const { data: posts } = useExplorerPlaceFeed(placeId)
  const router = useRouter()

  if (posts.length === 0) {
    return <View style={{ alignItems: 'center', paddingVertical: 80 }}><Typography variant="body2" color="text.secondary">아직 이 장소의 기록이 없어요</Typography></View>
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 16, padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
      {posts.map((post) => <PostCard key={post.id} post={post} onPress={() => router.push(`/post/${post.id}`)} />)}
    </ScrollView>
  )
}

function parsePlaceDetailTab(value: string): PlaceDetailTab {
  return value === 'feed' ? 'feed' : 'info'
}
