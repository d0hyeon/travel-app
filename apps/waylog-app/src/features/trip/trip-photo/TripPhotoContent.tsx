import { MaterialIcons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import type { Photo } from '@waylog/domains/modules/photo'
import { useTripPlaces } from '@waylog/domains/modules/trip'
import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, useWindowDimensions } from 'react-native'
import * as Linking from 'expo-linking'
import { Box, Button, Stack, Typography } from '../../../shared/components/mui'
import { BottomArea } from '../../../shared/components/BottomArea'
import { BottomSheet } from '../../../shared/components/bottom-sheet/BottomSheet'
import { useConfirmDialog } from '../../../shared/components/confirm-dialog/useConfirmDialog'
import { useOverlay } from '../../../shared/hooks/useOverlay'
import { palette } from '../../../shared/config/tokens'
import { MultiSelectDropdown } from '../../../shared/components/MultiSelectDropdown'
import { useTripPhotos } from './useTripPhotos'
import { usePhotoViewerState } from './usePhotoViewerState'
import { ZoomArea } from '../../../shared/components/photo/ZoomArea'
import { LoadableImage } from '../../../shared/components/LoadableImage'

const COLUMNS = 3
const GAP = 2
const LIST_PADDING = 16

interface Props {
  tripId: string
}

export function TripPhotoContent({ tripId }: Props) {
  const { data: photos, upload, remove, update, isUploading } = useTripPhotos(tripId)
  const { data: places } = useTripPlaces(tripId)
  const confirm = useConfirmDialog()
  const { width } = useWindowDimensions()
  const overlay = useOverlay()

  const [selectedPlaceIds, setSelectedPlaceIds] = useState<string[]>([])
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([])
  const [isReadonly, setIsReadonly] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (isReadonly) setSelectedPhotoIds([])
  }, [isReadonly])

  const photosByPlace = useMemo(() => {
    const grouped: Record<string, Photo[]> = {}
    photos.forEach((photo) => {
      if (photo.placeId == null) return
      grouped[photo.placeId] = [...(grouped[photo.placeId] ?? []), photo]
    })
    return grouped
  }, [photos])

  // 장소를 고르면 그 장소의 사진만 남긴다. 웹과 같은 규칙이다.
  const filteredPhotos =
    selectedPlaceIds.length > 0
      ? selectedPlaceIds.flatMap((id) => photosByPlace[id] ?? [])
      : photos

  const placeOptions = places.filter((place) => (photosByPlace[place.placeId] ?? []).length > 0)
  const galleryItems: (Photo | { id: 'upload'; kind: 'upload' })[] = [
    { id: 'upload', kind: 'upload' },
    ...filteredPhotos,
  ]

  const toggleSelect = (photo: Photo) =>
    setSelectedPhotoIds((curr) =>
      curr.includes(photo.id) ? curr.filter((id) => id !== photo.id) : [...curr, photo.id],
    )
  const size = (width - LIST_PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS

  const pick = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) return

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 1,
      // 장소 자동 매칭에 쓴다. 리사이즈를 거치면 EXIF 가 사라지므로 여기서 받아야 한다.
      exif: true,
    })
    if (result.canceled) return

    await upload({ assets: result.assets })
  }

  const openPhotoDetails = (photo: Photo) => {
    const photoIndex = filteredPhotos.findIndex((item) => item.id === photo.id)
    overlay.open(({ isOpen, close }) => (
      <PhotoViewerSheet
        isOpen={isOpen}
        photos={filteredPhotos}
        initialIndex={photoIndex}
        places={places}
        onUpdate={update}
        onDelete={async (currentPhoto) => {
          if (!(await confirm('사진을 삭제할까요?'))) return
          await remove(currentPhoto)
          close()
        }}
        onClose={close}
      />
    ))
  }

  return (
    <Box sx={{ flex: 1, backgroundColor: palette.background }}>
      {/* 웹과 같이 장소 필터와 선택/완료 버튼을 한 행에 둔다. */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent={placeOptions.length > 0 ? 'space-between' : 'flex-end'}
        gap={1}
        sx={{ paddingHorizontal: 16, paddingVertical: 12 }}
      >
        {placeOptions.length > 0 && (
          <MultiSelectDropdown
            placeholder="장소"
            options={placeOptions.map((place) => ({
              value: place.placeId,
              label: place.name,
            }))}
            value={selectedPlaceIds}
            onChange={setSelectedPlaceIds}
          />
        )}
        <Stack direction="row" gap={0.5} alignItems="center">
          <Button
            size="small"
            variant="contained"
            onClick={() => setIsReadonly((curr) => !curr)}
            sx={{ borderRadius: 24, backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
          >
            {isReadonly ? '선택' : '완료'}
          </Button>
        </Stack>
      </Stack>

      <FlatList
        data={galleryItems}
        keyExtractor={(item) => item.id}
        numColumns={COLUMNS}
        columnWrapperStyle={{ gap: GAP }}
        contentContainerStyle={{
          gap: GAP,
          paddingHorizontal: LIST_PADDING,
          paddingBottom: 16,
        }}
        renderItem={({ item }) => (
          'kind' in item ? (
            <Pressable
              accessibilityLabel="사진 추가"
              // 업로드 중에는 다시 고르지 못하게 막는다.
              onPress={isUploading ? undefined : pick}
              style={{
                width: size,
                height: size,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: '#d5d5d5',
                borderRadius: 8,
                opacity: isUploading ? 0.4 : 1,
              }}
            >
              {isUploading ? (
                <ActivityIndicator />
              ) : (
                <MaterialIcons name="add-photo-alternate" size={22} color={palette.textSecondary} />
              )}
            </Pressable>
          ) : (
          <Pressable
            onPress={() => (isReadonly ? openPhotoDetails(item) : toggleSelect(item))}
            onLongPress={() => setIsReadonly(false)}
            style={{ position: 'relative' }}
          >
            <LoadableImage source={{ uri: item.url }} style={{ width: size, height: size, borderRadius: 8 }} resizeMode="cover" />

            {!isReadonly && selectedPhotoIds.includes(item.id) && (
              <Box
                pointerEvents="none"
                sx={{
                  ...StyleSheet.absoluteFillObject,
                  borderRadius: 8,
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                }}
              />
            )}

            {/* 공개 사진 표시 */}
            {item.isPublic && (
              <Box sx={{ position: 'absolute', top: 4, left: 4 }}>
                <MaterialIcons name="public" size={16} color="#fff" />
              </Box>
            )}

            {!isReadonly && (
              <Box sx={{ position: 'absolute', top: 4, right: 4 }}>
                <MaterialIcons
                  name={selectedPhotoIds.includes(item.id) ? 'check-circle' : 'radio-button-unchecked'}
                  size={20}
                  color={selectedPhotoIds.includes(item.id) ? '#4C84FF' : '#fff'}
                />
              </Box>
            )}
          </Pressable>
          )
        )}
      />

      {/* 웹과 같이 선택 모드에서는 하단 고정 삭제 버튼만 둔다.
          공개 전환은 사진을 열었을 때 뷰어 안에서 한다. */}
      {!isReadonly && (
        <BottomArea position="static">
          <Button
            size="large"
            color="error"
            variant="contained"
            fullWidth
            textSx={{ fontWeight: '600' }}
            disabled={selectedPhotoIds.length === 0}
            loading={isDeleting}
            onClick={async () => {
              if (!(await confirm('정말 삭제하시겠어요?'))) return

              setIsDeleting(true)
              try {
                for (const photoId of selectedPhotoIds) {
                  const photo = photos.find((x) => x.id === photoId)
                  if (photo != null) await remove(photo)
                }
                setSelectedPhotoIds([])
              } finally {
                setIsDeleting(false)
              }
            }}
          >
            삭제 ({selectedPhotoIds.length}/{filteredPhotos.length})
          </Button>
        </BottomArea>
      )}
    </Box>
  )
}

interface PhotoViewerSheetProps {
  isOpen: boolean
  photos: Photo[]
  initialIndex: number
  places: Array<{ placeId: string; name: string }>
  onUpdate: (params: { photoId: string; placeId?: string | null; isPublic?: boolean }) => Promise<unknown>
  onDelete: (photo: Photo) => Promise<void>
  onClose: () => void
}

function PhotoViewerSheet({ isOpen, photos, initialIndex, places, onUpdate, onDelete, onClose }: PhotoViewerSheetProps) {
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
  const currentPlace = places.find((place) => place.placeId === currentPhoto.placeId)

  return (
    <BottomSheet isOpen={isOpen} onDismiss={onClose} snapPoints={[0.95]} defaultSnapIndex={0} safeArea sx={{ backgroundColor: '#010101' }}>
      <BottomSheet.Header alignItems="center" justifyContent="center" sx={{ backgroundColor: '#010101' }}>
        <Typography variant="body2" sx={{ color: '#fff', fontWeight: '800' }}>{currentIndex + 1} / {viewerPhotos.length}</Typography>
        <Pressable
          accessibilityLabel="사진 메뉴"
          onPress={() => overlay.open(({ isOpen: menuOpen, close: closeMenu }) => (
            <BottomSheet isOpen={menuOpen} onDismiss={closeMenu} snapPoints={[0.4]} defaultSnapIndex={0} safeArea>
              <BottomSheet.Body sx={{ paddingHorizontal: 0, paddingVertical: 8 }}>
                <Pressable onPress={() => { void Linking.openURL(currentPhoto.url); closeMenu() }} style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography sx={{ fontSize: 16 }}>다운로드</Typography>
                    <MaterialIcons name="download-for-offline" size={26} color="#222" />
                  </Stack>
                </Pressable>
                <Typography sx={{ paddingHorizontal: 20, paddingVertical: 12, color: '#777', fontWeight: '700' }}>공개 설정</Typography>
                  <Pressable onPress={async () => { await updateCurrentPhoto({ isPublic: true }); closeMenu() }} style={{ paddingLeft: 36, paddingRight: 20, paddingVertical: 16 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography sx={{ color: currentPhoto.isPublic ? '#4c84ff' : '#222', fontSize: 16 }}>공개</Typography>
                    {currentPhoto.isPublic && <MaterialIcons name="check" size={26} color="#222" />}
                  </Stack>
                </Pressable>
                  <Pressable onPress={async () => { await updateCurrentPhoto({ isPublic: false }); closeMenu() }} style={{ paddingLeft: 36, paddingRight: 20, paddingVertical: 16 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography sx={{ color: !currentPhoto.isPublic ? '#4c84ff' : '#222', fontSize: 16 }}>비공개</Typography>
                    {!currentPhoto.isPublic && <MaterialIcons name="check" size={26} color="#222" />}
                  </Stack>
                </Pressable>
              </BottomSheet.Body>
            </BottomSheet>
          ))}
          style={{ position: 'absolute', right: 12, padding: 8 }}
        >
          <Typography sx={{ color: '#fff', fontSize: 24 }}>⋮</Typography>
        </Pressable>
      </BottomSheet.Header>
      <BottomSheet.Body
        sx={{ backgroundColor: '#010101' }}
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
          style={{ height: imagePagerHeight, flex: 0 }}
          contentContainerStyle={{ height: imagePagerHeight }}
        >
          {viewerPhotos.map((item) => (
            <Box key={item.id} sx={{ width, height: imagePagerHeight, alignItems: 'center', justifyContent: 'center' }}>
              <ZoomArea width={width} height={imagePagerHeight} onZoomStart={() => setIsZooming(true)} onZoomEnd={() => setIsZooming(false)}>
                <Image source={{ uri: item.url }} resizeMode="contain" style={{ width, height: imagePagerHeight }} />
              </ZoomArea>
            </Box>
          ))}
        </BottomSheet.ScrollView>
      </BottomSheet.Body>
      <Stack alignItems="center" sx={{ flexGrow: 0, paddingVertical: 8, backgroundColor: '#010101' }}>
        <Pressable
          accessibilityLabel="사진 장소 지정"
          onPress={() => overlay.open(({ isOpen: pickerOpen, close: closePicker }) => (
            <BottomSheet isOpen={pickerOpen} onDismiss={closePicker} snapPoints={[0.5]} defaultSnapIndex={0} safeArea>
              <BottomSheet.Body sx={{ paddingHorizontal: 0, paddingVertical: 8 }}>
                {[{ id: 'none', label: '장소 미지정' }, ...places.map((place) => ({ id: place.placeId, label: place.name }))].map((option) => {
                  const isUnassigned = option.id === 'none'
                  const isSelected = isUnassigned ? currentPhoto.placeId == null : currentPhoto.placeId === option.id
                  return (
                  <Pressable key={option.id} onPress={async () => { await updateCurrentPhoto({ placeId: isUnassigned ? null : option.id }); closePicker() }} style={{ paddingHorizontal: 20, paddingVertical: 16, backgroundColor: isSelected ? '#eef4ff' : '#fff' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography sx={{ color: isUnassigned ? '#888' : '#222', fontSize: 16 }}>{option.label}</Typography>
                      {isSelected && <MaterialIcons name="check" size={24} color="#4c84ff" />}
                    </Stack>
                  </Pressable>
                  )
                })}
              </BottomSheet.Body>
            </BottomSheet>
          ))}
          style={{ paddingHorizontal: 12, paddingVertical: 8 }}
        >
          <Stack direction="row" alignItems="center" gap={0.75}>
            <MaterialIcons name="location-on" size={20} color="#fff" />
            <Typography sx={{ color: '#fff' }}>{currentPlace?.name ?? '장소 미지정'}</Typography>
            <MaterialIcons name="edit" size={18} color="#fff" />
          </Stack>
        </Pressable>
      </Stack>
      <BottomSheet.BottomActions sx={{ backgroundColor: '#010101' }}>
        <Button variant="outlined" color="error" fullWidth onClick={() => void onDelete(currentPhoto)}>삭제</Button>
        <Button variant="contained" fullWidth onClick={onClose}>닫기</Button>
      </BottomSheet.BottomActions>
    </BottomSheet>
  )
}
