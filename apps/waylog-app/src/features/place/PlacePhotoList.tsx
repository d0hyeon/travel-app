import { useState } from 'react'
import { Pressable, ScrollView, useWindowDimensions } from 'react-native'
import { BottomSheet } from '../../shared/components/bottom-sheet/BottomSheet'
import { LoadableImage } from '../../shared/components/LoadableImage'
import { Typography } from '../../shared/components/mui'
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
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {photos.map((photo, index) => (
        <Pressable key={photo.id} onPress={() => openPhotoViewer(index)}>
          <LoadableImage source={{ uri: photo.url }} style={{ width: 100, height: 80, borderRadius: 8 }} resizeMode="cover" />
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
    <BottomSheet isOpen={isOpen} onDismiss={onClose} snapPoints={[0.9]} safeArea sx={{ backgroundColor: '#111' }}>
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
            <LoadableImage key={photoUrl} source={{ uri: photoUrl }} style={{ width, height: 420 }} resizeMode="contain" />
          ))}
        </BottomSheet.ScrollView>
      </BottomSheet.Body>
    </BottomSheet>
  )
}
