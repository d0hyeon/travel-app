import * as ImagePicker from 'expo-image-picker'
import type { Photo } from '@waylog/domains/photo'
import { useState } from 'react'
import { ActivityIndicator, FlatList, Image, Pressable, useWindowDimensions } from 'react-native'
import { Box, Button, Typography } from '../../../shared/components/mui'
import { useConfirmDialog } from '../../../shared/components/confirm-dialog/useConfirmDialog'
import { palette } from '../../../shared/config/tokens'
import { useTripPhotos } from './useTripPhotos'

const COLUMNS = 3
const GAP = 2

interface Props {
  tripId: string
}

export function TripPhotoContent({ tripId }: Props) {
  const { data: photos, upload, remove, isUploading } = useTripPhotos(tripId)
  const confirm = useConfirmDialog()
  const { width } = useWindowDimensions()

  const [selected, setSelected] = useState<Photo | null>(null)
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
          사진 {photos.length}장
        </Typography>
        {isUploading ? (
          <ActivityIndicator />
        ) : (
          <Button size="small" variant="contained" onClick={pick}>
            사진 추가
          </Button>
        )}
      </Box>

      <FlatList
        data={photos}
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
            onPress={() => setSelected(item)}
            onLongPress={async () => {
              if (await confirm('사진을 삭제할까요?')) await remove(item)
            }}
          >
            <Image source={{ uri: item.url }} style={{ width: size, height: size }} />
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
