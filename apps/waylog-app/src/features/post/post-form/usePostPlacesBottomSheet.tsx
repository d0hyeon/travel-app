import { MaterialIcons } from '@expo/vector-icons'
import { upsertPlace } from '@waylog/domains/modules/place'
import { useTripPlaces } from '@waylog/domains/modules/trip'
import { Suspense, useCallback, useState } from 'react'
import { Pressable, View } from 'react-native'
import { BottomSheet } from '../../../shared/components/bottom-sheet/BottomSheet'
import { Button, Chip, Skeleton, Typography } from '../../../shared/components/mui'
import { palette } from '../../../shared/config/tokens'
import { useOverlay } from '../../../shared/hooks/useOverlay'
import { usePlaceSearchBottomSheet } from '../../place/place-search/usePlaceSearchBottomSheet'
import type { PostPlaceSelection } from './postForm.types'

interface OpenParams {
  tripId: string | null
  defaultValue: PostPlaceSelection[]
}

// 확인해야 반영된다. 시트가 자기 선택을 들고 있다가 확인 시에만 넘긴다.
export function usePostPlacesBottomSheet() {
  const overlay = useOverlay()
  const { searchPlace } = usePlaceSearchBottomSheet()

  const open = useCallback(
    ({ tripId, defaultValue }: OpenParams) => {
      return new Promise<PostPlaceSelection[] | null>((resolve) => {
        overlay.open(({ isOpen, close }) => {
          const cancel = () => {
            resolve(null)
            close()
          }

          return (
            <PostPlacesSheet
              isOpen={isOpen}
              tripId={tripId}
              defaultValue={defaultValue}
              searchPlace={searchPlace}
              onCancel={cancel}
              onConfirm={(places) => {
                resolve(places)
                close()
              }}
            />
          )
        })
      })
    },
    [overlay, searchPlace],
  )

  return { open }
}

function PostPlacesSheet({
  isOpen,
  tripId,
  defaultValue,
  searchPlace,
  onCancel,
  onConfirm,
}: {
  isOpen: boolean
  tripId: string | null
  defaultValue: PostPlaceSelection[]
  searchPlace: ReturnType<typeof usePlaceSearchBottomSheet>['searchPlace']
  onCancel: () => void
  onConfirm: (places: PostPlaceSelection[]) => void
}) {
  const [places, setPlaces] = useState(defaultValue)

  const togglePlace = (place: PostPlaceSelection) =>
    setPlaces((current) =>
      current.some((candidate) => candidate.placeId === place.placeId)
        ? current.filter((candidate) => candidate.placeId !== place.placeId)
        : [...current, place],
    )

  const addSearchedPlace = async () => {
    const result = await searchPlace()
    if (result == null) return

    const place = await upsertPlace(result.provider, result.externalId, {
      name: result.name,
      address: result.address,
      lat: result.lat,
      lng: result.lng,
    })
    setPlaces((current) =>
      current.some((candidate) => candidate.placeId === place.id)
        ? current
        : [...current, { placeId: place.id, name: place.name, address: place.address }],
    )
  }

  return (
    <BottomSheet isOpen={isOpen} onDismiss={onCancel} snapPoints={[0.75]} safeArea>
      <BottomSheet.Header>위치</BottomSheet.Header>
      <BottomSheet.Body sx={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        <View style={{ gap: 12 }}>
          {places.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {places.map((place) => (
                <Chip key={place.placeId} label={place.name} onDelete={() => togglePlace(place)} />
              ))}
            </View>
          )}
          <Pressable
            onPress={() => void addSearchedPlace()}
            style={{ paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Typography>장소 검색해서 추가</Typography>
            <MaterialIcons name="search" size={20} color={palette.textSecondary} />
          </Pressable>
          {tripId != null && (
            <Suspense fallback={<PlaceListSkeleton />}>
              <TripPlaceSelection tripId={tripId} selected={places} onToggle={togglePlace} />
            </Suspense>
          )}
        </View>
      </BottomSheet.Body>
      <BottomSheet.BottomActions>
        <Button variant="outlined" fullWidth onClick={onCancel}>
          취소
        </Button>
        <Button variant="contained" fullWidth onClick={() => onConfirm(places)}>
          확인
        </Button>
      </BottomSheet.BottomActions>
    </BottomSheet>
  )
}

function TripPlaceSelection({
  tripId,
  selected,
  onToggle,
}: {
  tripId: string
  selected: PostPlaceSelection[]
  onToggle: (place: PostPlaceSelection) => void
}) {
  const { data: tripPlaces } = useTripPlaces(tripId)
  if (tripPlaces.length === 0)
    return (
      <Typography variant="caption" color="text.secondary">
        이 여행에 등록된 장소가 없습니다
      </Typography>
    )

  return (
    <View style={{ gap: 6 }}>
      {tripPlaces.map((place) => {
        const checked = selected.some((candidate) => candidate.placeId === place.placeId)
        return (
          <Pressable
            key={place.id}
            onPress={() => onToggle({ placeId: place.placeId, name: place.name, address: place.address || null })}
            style={{ paddingVertical: 10, flexDirection: 'row', alignItems: 'center' }}
          >
            <View style={{ flex: 1 }}>
              <Typography variant="body2">{place.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {place.address}
              </Typography>
            </View>
            {checked && <MaterialIcons name="check" size={20} color={palette.primary} />}
          </Pressable>
        )
      })}
    </View>
  )
}

function PlaceListSkeleton() {
  return (
    <View style={{ gap: 8 }}>
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} width="100%" height={52} />
      ))}
    </View>
  )
}
