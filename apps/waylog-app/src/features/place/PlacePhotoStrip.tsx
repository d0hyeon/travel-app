import type { Photo } from '@waylog/domains/modules/photo'
import { Pressable, ScrollView, StyleSheet } from 'react-native'
import { LoadableImage } from '../../shared/components/LoadableImage'
import { PhotoBottomSheet } from '../../shared/components/photo/PhotoBottomSheet'
import { useOverlay } from '../../shared/hooks/useOverlay'

interface Props {
  photos: Photo[]
  thumbnailWidth?: number
}

/** 장소 사진을 가로로 훑고, 누르면 공용 상세 뷰어를 연다. 읽기 전용이다. */
export function PlacePhotoStrip({ photos, thumbnailWidth = 100 }: Props) {
  const overlay = useOverlay()

  const openPhotoViewer = (initialIndex: number) => {
    overlay.open(({ isOpen, close }) => (
      <PhotoBottomSheet photos={photos} initialIndex={initialIndex} isOpen={isOpen} onClose={close} />
    ))
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoStrip}>
      {photos.map((photo, index) => (
        <Pressable key={photo.id} onPress={() => openPhotoViewer(index)}>
          <LoadableImage
            source={{ uri: photo.url }}
            style={[styles.thumbnail, { width: thumbnailWidth }]}
            resizeMode="cover"
          />
        </Pressable>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  photoStrip: { gap: 8 },
  thumbnail: { height: 80, borderRadius: 8 },
})
