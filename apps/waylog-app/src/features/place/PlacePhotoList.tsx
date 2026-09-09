import { useState } from 'react'
import { StyleSheet, Pressable, ScrollView, useWindowDimensions } from 'react-native'
import { BottomSheet } from '../../shared/components/bottom-sheet/BottomSheet'
import { LoadableImage } from '../../shared/components/LoadableImage'
import { Typography } from '~/shared/components/design-system'
import { useOverlay } from '../../shared/hooks/useOverlay'
import { usePlacePhotos } from './usePlacePhotos'

interface Props {
  placeId: string
}

export function PlacePhotoList({ placeId }: Props) {
  const { data: photos } = usePlacePhotos(placeId)
  const overlay = useOverlay()

  const openPhotoViewer = (initialIndex: number) => {
    overlay.open(({ isOpen, close }) => (
      <PhotoViewerSheet photos={photos.map((photo) => photo.url)} initialIndex={initialIndex} isOpen={isOpen} onClose={close} />
    ))
  }

  if (photos.length === 0) {
    return null
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoStrip}>
      {photos.map((photo, index) => (
        <Pressable key={photo.id} onPress={() => openPhotoViewer(index)}>
          <LoadableImage source={{ uri: photo.url }} style={styles.thumbnail} resizeMode="cover" />
        </Pressable>
      ))}
    </ScrollView>
  )
}

interface PhotoViewerSheetProps {
  photos: string[]
  initialIndex: number
  isOpen: boolean
  onClose: () => void
}

function PhotoViewerSheet({ photos, initialIndex, isOpen, onClose }: PhotoViewerSheetProps) {
  const { width } = useWindowDimensions()
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  return (
    <BottomSheet isOpen={isOpen} onDismiss={onClose} snapPoints={[0.9]} safeArea style={styles.viewer}>
      <BottomSheet.Header>
        <Typography color="#fff">사진 {currentIndex + 1} / {photos.length}</Typography>
      </BottomSheet.Header>
      <BottomSheet.Body>
        <BottomSheet.ScrollView
          horizontal
          pagingEnabled
          contentOffset={{ x: initialIndex * width, y: 0 }}
          onMomentumScrollEnd={(event) => setCurrentIndex(Math.round(event.nativeEvent.contentOffset.x / width))}
        >
          {photos.map((photoUrl) => (
            <LoadableImage key={photoUrl} source={{ uri: photoUrl }} style={[styles.viewerPhoto, { width }]} resizeMode="contain" />
          ))}
        </BottomSheet.ScrollView>
      </BottomSheet.Body>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  photoStrip: { gap: 8 },
  thumbnail: { width: 100, height: 80, borderRadius: 8 },
  viewer: { backgroundColor: '#111' },
  viewerPhoto: { height: 420 },
})
