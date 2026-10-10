import { MaterialIcons } from '@expo/vector-icons'
import { useLoading } from '@waylog/react'
import * as ImagePicker from 'expo-image-picker'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native'
import { useConfirmDialog } from '~shared/components/confirm-dialog/useConfirmDialog'
import { Box, Skeleton, Stack, StackProps, Typography } from '~shared/components/design-system'
import { LoadableImage } from '~shared/components/LoadableImage'
import { PhotoBottomSheet } from '~shared/components/photo/PhotoBottomSheet'
import { useOverlay } from '~shared/hooks/useOverlay'
import { toast } from '~shared/components/toast/toast'
import { usePlacePhotos } from './useTripPlacePhotos'

interface PlacePhotoSectionProps extends StackProps {
  tripId: string
  placeId: string
}

/**
 * 웹 PlacePhotoSection 과 같은 역할. 장소 사진 업로드·삭제를 담당한다.
 * 이미 한 장소 안이라 장소 재지정은 열어 두지 않는다. 웹과 같다.
 */
export function PlacePhotoSection({ tripId, placeId, ...props }: PlacePhotoSectionProps) {
  const { data: photos, upload, remove, update } = usePlacePhotos(tripId, placeId)
  const confirm = useConfirmDialog()
  const overlay = useOverlay()

  const openPhotoViewer = (initialIndex: number) => {
    overlay.open(({ isOpen, close }) => (
      <PhotoBottomSheet
        isOpen={isOpen}
        photos={photos}
        initialIndex={initialIndex}
        onUpdate={update}
        onDelete={async (photo) => {
          if (!(await confirm('사진을 삭제할까요?'))) return
          try {
            await remove(photo)
            toast.success('사진을 삭제했어요')
            close()
          } catch {
            toast.error('사진을 삭제하지 못했어요')
          }
        }}
        onClose={close}
      />
    ))
  }

  const [isPending, startTransition] = useLoading();
  
  const addPhoto = () => {
    startTransition(async () => {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 1,
      })
      if (!result.canceled) await upload(result.assets)
    })
  }


  return (
    <Stack gap={1} {...props}>
      <Typography variant="subtitle2" style={styles.title}>사진</Typography>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Stack direction="row" gap={1}>
          <Pressable onPress={() => void addPhoto()} disabled={isPending}>
            <Box style={styles.uploadButton}>
              {isPending 
                ? <ActivityIndicator /> 
                : <MaterialIcons name="add-photo-alternate" size={30} color="#777" />}
            </Box>
          </Pressable>
          {photos.map((photo, index) => (
            <Pressable key={photo.id} onPress={() => openPhotoViewer(index)}>
              <LoadableImage source={{ uri: photo.url }} style={styles.photo} contentFit="cover" />
            </Pressable>
          ))}
        </Stack>
      </ScrollView>
    </Stack>
  )
}
PlacePhotoSection.Skeleton = (props: StackProps) => {
  return (
    <Stack gap={1} {...props}>
      <Typography variant="subtitle2" style={styles.title}>사진</Typography>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Stack direction="row" gap={1}>
          <Box style={styles.uploadButton}>
            <MaterialIcons name="add-photo-alternate" size={30} color="#777" />
          </Box>

          <Skeleton style={styles.photo} />
          <Skeleton style={styles.photo} />
          <Skeleton style={styles.photo} />
        </Stack>
      </ScrollView>
    </Stack>
  )
}

const styles = StyleSheet.create({
  title: { fontWeight: '800' },
  uploadButton: { width: 96, height: 96, flexShrink: 0, borderWidth: 2, borderStyle: 'dashed', borderColor: '#dddddd', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  photo: { width: 96, height: 96, borderRadius: 12 },
})
