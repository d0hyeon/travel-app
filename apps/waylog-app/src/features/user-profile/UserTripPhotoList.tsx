import { useState } from 'react'
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native'
import type { Photo } from '@waylog/domains/modules/photo'
import { useTripPhotos } from '../trip/trip-photo/useTripPhotos'
import { BottomSheet } from '../../shared/components/bottom-sheet/BottomSheet'
import { Typography } from '../../shared/components/mui'
import { useOverlay } from '../../shared/hooks/useOverlay'
import { LoadableImage } from '../../shared/components/LoadableImage'

export function UserTripPhotoList({ tripId }: { tripId: string }) {
  const { data: photos } = useTripPhotos(tripId)
  const { width } = useWindowDimensions()
  const overlay = useOverlay()
  const cellSize = (width - 48) / 3

  if (photos.length === 0) return <Typography variant="caption" color="text.secondary">사진이 없어요</Typography>

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
      {photos.map((photo, index) => <Pressable key={photo.id} onPress={() => overlay.open(({ isOpen, close }) => <PhotoPreviewSheet isOpen={isOpen} onClose={close} photos={photos} initialIndex={index} />)}><LoadableImage source={{ uri: photo.url }} style={{ width: cellSize, height: cellSize, borderRadius: 6 }} resizeMode="cover" /></Pressable>)}
    </View>
  )
}

function PhotoPreviewSheet({ isOpen, onClose, photos, initialIndex }: { isOpen: boolean; onClose: () => void; photos: Photo[]; initialIndex: number }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const { width } = useWindowDimensions()
  const currentPhoto = photos[currentIndex]

  return <BottomSheet isOpen={isOpen} onClose={onClose} snapPoints={[0.9]} safeArea sx={{ backgroundColor: '#111' }}><BottomSheet.Header><Typography color="#fff">사진 {currentIndex + 1} / {photos.length}</Typography></BottomSheet.Header><BottomSheet.Body><ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} contentOffset={{ x: initialIndex * width, y: 0 }} onMomentumScrollEnd={(event) => setCurrentIndex(Math.round(event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width))}>{photos.map((photo) => <View key={photo.id} style={{ width, justifyContent: 'center' }}><LoadableImage source={{ uri: photo.url }} style={{ width: '100%', height: 360 }} resizeMode="contain" /></View>)}</ScrollView><Typography variant="caption" color="#fff" sx={{ padding: 16 }}>{currentPhoto?.createdAt.slice(0, 10)}</Typography></BottomSheet.Body></BottomSheet>
}
