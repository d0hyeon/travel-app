import { useState } from 'react'
import { Image, Pressable, View, useWindowDimensions } from 'react-native'
import type { Photo } from '@waylog/domains/modules/photo'
import { useTripPhotos } from '../trip/trip-photo/useTripPhotos'
import { BottomSheet } from '../../shared/components/bottom-sheet/BottomSheet'
import { Button, Typography } from '../../shared/components/mui'
import { useOverlay } from '../../shared/hooks/useOverlay'
import { LoadableImage } from '../../shared/components/LoadableImage'
import { PhotoVisibilityBadge } from '../../shared/components/photo/PhotoVisibilityBadge'
import { ZoomArea } from '../../shared/components/photo/ZoomArea'
import { ScrollView } from 'react-native-gesture-handler'

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

// 웹 PhotoBottomSheet 와 같은 자리다. 이 화면은 onUpdate·onDelete·places 를 넘기지 않아
// 웹에서도 더보기 메뉴·장소 선택·삭제 버튼이 뜨지 않는다 — 그 구성 그대로 옮긴다.
function PhotoPreviewSheet({ isOpen, onClose, photos, initialIndex }: { isOpen: boolean; onClose: () => void; photos: Photo[]; initialIndex: number }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const { width } = useWindowDimensions()
  // 웹은 ZoomArea 에 height="100%" 를 주어 시트 Body 를 그대로 채운다.
  // 앱은 고정 픽셀로 재는 대신 실제 렌더된 Body 높이를 측정해 맞춘다.
  const [imagePagerHeight, setImagePagerHeight] = useState(560)
  const [isZooming, setIsZooming] = useState(false)
  const currentPhoto = photos[currentIndex]

  return (
    <BottomSheet isOpen={isOpen} onDismiss={onClose} snapPoints={[0.95]} defaultSnapIndex={0} safeArea sx={{ backgroundColor: '#010101' }}>
      <BottomSheet.Header alignItems="center" justifyContent="center" sx={{ backgroundColor: '#010101' }}>
        {currentPhoto?.isPublic === true && (
          <PhotoVisibilityBadge style={{ position: 'absolute', left: 16 }} />
        )}
        <Typography variant="body2" sx={{ color: '#fff', fontWeight: '800' }}>{currentIndex + 1} / {photos.length}</Typography>
      </BottomSheet.Header>
      <BottomSheet.Body
        sx={{ backgroundColor: '#010101' }}
        onLayout={(event) => {
          const height = Math.round(event.nativeEvent.layout.height)
          if (height > 0) setImagePagerHeight(height)
        }}
      >
        <BottomSheet.GestureArea sx={{ height: '100%' }}>
          <ScrollView
            horizontal
            pagingEnabled
            scrollEnabled={!isZooming}
            nestedScrollEnabled
            directionalLockEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: initialIndex * width, y: 0 }}
            onMomentumScrollEnd={(event) => setCurrentIndex(Math.round(event.nativeEvent.contentOffset.x / width))}
            style={{ height: imagePagerHeight, flex: 0 }}
            contentContainerStyle={{ height: imagePagerHeight }}
          >
            {photos.map((photo) => (
              <View key={photo.id} style={{ width, height: imagePagerHeight, alignItems: 'center', justifyContent: 'center' }}>
                <ZoomArea width={width} height={imagePagerHeight} onZoomStart={() => setIsZooming(true)} onZoomEnd={() => setIsZooming(false)}>
                  <Image source={{ uri: photo.url }} resizeMode="contain" style={{ width, height: imagePagerHeight }} />
                </ZoomArea>
              </View>
            ))}
          </ScrollView>
        </BottomSheet.GestureArea>
      </BottomSheet.Body>
      <BottomSheet.BottomActions sx={{ backgroundColor: '#010101' }}>
        <Button size="large" variant="contained" fullWidth onClick={onClose}>닫기</Button>
      </BottomSheet.BottomActions>
    </BottomSheet>
  )
}
