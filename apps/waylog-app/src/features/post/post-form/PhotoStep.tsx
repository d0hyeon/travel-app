import { MaterialIcons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native'
import { BottomArea } from '../../../shared/components/BottomArea'
import { LoadableImage } from '../../../shared/components/LoadableImage'
import { Button, Skeleton, Typography } from '../../../shared/components/mui'
import { palette } from '../../../shared/config/tokens'
import { useTripPhotos } from '../../trip/trip-photo/useTripPhotos'
import type { DraftPostPhoto } from './postForm.types'

export function PhotoStep({ tripId, defaultValue, onNext }: { tripId: string | null; defaultValue: DraftPostPhoto[]; onNext: (photos: DraftPostPhoto[]) => void }) {
  const [availablePhotos, setAvailablePhotos] = useState<DraftPostPhoto[]>(defaultValue.filter((photo) => photo.source === 'local'))
  const [selectedIds, setSelectedIds] = useState(defaultValue.map((photo) => photo.id))
  const selectedPhotos = availablePhotos.filter((photo) => selectedIds.includes(photo.id))
  const addSavedPhotos = useCallback((photos: DraftPostPhoto[]) => setAvailablePhotos((current) => mergePhotos(current, photos)), [])

  const addLocalPhotos = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, exif: true, quality: 1 })
    if (result.canceled) return
    const additions = result.assets.map((asset) => ({ id: asset.assetId ?? asset.uri, source: 'local' as const, uri: asset.uri, placeId: null }))
    setAvailablePhotos((current) => [...current, ...additions.filter((addition) => !current.some((photo) => photo.id === addition.id))])
    setSelectedIds((current) => [...new Set([...current, ...additions.map((photo) => photo.id)])])
  }

  const toggle = (photo: DraftPostPhoto) => setSelectedIds((current) => current.includes(photo.id) ? current.filter((id) => id !== photo.id) : [...current, photo.id])

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 24 }}>
        <SelectedPhotoPreview photos={selectedPhotos} />
        <Pressable onPress={() => void addLocalPhotos()} style={{ height: 48, borderWidth: 1, borderStyle: 'dashed', borderColor: palette.divider, alignItems: 'center', justifyContent: 'center' }}><Typography color="primary">+ 사진 추가</Typography></Pressable>
        {tripId != null && <Suspense fallback={<PhotoGridSkeleton />}><SavedTripPhotos tripId={tripId} onLoad={addSavedPhotos} /></Suspense>}
        <PhotoGrid photos={availablePhotos} selectedIds={selectedIds} onToggle={toggle} />
      </ScrollView>
      <BottomArea position="static" sx={{ borderTopWidth: 1, borderTopColor: palette.divider }}><Button variant="contained" size="large" fullWidth disabled={selectedPhotos.length === 0} onClick={() => onNext(selectedPhotos)}>다음 ({selectedPhotos.length}장)</Button></BottomArea>
    </View>
  )
}

function SavedTripPhotos({ tripId, onLoad }: { tripId: string; onLoad: (photos: DraftPostPhoto[]) => void }) {
  const { data } = useTripPhotos(tripId)
  const photos = useMemo(() => data.map((photo) => ({ id: photo.id, savedPhotoId: photo.id, source: 'saved' as const, uri: photo.url, placeId: photo.placeId })), [data])
  useEffect(() => onLoad(photos), [onLoad, photos])
  return null
}

function SelectedPhotoPreview({ photos }: { photos: DraftPostPhoto[] }) {
  const [firstPhoto] = photos
  if (firstPhoto == null) return <View style={{ aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: palette.divider }}><MaterialIcons name="photo-library" size={44} color={palette.textSecondary} /></View>
  return <LoadableImage source={{ uri: firstPhoto.uri }} style={{ width: '100%', aspectRatio: 1 }} resizeMode="cover" />
}

function PhotoGrid({ photos, selectedIds, onToggle }: { photos: DraftPostPhoto[]; selectedIds: string[]; onToggle: (photo: DraftPostPhoto) => void }) {
  const { width } = useWindowDimensions()
  const size = (width - 36) / 3
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>{photos.map((photo, index) => { const selected = selectedIds.includes(photo.id); return <Pressable key={photo.id} accessibilityRole="button" accessibilityLabel={`사진 ${index + 1}`} accessibilityState={{ selected }} onPress={() => onToggle(photo)}><LoadableImage source={{ uri: photo.uri }} style={{ width: size, height: size }} resizeMode="cover" />{selected && <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'flex-end', justifyContent: 'flex-end', padding: 8 }}><MaterialIcons name="check-circle" size={24} color="#fff" /></View>}</Pressable> })}</View>
}

function PhotoGridSkeleton() { return <View style={{ flexDirection: 'row', gap: 2 }}>{Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} width="33%" height={112} />)}</View> }

function mergePhotos(current: DraftPostPhoto[], additions: DraftPostPhoto[]) {
  const newPhotos = additions.filter((addition) => !current.some((photo) => photo.id === addition.id))
  return newPhotos.length === 0 ? current : [...current, ...newPhotos]
}
