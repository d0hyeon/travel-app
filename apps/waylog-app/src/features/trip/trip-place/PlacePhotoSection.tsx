import * as ImagePicker from 'expo-image-picker'
import { MaterialIcons } from '@expo/vector-icons'
import { StyleSheet, Pressable } from 'react-native'
import { Box, Skeleton, Stack, StackProps, Typography } from '~/shared/components/design-system'
import { LoadableImage } from '../../../shared/components/LoadableImage'
import { PhotoBottomSheet } from '../../../shared/components/photo/PhotoBottomSheet'
import { useConfirmDialog } from '../../../shared/components/confirm-dialog/useConfirmDialog'
import { useOverlay } from '../../../shared/hooks/useOverlay'
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
          await remove(photo)
          close()
        }}
        onClose={close}
      />
    ))
  }

  const addPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) return
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 1,
    })
    if (!result.canceled) await upload(result.assets)
  }


  return (
    <Stack gap={1} {...props}>
      <Typography variant="subtitle2" style={styles.title}>사진</Typography>
      <Stack direction="row" gap={1} style={styles.photoList}>
        <Pressable onPress={() => void addPhoto()}>
          <Box style={styles.uploadButton}>
            <MaterialIcons name="add-photo-alternate" size={30} color="#777" />
          </Box>
        </Pressable>
        {photos.map((photo, index) => (
          <Pressable key={photo.id} onPress={() => openPhotoViewer(index)}>
            <LoadableImage source={{ uri: photo.url }} style={styles.photo} resizeMode="cover" />
          </Pressable>
        ))}
      </Stack>
    </Stack>
  )
}
PlacePhotoSection.Skeleton = (props: StackProps) => {
  return (
    <Stack gap={1} {...props}>
      <Typography variant="subtitle2" style={styles.title}>사진</Typography>
      <Stack direction="row" gap={1} style={styles.photoList}>
        <Box style={styles.uploadButton}>
          <MaterialIcons name="add-photo-alternate" size={30} color="#777" />
        </Box>

        <Skeleton style={styles.photo} />
        <Skeleton style={styles.photo} />
        <Skeleton style={styles.photo} />
      </Stack>
    </Stack>
  )
}

const styles = StyleSheet.create({
  title: { fontWeight: '800' },
  photoList: { flexWrap: 'wrap' },
  uploadButton: { width: 96, height: 96, flexShrink: 0, borderWidth: 2, borderStyle: 'dashed', borderColor: '#dddddd', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  photo: { width: 96, height: 96, borderRadius: 12 },
})
