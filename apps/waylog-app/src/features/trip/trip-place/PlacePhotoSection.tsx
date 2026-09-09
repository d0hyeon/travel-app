import * as ImagePicker from 'expo-image-picker'
import { MaterialIcons } from '@expo/vector-icons'
import { StyleSheet, Pressable } from 'react-native'
import { Box, Stack, Typography } from '~/shared/components/design-system'
import { LoadableImage } from '../../../shared/components/LoadableImage'
import { usePlacePhotos } from './useTripPlacePhotos'

interface PlacePhotoSectionProps {
  tripId: string
  placeId: string
}

/**
 * 웹 PlacePhotoSection 과 같은 역할. 장소 사진 업로드·삭제를 담당한다.
 * 앱은 사진 상세 뷰어가 없어 삭제는 롱프레스로 받는다.
 */
export function PlacePhotoSection({ tripId, placeId }: PlacePhotoSectionProps) {
  const { data: photos, upload, remove } = usePlacePhotos(tripId, placeId)

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
    <Stack gap={1}>
      <Typography variant="subtitle2" style={styles.title}>사진</Typography>
      <Stack direction="row" gap={1} style={styles.photoList}>
        <Pressable onPress={() => void addPhoto()}>
          <Box style={styles.uploadButton}>
            <MaterialIcons name="add-photo-alternate" size={30} color="#777" />
          </Box>
        </Pressable>
        {photos.map((photo) => (
          <Pressable key={photo.id} onLongPress={() => void remove(photo)}>
            <LoadableImage source={{ uri: photo.url }} style={styles.photo} resizeMode="cover" />
          </Pressable>
        ))}
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
