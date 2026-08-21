import { MaterialIcons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import type { Photo } from '@waylog/domains/photo'
import { useTripPlaces } from '@waylog/domains/trip'
import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, FlatList, Image, Pressable, useWindowDimensions } from 'react-native'
import { Box, Button, Chip, Stack, Typography } from '../../../shared/components/mui'
import { useConfirmDialog } from '../../../shared/components/confirm-dialog/useConfirmDialog'
import { palette } from '../../../shared/config/tokens'
import { useTripPhotos } from './useTripPhotos'

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

  const [selected, setSelected] = useState<Photo | null>(null)
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
    })
    if (result.canceled) return

    await upload({ uris: result.assets.map((asset) => asset.uri) })
  }

  return (
    <Box sx={{ flex: 1, backgroundColor: palette.background }}>
      <Box
        sx={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          사진 {filteredPhotos.length}장
        </Typography>
        <Stack direction="row" gap={0.5} alignItems="center">
          <Button size="small" onClick={() => setIsReadonly((curr) => !curr)}>
            {isReadonly ? '선택' : '완료'}
          </Button>
          {isUploading ? (
            <ActivityIndicator />
          ) : (
            <Button size="small" variant="contained" onClick={pick}>
              사진 추가
            </Button>
          )}
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
        data={filteredPhotos}
        keyExtractor={(photo) => photo.id}
        numColumns={COLUMNS}
        columnWrapperStyle={{ gap: GAP }}
        contentContainerStyle={{ gap: GAP }}
        ListEmptyComponent={
          <Typography variant="body2" color="text.secondary" sx={{ padding: 16 }}>
            사진이 없어요
          </Typography>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => (isReadonly ? setSelected(item) : toggleSelect(item))}
            onLongPress={() => setIsReadonly(false)}
          >
            <Image source={{ uri: item.url }} style={{ width: size, height: size }} />

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
        )}
      />

      {selected != null && (
        <Pressable
          onPress={() => setSelected(null)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.9)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image
            source={{ uri: selected.url }}
            style={{ width: '100%', height: '70%' }}
            resizeMode="contain"
          />
        </Pressable>
      )}
    </Box>
  )
}
