import { StyleSheet, Pressable, ScrollView } from 'react-native'
import { LoadableImage } from '../../shared/components/LoadableImage'
import { PhotoBottomSheet } from '../../shared/components/photo/PhotoBottomSheet'
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
      <PhotoBottomSheet photos={photos} initialIndex={initialIndex} isOpen={isOpen} onClose={close} />
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

const styles = StyleSheet.create({
  photoStrip: { gap: 8 },
  thumbnail: { width: 100, height: 80, borderRadius: 8 },
})
