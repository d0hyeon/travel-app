import { MaterialIcons } from '@expo/vector-icons'
import type { Photo } from '@waylog/domains/modules/photo'
import { useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native'
import { toast } from 'sonner-native'
import { Theme } from 'tamagui'
import { Box, Button, Stack, Typography } from '~/shared/components/design-system'
import { savePhotoToLibrary } from '~shared/modules/photo-library/savePhotoToLibrary'
import { BottomSheet } from '../bottom-sheet/BottomSheet'
import { useOverlay } from '../../hooks/useOverlay'
import { useConfirmDialog } from '../confirm-dialog/useConfirmDialog'
import { PopMenu } from '../PopMenu'
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
  const confirm = useConfirmDialog()
  // 웹은 ZoomArea 에 height="100%" 를 주어 시트 Body 를 그대로 채운다.
  // 앱은 고정 픽셀로 재는 대신 실제 렌더된 Body 높이를 측정해 맞춘다.
  // 첫 렌더는 onLayout 이전이라 0으로 잡히면 사진이 통째로 안 보이므로,
  // 실측 전까지 쓸 값을 기존 고정값으로 남겨 두고 실측되면 갱신만 한다.
  const [imagePagerHeight, setImagePagerHeight] = useState(560)
  const [isZooming, setIsZooming] = useState(false)
  const { viewerPhotos, currentIndex, currentPhoto, setCurrentIndex, updateCurrentPhoto } =
    usePhotoViewerState({ photos, initialIndex, onUpdate })

  const hasMenu = onUpdate != null || onDelete != null
  const canSelectPlace = places != null && onUpdate != null
  const currentPlace = places?.find((place) => place.placeId === currentPhoto.placeId)

  const downloadPhoto = async (photo: Photo) => {
    try {
      const result = await savePhotoToLibrary(photo.url)
      if (result === 'saved') toast.success('사진을 저장했어요')
      else toast.error('사진 보관함 접근 권한이 필요해요')
    } catch {
      toast.error('사진을 저장하지 못했어요')
    }
  }

  const openPlacePicker = () =>
    overlay.open(({ isOpen: pickerOpen, close: closePicker }) => (
      <Theme name="dark">
        <BottomSheet isOpen={pickerOpen} onDismiss={closePicker} snapPoints={[0.5]} defaultSnapIndex={0} safeArea style={styles.pickerBackground}>
          <BottomSheet.Body style={[styles.menuBody, styles.pickerBackground]}>
            <BottomSheet.ScrollView>
              {[{ id: 'none', label: '장소 미지정' }, ...(places ?? []).map((place) => ({ id: place.placeId, label: place.name }))].map((option) => {
                const isUnassigned = option.id === 'none'
                const isSelected = isUnassigned ? currentPhoto.placeId == null : currentPhoto.placeId === option.id
                return (
                  <Pressable key={option.id} onPress={async () => { await updateCurrentPhoto({ placeId: isUnassigned ? null : option.id }); closePicker() }} style={[styles.menuItem, { backgroundColor: isSelected ? '#3a4560' : '#2b2b2b' }]}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography style={[styles.menuItemLabel, { color: isUnassigned ? '#aaa' : '#fff' }]}>{option.label}</Typography>
                      {isSelected && <MaterialIcons name="check" size={24} color="#4c84ff" />}
                    </Stack>
                  </Pressable>
                )
              })}
            </BottomSheet.ScrollView>
          </BottomSheet.Body>
        </BottomSheet>
      </Theme>
    ))

  return (
    <Theme name="dark">
      <BottomSheet isOpen={isOpen} onDismiss={onClose} snapPoints={[0.95]} defaultSnapIndex={0} safeArea style={styles.viewerBackground}>
        <BottomSheet.Header alignItems="center" justifyContent="center" style={styles.viewerBackground}>
          {currentPhoto.isPublic && <PhotoVisibilityBadge style={styles.headerVisibilityBadge} />}
          <Typography variant="body2" style={styles.photoCounter}>{currentIndex + 1} / {viewerPhotos.length}</Typography>
          {hasMenu && (
            <View style={styles.menuTrigger}>
              <PopMenu
                items={
                  <>
                    {onUpdate && (
                      <>
                        <PopMenu.Item
                          icon={<MaterialIcons name="download-for-offline" size={18} color="#fff" />}
                          onPress={() => void downloadPhoto(currentPhoto)}
                        >
                          다운로드
                        </PopMenu.Item>
                        <PopMenu.Group label="공개 설정">
                          <PopMenu.Item
                            icon={<VisibilityCheck isSelected={currentPhoto.isPublic} />}
                            onPress={() => void updateCurrentPhoto({ isPublic: true })}
                          >
                            공개
                          </PopMenu.Item>
                          <PopMenu.Item
                            icon={<VisibilityCheck isSelected={!currentPhoto.isPublic} />}
                            onPress={() => void updateCurrentPhoto({ isPublic: false })}
                          >
                            비공개
                          </PopMenu.Item>
                        </PopMenu.Group>
                      </>
                    )}
                    {onDelete && (
                      <PopMenu.Item
                        color="error"
                        icon={<MaterialIcons name="delete" size={18} color="#ff8a8a" />}
                        onPress={async () => {
                          if (await confirm('사진을 삭제하시겠어요?')) await onDelete(currentPhoto)
                        }}
                      >
                        삭제
                      </PopMenu.Item>
                    )}
                  </>
                }
              >
                <MaterialIcons name="more-vert" size={24} color="#fff" />
              </PopMenu>
            </View>
          )}
        </BottomSheet.Header>
        <BottomSheet.Body
          style={styles.viewerBackground}
          onLayout={(event) => {
            const height = Math.round(event.nativeEvent.layout.height)
            if (height > 0) setImagePagerHeight(height)
          }}
        >
          <BottomSheet.GestureArea>
            <ScrollView
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
            </ScrollView>
          </BottomSheet.GestureArea>
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
          <Button variant="contained" size="large" fullWidth onPress={onClose}>닫기</Button>
        </BottomSheet.BottomActions>
      </BottomSheet>
    </Theme>
  )
}

function VisibilityCheck({ isSelected }: { isSelected: boolean }) {
  return <MaterialIcons name="check" size={18} color="#fff" style={isSelected ? undefined : styles.hiddenIcon} />
}

const styles = StyleSheet.create({
  viewerBackground: { backgroundColor: '#010101' },
  headerVisibilityBadge: { position: 'absolute', left: 16 },
  photoCounter: { color: '#fff', fontWeight: '800' },
  menuBody: { paddingHorizontal: 0, paddingVertical: 8 },
  menuItem: { paddingHorizontal: 20, paddingVertical: 16 },
  menuItemLabel: { fontSize: 16 },
  menuTrigger: { position: 'absolute', right: 12, padding: 8 },
  hiddenIcon: { opacity: 0 },
  pickerBackground: { backgroundColor: '#2b2b2b' },
  imagePager: { flex: 0 },
  imagePage: { alignItems: 'center', justifyContent: 'center' },
  placeSelector: { flexGrow: 0, paddingVertical: 8, backgroundColor: '#010101' },
  placeTrigger: { paddingHorizontal: 12, paddingVertical: 8 },
  placeLabel: { color: '#fff' },
})
