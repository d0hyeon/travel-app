import {
  PlaceCategoryColorCode,
  PlaceCategoryTypeLabel,
  PlaceCategoryTypes,
  type PlaceCategoryType,
} from '@waylog/domains/modules/place'
import { forwardRef, useImperativeHandle, useState } from 'react'
import { Linking, Pressable } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { MaterialIcons } from '@expo/vector-icons'
import { Controller, useForm } from 'react-hook-form'
import { Box, Chip, Stack, TextField, Typography } from '../../../../shared/components/mui'
import { PopMenu } from '../../../../shared/components/PopMenu'
import { useTripPhotos } from '../../trip-photo/useTripPhotos'
import { LoadableImage } from '../../../../shared/components/LoadableImage'

export interface PlaceFormValues {
  name: string
  address: string
  /** null은 미설정 */
  category: PlaceCategoryType | null
  memo: string
  tags: string[]
  placeId?: string
}

export interface PlaceFormRef {
  submit: () => void
}

interface Props {
  tripId: string
  defaultValues?: Partial<PlaceFormValues>
  onSubmit: (data: PlaceFormValues) => void
}

// 웹 PlaceForm 과 같은 값 모양을 유지한다.
export const PlaceForm = forwardRef<PlaceFormRef, Props>(function PlaceForm(
  { tripId, defaultValues, onSubmit },
  ref,
) {
  const { control, handleSubmit, watch, setValue } = useForm<PlaceFormValues>({
    defaultValues: {
      name: '',
      address: '',
      category: null,
      memo: '',
      tags: [],
      ...defaultValues,
    },
  })

  const [tagInput, setTagInput] = useState('')
  const category = watch('category')
  const tags = watch('tags')
  const placeId = defaultValues?.placeId
  const { data: photos, upload, remove } = useTripPhotos(tripId)
  const placePhotos = photos.filter((photo) => photo.placeId === placeId)

  const addPhoto = async () => {
    if (placeId == null) return
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) return
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, quality: 1 })
    if (!result.canceled) await upload({ assets: result.assets, placeId })
  }

  useImperativeHandle(ref, () => ({ submit: () => void handleSubmit(onSubmit)() }), [
    handleSubmit,
    onSubmit,
  ])

  return (
    <Stack gap={2}>
      <Stack direction="row" gap={1}>
        <Chip label="네이버" variant="outlined" onClick={() => void Linking.openURL(`https://search.naver.com/search.naver?query=${encodeURIComponent(watch('name'))}`)} />
        <Chip label="인스타" variant="outlined" onClick={() => void Linking.openURL(`https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(watch('name').replaceAll(' ', ''))}`)} />
        <Chip label="구글" variant="outlined" onClick={() => void Linking.openURL(`https://www.google.com/search?q=${encodeURIComponent(watch('name'))}`)} />
      </Stack>

      <Typography variant="body1" color="text.secondary">
        {watch('address')}
      </Typography>

      <Stack gap={1}>
        <Typography variant="caption" color="text.secondary">
          카테고리
        </Typography>
        <PopMenu
          trigger={(
            <TextField
              pointerEvents="none"
              fullWidth
              variant="outlined"
              value={category == null ? '선택 안함' : PlaceCategoryTypeLabel[category]}
              editable={false}
            />
          )}
          items={(
            <>
              <PopMenu.Item onClick={() => setValue('category', null)}>선택 안함</PopMenu.Item>
              {PlaceCategoryTypes.map((type) => (
                <PopMenu.Item key={type} onClick={() => setValue('category', type)}>
                  <Stack direction="row" gap={1} alignItems="center">
                    <Box sx={{ width: 12, height: 12, borderRadius: 6, backgroundColor: PlaceCategoryColorCode[type] }} />
                    <Typography>{PlaceCategoryTypeLabel[type]}</Typography>
                  </Stack>
                </PopMenu.Item>
              ))}
            </>
          )}
        />
      </Stack>

      <Controller
        control={control}
        name="memo"
        render={({ field }) => (
          <TextField
            placeholder="메모"
            fullWidth
            multiline
            minRows={3}
            value={field.value}
            onChangeText={field.onChange}
          />
        )}
      />

      <Stack gap={1}>
        <Typography variant="caption" color="text.secondary">
          태그
        </Typography>
        <TextField
          placeholder="입력 후 엔터"
          fullWidth
          variant="standard"
          value={tagInput}
          onChangeText={setTagInput}
          onSubmitEditing={() => {
            const next = tagInput.trim()
            if (next === '' || tags.includes(next)) return
            setValue('tags', [...tags, next])
            setTagInput('')
          }}
        />
        {tags.length > 0 && (
          <Stack direction="row" gap={0.5} sx={{ flexWrap: 'wrap' }}>
            {tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                onDelete={() => setValue('tags', tags.filter((x) => x !== tag))}
              />
            ))}
          </Stack>
        )}
      </Stack>

      <Stack gap={1}>
        <Typography variant="subtitle2" sx={{ fontWeight: '800' }}>사진</Typography>
        <Stack direction="row" gap={1} sx={{ flexWrap: 'wrap' }}>
          <Pressable onPress={() => void addPhoto()}>
            <Box sx={{ width: 96, height: 96, flexShrink: 0, borderWidth: 2, borderStyle: 'dashed', borderColor: '#dddddd', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialIcons name="add-photo-alternate" size={30} color="#777" />
            </Box>
          </Pressable>
          {placePhotos.map((photo) => (
            <Pressable key={photo.id} onLongPress={() => void remove(photo)}>
              <LoadableImage source={{ uri: photo.url }} style={{ width: 96, height: 96, borderRadius: 12 }} resizeMode="cover" />
            </Pressable>
          ))}
        </Stack>
      </Stack>
    </Stack>
  )
})
