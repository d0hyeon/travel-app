import { MaterialIcons } from '@expo/vector-icons'
import type { Photo } from '@waylog/domains/modules/photo'
import { useState } from 'react'
import * as Linking from 'expo-linking'
import { Image, Pressable, StyleSheet, useWindowDimensions } from 'react-native'
import { Box, Button, Stack, Typography } from '~/shared/components/design-system'
import { BottomSheet } from '../bottom-sheet/BottomSheet'
import { useOverlay } from '../../hooks/useOverlay'
import { PhotoVisibilityBadge } from './PhotoVisibilityBadge'
import { ZoomArea } from './ZoomArea'
import { usePhotoViewerState } from './usePhotoViewerState'

interface PhotoPlaceOption {
  placeId: string
  name: string
}

interface Props {
  photos: Photo[]
  initialIndex?: number
  isOpen: boolean
  onClose: () => void
  /** 넘기지 않으면 삭제 버튼을 감춘다. */
  onDelete?: (photo: Photo) => void | Promise<void>
  /** 넘기지 않으면 공개 설정 메뉴를 감춘다. */
  onUpdate?: (params: { photoId: string; placeId?: string | null; isPublic?: boolean }) => Promise<unknown>
  /** onUpdate 와 함께 넘겼을 때만 장소 지정 줄을 보여 준다. */
  places?: PhotoPlaceOption[]
}

export function PhotoBottomSheet({
  photos,
  initialIndex = 0,
  isOpen,
  onClose,
  onDelete,
  onUpdate,
  places,
}: Props) {
  const { width } = useWindowDimensions()
  const overlay = useOverlay()
  // 웹은 ZoomArea 에 height="100%" 를 주어 시트 Body 를 그대로 채운다.
  // 앱은 고정 픽셀로 재는 대신 실제 렌더된 Body 높이를 측정해 맞춘다.
  // 첫 렌더는 onLayout 이전이라 0으로 잡히면 사진이 통째로 안 보이므로,
  // 실측 전까지 쓸 값을 기존 고정값으로 남겨 두고 실측되면 갱신만 한다.
  const [imagePagerHeight, setImagePagerHeight] = useState(560)
  const [isZooming, setIsZooming] = useState(false)
  const { viewerPhotos, currentIndex, currentPhoto, setCurrentIndex, updateCurrentPhoto } =
    usePhotoViewerState({ photos, initialIndex, onUpdate })

  const canSelectPlace = places != null && onUpdate != null
  const currentPlace = places?.find((place) => place.placeId === currentPhoto.placeId)

  const openVisibilityMenu = () =>
    overlay.open(({ isOpen: menuOpen, close: closeMenu }) => (
      <BottomSheet isOpen={menuOpen} onDismiss={closeMenu} snapPoints={[0.4]} defaultSnapIndex={0} safeArea>
        <BottomSheet.Body style={styles.menuBody}>
          <Pressable onPress={() => { void Linking.openURL(currentPhoto.url); closeMenu() }} style={styles.menuItem}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography style={styles.menuItemLabel}>다운로드</Typography>
              <MaterialIcons name="download-for-offline" size={26} color="#222" />
            </Stack>
          </Pressable>
          <Typography style={styles.menuHeading}>공개 설정</Typography>
          <Pressable onPress={async () => { await updateCurrentPhoto({ isPublic: true }); closeMenu() }} style={styles.visibilityMenuItem}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography style={[styles.menuItemLabel, { color: currentPhoto.isPublic ? '#4c84ff' : '#222' }]}>공개</Typography>
              {currentPhoto.isPublic && <MaterialIcons name="check" size={26} color="#222" />}
            </Stack>
          </Pressable>
          <Pressable onPress={async () => { await updateCurrentPhoto({ isPublic: false }); closeMenu() }} style={styles.visibilityMenuItem}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography style={[styles.menuItemLabel, { color: !currentPhoto.isPublic ? '#4c84ff' : '#222' }]}>비공개</Typography>
              {!currentPhoto.isPublic && <MaterialIcons name="check" size={26} color="#222" />}
            </Stack>
          </Pressable>
        </BottomSheet.Body>
      </BottomSheet>
    ))

  const openPlacePicker = () =>
    overlay.open(({ isOpen: pickerOpen, close: closePicker }) => (
      <BottomSheet isOpen={pickerOpen} onDismiss={closePicker} snapPoints={[0.5]} defaultSnapIndex={0} safeArea>
        <BottomSheet.Body style={styles.menuBody}>
          {[{ id: 'none', label: '장소 미지정' }, ...(places ?? []).map((place) => ({ id: place.placeId, label: place.name }))].map((option) => {
            const isUnassigned = option.id === 'none'
            const isSelected = isUnassigned ? currentPhoto.placeId == null : currentPhoto.placeId === option.id
            return (
              <Pressable key={option.id} onPress={async () => { await updateCurrentPhoto({ placeId: isUnassigned ? null : option.id }); closePicker() }} style={[styles.menuItem, { backgroundColor: isSelected ? '#eef4ff' : '#fff' }]}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography style={[styles.menuItemLabel, { color: isUnassigned ? '#888' : '#222' }]}>{option.label}</Typography>
                  {isSelected && <MaterialIcons name="check" size={24} color="#4c84ff" />}
                </Stack>
              </Pressable>
            )
          })}
        </BottomSheet.Body>
      </BottomSheet>
    ))

  return (
    <BottomSheet isOpen={isOpen} onDismiss={onClose} snapPoints={[0.95]} defaultSnapIndex={0} safeArea style={styles.viewerBackground}>
      <BottomSheet.Header alignItems="center" justifyContent="center" style={styles.viewerBackground}>
        {currentPhoto.isPublic && <PhotoVisibilityBadge style={styles.headerVisibilityBadge} />}
        <Typography variant="body2" style={styles.photoCounter}>{currentIndex + 1} / {viewerPhotos.length}</Typography>
        {onUpdate && (
          <Pressable accessibilityLabel="사진 메뉴" onPress={openVisibilityMenu} style={styles.menuTrigger}>
            <Typography style={styles.menuIcon}>⋮</Typography>
          </Pressable>
        )}
      </BottomSheet.Header>
      <BottomSheet.Body
        style={styles.viewerBackground}
        onLayout={(event) => {
          const height = Math.round(event.nativeEvent.layout.height)
          if (height > 0) setImagePagerHeight(height)
        }}
      >
        <BottomSheet.ScrollView
          horizontal
          pagingEnabled
          scrollEnabled={!isZooming}
          nestedScrollEnabled
          directionalLockEnabled
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: initialIndex * width, y: 0 }}
          onMomentumScrollEnd={(event) => setCurrentIndex(Math.round(event.nativeEvent.contentOffset.x / width))}
          style={[styles.imagePager, { height: imagePagerHeight }]}
          contentContainerStyle={{ height: imagePagerHeight }}
        >
          {viewerPhotos.map((item) => (
            <Box key={item.id} style={[styles.imagePage, { width, height: imagePagerHeight }]}>
              <ZoomArea width={width} height={imagePagerHeight} onZoomStart={() => setIsZooming(true)} onZoomEnd={() => setIsZooming(false)}>
                <Image source={{ uri: item.url }} resizeMode="contain" style={{ width, height: imagePagerHeight }} />
              </ZoomArea>
            </Box>
          ))}
        </BottomSheet.ScrollView>
      </BottomSheet.Body>
      {canSelectPlace && (
        <Stack alignItems="center" style={styles.placeSelector}>
          <Pressable accessibilityLabel="사진 장소 지정" onPress={openPlacePicker} style={styles.placeTrigger}>
            <Stack direction="row" alignItems="center" gap={0.75}>
              <MaterialIcons name="location-on" size={20} color="#fff" />
              <Typography style={styles.placeLabel}>{currentPlace?.name ?? '장소 미지정'}</Typography>
              <MaterialIcons name="edit" size={18} color="#fff" />
            </Stack>
          </Pressable>
        </Stack>
      )}
      <BottomSheet.BottomActions style={styles.viewerBackground}>
        {onDelete && (
          <Button variant="outlined" color="error" fullWidth onPress={() => void onDelete(currentPhoto)}>삭제</Button>
        )}
        <Button variant="contained" fullWidth onPress={onClose}>닫기</Button>
      </BottomSheet.BottomActions>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  viewerBackground: { backgroundColor: '#010101' },
  headerVisibilityBadge: { position: 'absolute', left: 16 },
  photoCounter: { color: '#fff', fontWeight: '800' },
  menuBody: { paddingHorizontal: 0, paddingVertical: 8 },
  menuItem: { paddingHorizontal: 20, paddingVertical: 16 },
  menuItemLabel: { fontSize: 16 },
  menuHeading: { paddingHorizontal: 20, paddingVertical: 12, color: '#777', fontWeight: '700' },
  visibilityMenuItem: { paddingLeft: 36, paddingRight: 20, paddingVertical: 16 },
  menuTrigger: { position: 'absolute', right: 12, padding: 8 },
  menuIcon: { color: '#fff', fontSize: 24 },
  imagePager: { flex: 0 },
  imagePage: { alignItems: 'center', justifyContent: 'center' },
  placeSelector: { flexGrow: 0, paddingVertical: 8, backgroundColor: '#010101' },
  placeTrigger: { paddingHorizontal: 12, paddingVertical: 8 },
  placeLabel: { color: '#fff' },
})
