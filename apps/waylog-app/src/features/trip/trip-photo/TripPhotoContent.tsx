import { MaterialIcons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import type { Photo } from '@waylog/domains/modules/photo'
import { useTripPlaces } from '@waylog/domains/modules/trip'
import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, ScrollView, useWindowDimensions } from 'react-native'
import * as Linking from 'expo-linking'
import { Box, Button, Chip, Stack, Typography } from '../../../shared/components/mui'
import { BottomSheet } from '../../../shared/components/bottom-sheet/BottomSheet'
import { useConfirmDialog } from '../../../shared/components/confirm-dialog/useConfirmDialog'
import { useOverlay } from '../../../shared/hooks/useOverlay'
import { palette } from '../../../shared/config/tokens'
import { useTripPhotos } from './useTripPhotos'
import { TripDetailHeader } from '../components/TripDetailHeader'
import { ZoomArea } from '../../../shared/components/photo/ZoomArea'
import { LoadableImage } from '../../../shared/components/LoadableImage'

const COLUMNS = 3
const GAP = 2

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
  const size = (width - GAP * (COLUMNS - 1)) / COLUMNS

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
      <TripDetailHeader />
      <Box
        sx={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <Box />
        <Stack direction="row" gap={0.5} alignItems="center">
          <Button size="small" onClick={() => setIsReadonly((curr) => !curr)}>
            {isReadonly ? '선택' : '완료'}
          </Button>
          {isUploading && <ActivityIndicator />}
        </Stack>
      </Box>

      {placeOptions.length > 0 && (
        <Stack direction="row" gap={0.5} sx={{ paddingHorizontal: 16, paddingBottom: 8, flexWrap: 'wrap' }}>
          {placeOptions.map((place) => {
            const isSelected = selectedPlaceIds.includes(place.placeId)

            return (
              <Chip
                key={place.placeId}
                label={place.name}
                size="small"
                variant={isSelected ? 'filled' : 'outlined'}
                color={isSelected ? 'primary' : 'default'}
                onClick={() =>
                  setSelectedPlaceIds((curr) =>
                    isSelected
                      ? curr.filter((id) => id !== place.placeId)
                      : [...curr, place.placeId],
                  )
                }
              />
            )
          })}
        </Stack>
      )}

      {!isReadonly && selectedPhotoIds.length > 0 && (
        <Stack direction="row" gap={1} sx={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              selectedPhotoIds.forEach((photoId) => {
                const photo = photos.find((x) => x.id === photoId)
                if (photo != null) update({ photoId, isPublic: !photo.isPublic })
              })
              setSelectedPhotoIds([])
            }}
          >
            공개 전환 ({selectedPhotoIds.length})
          </Button>
          <Button
            size="small"
            color="error"
            onClick={async () => {
              if (!(await confirm('선택한 사진을 삭제할까요?'))) return
              for (const photoId of selectedPhotoIds) {
                const photo = photos.find((x) => x.id === photoId)
                if (photo != null) await remove(photo)
              }
              setSelectedPhotoIds([])
            }}
          >
            삭제
          </Button>
        </Stack>
      )}

      <FlatList
        data={galleryItems}
        keyExtractor={(item) => item.id}
        numColumns={COLUMNS}
        columnWrapperStyle={{ gap: GAP }}
        contentContainerStyle={{ gap: GAP }}
        renderItem={({ item }) => (
          'kind' in item ? (
            <Pressable
              accessibilityLabel="사진 추가"
              onPress={pick}
              style={{
                width: size,
                height: size,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: '#d5d5d5',
                borderRadius: 8,
              }}
            >
              <MaterialIcons name="add-photo-alternate" size={22} color={palette.textSecondary} />
            </Pressable>
          ) : (
          <Pressable
            onPress={() => (isReadonly ? openPhotoDetails(item) : toggleSelect(item))}
            onLongPress={() => setIsReadonly(false)}
          >
            <LoadableImage source={{ uri: item.url }} style={{ width: size, height: size, borderRadius: 8 }} resizeMode="cover" />

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
  const imagePagerHeight = 560
  const [viewerPhotos, setViewerPhotos] = useState(photos)
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isZooming, setIsZooming] = useState(false)
  const currentPhoto = viewerPhotos[currentIndex]
  const currentPlace = places.find((place) => place.placeId === currentPhoto.placeId)
  const updateCurrentPhoto = async (patch: { placeId?: string | null; isPublic?: boolean }) => {
    await onUpdate({ photoId: currentPhoto.id, ...patch })
    setViewerPhotos((items) => items.map((item) => item.id === currentPhoto.id ? { ...item, ...patch } : item))
  }

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
      <BottomSheet.Body sx={{ backgroundColor: '#010101' }}>
        <ScrollView
          horizontal
          pagingEnabled
          scrollEnabled={!isZooming}
          nestedScrollEnabled
          directionalLockEnabled
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: initialIndex * width, y: 0 }}
          onMomentumScrollEnd={(event) => setCurrentIndex(Math.round(event.nativeEvent.contentOffset.x / width))}
          style={{ height: imagePagerHeight, flexGrow: 0 }}
          contentContainerStyle={{ height: imagePagerHeight }}
        >
          {viewerPhotos.map((item) => (
            <Box key={item.id} sx={{ width, height: imagePagerHeight, alignItems: 'center', justifyContent: 'center' }}>
              <ZoomArea uri={item.url} width={width} height={520} onZoomingChange={setIsZooming} />
            </Box>
          ))}
        </ScrollView>
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
