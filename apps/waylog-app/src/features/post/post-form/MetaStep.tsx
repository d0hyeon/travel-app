import { MaterialIcons } from '@expo/vector-icons'
import { PostVisibility, type PostVisibility as PostVisibilityValue } from '@waylog/domains/modules/post'
import { upsertPlace } from '@waylog/domains/modules/place'
import { Suspense, useState } from 'react'
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native'
import { BottomSheet } from '../../../shared/components/bottom-sheet/BottomSheet'
import { BottomArea } from '../../../shared/components/BottomArea'
import { LoadableImage } from '../../../shared/components/LoadableImage'
import { Button, Chip, Skeleton, TextField, Typography } from '../../../shared/components/mui'
import { palette, radius } from '../../../shared/config/tokens'
import { usePlaceSearchBottomSheet } from '../../place/place-search/usePlaceSearchBottomSheet'
import { useTripPlaces } from '@waylog/domains/modules/trip'
import type { DraftPostPhoto, PostMetaValue, PostPlaceSelection } from './postForm.types'

const VISIBILITY_OPTIONS = [
  { value: PostVisibility.PRIVATE, label: '나만 보기' },
  { value: PostVisibility.MEMBERS, label: '여행 멤버' },
  { value: PostVisibility.PUBLIC, label: '전체 공개' },
] as const

export function MetaStep({ tripId, photos, isPending, onSubmit }: { tripId: string | null; photos: DraftPostPhoto[]; isPending: boolean; onSubmit: (value: PostMetaValue) => Promise<void> }) {
  const { width } = useWindowDimensions()
  const [description, setDescription] = useState('')
  const [places, setPlaces] = useState<PostPlaceSelection[]>([])
  const [visibility, setVisibility] = useState<PostVisibilityValue>(PostVisibility.PRIVATE)
  const [openField, setOpenField] = useState<'places' | 'visibility' | null>(null)
  const { searchPlace } = usePlaceSearchBottomSheet()
  const photoWidth = width - 32
  const placesLabel = places.length === 0 ? '선택 안 함' : places.length === 1 ? places[0]?.name : `${places[0]?.name} 외 ${places.length - 1}`

  const togglePlace = (place: PostPlaceSelection) => setPlaces((current) => current.some((candidate) => candidate.placeId === place.placeId) ? current.filter((candidate) => candidate.placeId !== place.placeId) : [...current, place])
  const addSearchedPlace = async () => {
    const result = await searchPlace()
    if (result == null) return
    const place = await upsertPlace(result.provider, result.externalId, { name: result.name, address: result.address, lat: result.lat, lng: result.lng })
    setPlaces((current) => current.some((candidate) => candidate.placeId === place.id) ? current : [...current, { placeId: place.id, name: place.name, address: place.address }])
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 24 }}>
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>{photos.map((photo) => <LoadableImage key={photo.id} source={{ uri: photo.uri }} style={{ width: photoWidth, aspectRatio: 1 }} resizeMode="cover" />)}</ScrollView>
        <TextField value={description} onChangeText={setDescription} placeholder="여행에 대해 한 줄 남겨주세요" multiline minRows={3} fullWidth />
        <View style={{ gap: 8 }}>
          <OverlayField label="위치" value={placesLabel ?? '선택 안 함'} onPress={() => setOpenField('places')} />
          <OverlayField label="공개 범위" value={VISIBILITY_OPTIONS.find((option) => option.value === visibility)?.label ?? ''} onPress={() => setOpenField('visibility')} />
        </View>
      </ScrollView>
      <BottomArea position="static" sx={{ borderTopWidth: 1, borderTopColor: palette.divider }}><Button variant="contained" size="large" fullWidth disabled={isPending} onClick={() => void onSubmit({ description: description.trim(), places, visibility })}>{isPending ? '등록 중…' : '확인'}</Button></BottomArea>

      {openField === 'places' && <BottomSheet isOpen onClose={() => setOpenField(null)} snapPoints={[0.75]} safeArea>
        <BottomSheet.Header>위치</BottomSheet.Header>
        <BottomSheet.Body sx={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          <View style={{ gap: 12 }}>
            {places.length > 0 && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{places.map((place) => <Chip key={place.placeId} label={place.name} onDelete={() => togglePlace(place)} />)}</View>}
            <Pressable onPress={() => void addSearchedPlace()} style={{ paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Typography>장소 검색해서 추가</Typography><MaterialIcons name="search" size={20} color={palette.textSecondary} /></Pressable>
            {tripId != null && <Suspense fallback={<PlaceListSkeleton />}><TripPlaceSelection tripId={tripId} selected={places} onToggle={togglePlace} /></Suspense>}
          </View>
        </BottomSheet.Body>
        <BottomSheet.BottomActions><Button variant="contained" fullWidth onClick={() => setOpenField(null)}>확인</Button></BottomSheet.BottomActions>
      </BottomSheet>}

      {openField === 'visibility' && <BottomSheet isOpen onClose={() => setOpenField(null)} snapPoints={[0.48]} safeArea>
        <BottomSheet.Header>공개 범위</BottomSheet.Header>
        <BottomSheet.Body sx={{ paddingHorizontal: 16 }}>
          <View style={{ borderWidth: 1, borderColor: palette.divider, borderRadius: radius.lg, overflow: 'hidden' }}>
            {VISIBILITY_OPTIONS.map((option) => {
              const disabled = option.value === PostVisibility.MEMBERS && tripId == null
              const selected = option.value === visibility
              return <Pressable key={option.value} disabled={disabled} onPress={() => setVisibility(option.value)} style={{ minHeight: 56, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: selected ? '#EEF2FF' : palette.background, opacity: disabled ? 0.4 : 1 }}><Typography variant="body2">{option.label}</Typography><Typography variant="caption" color="text.secondary">{VISIBILITY_DESCRIPTION[option.value]}</Typography></Pressable>
            })}
          </View>
        </BottomSheet.Body>
        <BottomSheet.BottomActions><Button variant="contained" fullWidth onClick={() => setOpenField(null)}>확인</Button></BottomSheet.BottomActions>
      </BottomSheet>}
    </View>
  )
}

function OverlayField({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Typography variant="subtitle2">{label}</Typography><View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Typography variant="caption" color="text.secondary">{value}</Typography><MaterialIcons name="chevron-right" size={22} color={palette.textSecondary} /></View></Pressable>
}

const VISIBILITY_DESCRIPTION: Record<PostVisibilityValue, string> = {
  [PostVisibility.PRIVATE]: '본인만 볼 수 있어요',
  [PostVisibility.MEMBERS]: '같이 다녀온 사람들에게만 공개',
  [PostVisibility.PUBLIC]: '누구나 볼 수 있어요',
}

function TripPlaceSelection({ tripId, selected, onToggle }: { tripId: string; selected: PostPlaceSelection[]; onToggle: (place: PostPlaceSelection) => void }) {
  const { data: tripPlaces } = useTripPlaces(tripId)
  if (tripPlaces.length === 0) return <Typography variant="caption" color="text.secondary">이 여행에 등록된 장소가 없습니다</Typography>
  return <View style={{ gap: 6 }}>{tripPlaces.map((place) => { const checked = selected.some((candidate) => candidate.placeId === place.placeId); return <Pressable key={place.id} onPress={() => onToggle({ placeId: place.placeId, name: place.name, address: place.address || null })} style={{ paddingVertical: 10, flexDirection: 'row', alignItems: 'center' }}><View style={{ flex: 1 }}><Typography variant="body2">{place.name}</Typography><Typography variant="caption" color="text.secondary">{place.address}</Typography></View>{checked && <MaterialIcons name="check" size={20} color={palette.primary} />}</Pressable> })}</View>
}

function PlaceListSkeleton() { return <View style={{ gap: 8 }}>{Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} width="100%" height={52} />)}</View> }
