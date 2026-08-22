import { MaterialIcons } from '@expo/vector-icons'
import { PostVisibility, type PostVisibility as PostVisibilityValue } from '@waylog/domains/modules/post'
import { useState } from 'react'
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native'
import { BottomArea } from '../../../shared/components/BottomArea'
import { LoadableImage } from '../../../shared/components/LoadableImage'
import { Button, TextField, Typography } from '../../../shared/components/mui'
import { palette } from '../../../shared/config/tokens'
import { usePostPlacesBottomSheet } from './usePostPlacesBottomSheet'
import { VISIBILITY_OPTIONS, usePostVisibilityBottomSheet } from './usePostVisibilityBottomSheet'
import type { DraftPostPhoto, PostMetaValue, PostPlaceSelection } from './postForm.types'

export function MetaStep({ tripId, photos, isPending, onSubmit }: { tripId: string | null; photos: DraftPostPhoto[]; isPending: boolean; onSubmit: (value: PostMetaValue) => Promise<void> }) {
  const { width } = useWindowDimensions()
  const [description, setDescription] = useState('')
  const [places, setPlaces] = useState<PostPlaceSelection[]>([])
  const [visibility, setVisibility] = useState<PostVisibilityValue>(PostVisibility.PRIVATE)
  const placesSheet = usePostPlacesBottomSheet()
  const visibilitySheet = usePostVisibilityBottomSheet()
  const photoWidth = width - 32
  const placesLabel = places.length === 0 ? '선택 안 함' : places.length === 1 ? places[0]?.name : `${places[0]?.name} 외 ${places.length - 1}`

  const editPlaces = async () => {
    const selected = await placesSheet.open({ tripId, defaultValue: places })
    if (selected == null) return
    setPlaces(selected)
  }

  const editVisibility = async () => {
    const selected = await visibilitySheet.open({ tripId, defaultValue: visibility })
    if (selected == null) return
    setVisibility(selected)
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 24 }}>
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>{photos.map((photo) => <LoadableImage key={photo.id} source={{ uri: photo.uri }} style={{ width: photoWidth, aspectRatio: 1 }} resizeMode="cover" />)}</ScrollView>
        <TextField value={description} onChangeText={setDescription} placeholder="여행에 대해 한 줄 남겨주세요" multiline minRows={3} fullWidth />
        <View style={{ gap: 8 }}>
          <OverlayField label="위치" value={placesLabel ?? '선택 안 함'} onPress={() => void editPlaces()} />
          <OverlayField label="공개 범위" value={VISIBILITY_OPTIONS.find((option) => option.value === visibility)?.label ?? ''} onPress={() => void editVisibility()} />
        </View>
      </ScrollView>
      <BottomArea position="static" sx={{ borderTopWidth: 1, borderTopColor: palette.divider }}><Button variant="contained" size="large" fullWidth disabled={isPending} onClick={() => void onSubmit({ description: description.trim(), places, visibility })}>{isPending ? '등록 중…' : '확인'}</Button></BottomArea>
    </View>
  )
}

function OverlayField({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Typography variant="subtitle2">{label}</Typography><View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Typography variant="caption" color="text.secondary">{value}</Typography><MaterialIcons name="chevron-right" size={22} color={palette.textSecondary} /></View></Pressable>
}
