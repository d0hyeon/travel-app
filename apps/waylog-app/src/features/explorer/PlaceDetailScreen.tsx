import { MaterialIcons } from '@expo/vector-icons'
import { usePlace } from '@waylog/domains/modules/place'
import { useRouter } from 'expo-router'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native'
import { Suspense, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Map } from '../../shared/components/Map'
import { Tab, Tabs, Typography } from '~/shared/components/design-system'
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
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="장소 상세 닫기" onPress={() => router.back()} hitSlop={8} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={22} color={palette.text} />
        </Pressable>
        <Typography variant="subtitle1" numberOfLines={1} style={styles.headerTitle}>{place.name}</Typography>
        <View style={styles.headerSpacer} />
      </View>
      <Tabs value={currentTab} onChange={(_, next) => selectTab(parsePlaceDetailTab(next))}>
        <Tab value="info" label="기본정보" />
        <Tab value="feed" label="피드" />
      </Tabs>
      {/* 루트의 전역 Suspense 가 여기서 잡히지 않으면 탭 전환마다 화면 전체가 로딩으로 바뀐다. */}
      <Suspense fallback={<TabContentLoading />}>
        {currentTab === 'info' ? <PlaceInfoContent placeId={placeId} /> : <PlaceFeedContent placeId={placeId} />}
      </Suspense>
    </View>
  )
}

function TabContentLoading() {
  return (
    <View style={styles.tabContentLoading}>
      <ActivityIndicator />
    </View>
  )
}

function PlaceInfoContent({ placeId }: { placeId: string }) {
  const { data: place } = usePlace(placeId)
  const { data: photos } = useExplorerPlacePhotos(placeId)

  return (
    <ScrollView style={styles.flex1} contentContainerStyle={styles.infoContent} showsVerticalScrollIndicator={false}>
      <View style={styles.mapContainer}>
        <Map defaultCenter={{ lat: place.lat, lng: place.lng }}>
          <Map.Marker id={place.id} lat={place.lat} lng={place.lng} label={place.name} />
        </Map>
      </View>
      <View style={styles.infoText}>
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
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoStrip}>
      {photos.map((photoUrl, index) => (
        <Pressable key={photoUrl} onPress={() => overlay.open(({ isOpen, onClose }) => <PlacePhotoViewer photos={photos} initialIndex={index} isOpen={isOpen} onClose={onClose} />)}>
          <LoadableImage source={{ uri: photoUrl }} style={[styles.thumbnail, { width: photoWidth }]} resizeMode="cover" />
        </Pressable>
      ))}
    </ScrollView>
  )
}

function PlacePhotoViewer({ photos, initialIndex, isOpen, onClose }: { photos: string[]; initialIndex: number; isOpen: boolean; onClose: () => void }) {
  const { width } = useWindowDimensions()
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  return (
    <BottomSheet isOpen={isOpen} onDismiss={onClose} snapPoints={[0.9]} safeArea style={styles.viewer}>
      <BottomSheet.Header><Typography color="#fff">사진 {currentIndex + 1} / {photos.length}</Typography></BottomSheet.Header>
      <BottomSheet.Body>
        <BottomSheet.ScrollView
          horizontal
          pagingEnabled
          contentOffset={{ x: initialIndex * width, y: 0 }}
          onMomentumScrollEnd={(event) => setCurrentIndex(Math.round(event.nativeEvent.contentOffset.x / width))}
        >
          {photos.map((photoUrl) => <LoadableImage key={photoUrl} source={{ uri: photoUrl }} style={[styles.viewerPhoto, { width }]} resizeMode="contain" />)}
        </BottomSheet.ScrollView>
      </BottomSheet.Body>
    </BottomSheet>
  )
}

function PlaceFeedContent({ placeId }: { placeId: string }) {
  const { data: posts } = useExplorerPlaceFeed(placeId)
  const router = useRouter()

  if (posts.length === 0) {
    return <View style={styles.emptyFeed}><Typography variant="body2" color="text.secondary">아직 이 장소의 기록이 없어요</Typography></View>
  }

  return (
    <ScrollView style={styles.feed} contentContainerStyle={styles.feedContent} showsVerticalScrollIndicator={false}>
      {posts.map((post) => <PostCard key={post.id} post={post} onPress={() => router.push(`/post/${post.id}`)} />)}
    </ScrollView>
  )
}

function parsePlaceDetailTab(value: string): PlaceDetailTab {
  return value === 'feed' ? 'feed' : 'info'
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  header: { height: 52, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: palette.divider },
  backButton: { padding: 8 },
  headerTitle: { flex: 1, textAlign: 'center' },
  headerSpacer: { width: 38 },
  tabContentLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  flex1: { flex: 1 },
  infoContent: { padding: 16, gap: 16, paddingBottom: 32 },
  mapContainer: { height: 220, borderRadius: radius.lg, overflow: 'hidden' },
  infoText: { gap: 8 },
  photoStrip: { gap: 8 },
  thumbnail: { height: 92, borderRadius: radius.md },
  viewer: { backgroundColor: '#111' },
  viewerPhoto: { height: 420 },
  emptyFeed: { alignItems: 'center', paddingVertical: 80 },
  feed: { flex: 1 },
  feedContent: { gap: 16, padding: 16, paddingBottom: 32 },
})
