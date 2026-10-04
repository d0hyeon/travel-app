import { MaterialIcons } from '@expo/vector-icons'
import { AsyncBoundary, FallbackProps } from '@waylog/react'
import { ExceptionError, reverseKeyValue, ValueOf } from '@waylog/utility'
import { Fragment, useMemo, useState } from 'react'
import { Linking, NativeScrollEvent, NativeSyntheticEvent, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { Box, Button, Skeleton, Stack, Typography } from '~shared/components/design-system'
import { useTripPhotos } from '~features/trip/trip-photo/useTripPhotos'
import { CommonErrorAlert } from '~shared/components/CommonErrorAlert'
import { PopMenu } from '~shared/components/PopMenu'
import { LoadableImage } from '~shared/components/LoadableImage'
import { palette } from '~shared/config/tokens'
import { LibraryPhoto, usePhotoLibrary } from '~shared/modules/photo-library/usePhotoLibrary'
import { usePhotoLibraryPermission } from '~shared/modules/photo-library/usePhotoLibraryPermission'
import { assert } from '~shared/utils/assert'

interface Props {
  tripId?: string;
  onSelect?: (photo: LibraryPhoto[]) => void;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

const PhotoCollectionType = {
  '최근 사진': 'all',
  '여행 사진첩': 'trip'
} as const;
type PhotoCollectionType = ValueOf<typeof PhotoCollectionType>;
const PhotoCollectionTypeLabel = reverseKeyValue(PhotoCollectionType);

export function PhotoPicker(props: Props) {

  return (
    <AsyncBoundary pendingFallback={<Pending />} rejectedFallback={props => <Rejected {...props} />}>
      <Resolved {...props} />
    </AsyncBoundary>
  )
}

function Resolved({ tripId, onSelect, onScroll }: Props) {
  const { hasPermission } = usePhotoLibraryPermission({ suspense: true })
  assert(hasPermission, new ExceptionError('권한이 없습니다.', { cause: 'permission' }));

  const [collection, setCollection] = useState<PhotoCollectionType>('all');
  const [selectedPhotos, setSelectedPhotos] = useState<LibraryPhoto[]>([]);

  const { data: userPhotos, hasNextPage, fetchNextPage, isFetchingNextPage } = usePhotoLibrary()
  const { data: tripPhotos = [] } = useTripPhotos(tripId!, {
    enabled: tripId != null
  });

  const photos = useMemo(() => {
    if (collection === 'trip') {
      return tripPhotos.map(({ id, url }) => ({ id, uri: url }))
    }
    return userPhotos;
  }, [collection, userPhotos, tripPhotos])


  const { width } = useWindowDimensions()
  const photoSize = (width - 36) / 3

  return (
    <View style={styles.panel}>
      <PopMenu
        items={Object.entries(PhotoCollectionType).map(([label, value]) => (
          <PopMenu.Item key={value} onPress={() => setCollection(value)}>{label}</PopMenu.Item>
        ))}
      >
        <Stack direction="row" alignItems="center" gap={0.5}>
          <Typography variant="body2">
            {PhotoCollectionTypeLabel[collection]}
          </Typography>
          <MaterialIcons name="keyboard-arrow-down" size={20} />
        </Stack>
      </PopMenu>

      <Animated.FlatList
        data={photos}
        numColumns={3}
        keyExtractor={(photo) => photo.uri}
        contentContainerStyle={styles.photoGrid}
        onScroll={onScroll}
        renderItem={({ item: photo, index }) => {
          const isSelected = selectedPhotos.some(x => x.id === photo.id)

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`사진 ${index + 1}`}
              accessibilityState={{ selected: isSelected }}
              onPress={() => {
                const nextItems = isSelected
                  ? selectedPhotos.filter(x => x.id !== photo.id)
                  : [...selectedPhotos, photo]

                setSelectedPhotos(nextItems)
                onSelect?.(nextItems)
              }}
              style={{ marginInline: 1 }}
            >
              <LoadableImage
                source={{ uri: photo.uri }}
                style={{ width: photoSize, height: photoSize }}
                contentFit="cover"
              />

              {isSelected && (
                <View style={styles.selectedOverlay}>
                  <MaterialIcons name="check-circle" size={24} color="#fff" />
                </View>
              )}
            </Pressable>
          )
        }}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage()
          }
        }}
        onEndReachedThreshold={0.2}
      />
    </View >
  )
}

function Rejected({ error, resetError }: FallbackProps) {
  const permission = usePhotoLibraryPermission()

  if (error.cause !== 'permission') {
    <CommonErrorAlert
      message={error.message}
      action={<CommonErrorAlert.RetryButton onPress={resetError} />}
    />
  }

  const handlePresss = async () => {
    if (permission.isPermissionRequestAvailable) {
      await permission.requestPermission();
    } else {
      await Linking.openSettings();
    }
    resetError();
  }
  return (
    <View style={styles.permissionNotice}>
      <Typography variant="subtitle1">접근 권한이 필요해요.</Typography>
      <Typography color="text.secondary">게시물에 넣을 사진을 직접 고를 수 있어요.</Typography>
      {permission.isPermissionRequestAvailable
        ? <Button variant="outlined" onPress={handlePresss}>권한 허용</Button>
        : <Button variant="text" onPress={handlePresss}>설정 열기</Button>
      }
    </View>
  )
}

function Pending() {
  const { width } = useWindowDimensions()
  const photoSize = (width - 36) / 3

  return (
    <View style={styles.panel}>
      <Skeleton variant='text' width={100} />
      <View style={styles.photoGrid}>
        {Array.from({ length: 3 }).map((_, index) => (
          <Fragment key={index}>
            <Box width={photoSize} height={photoSize}>
              <Skeleton height="100%" width="100%" />
            </Box>
            <Box width={photoSize} height={photoSize}>
              <Skeleton height="100%" width="100%" />
            </Box>
            <Box width={photoSize} height={photoSize}>
              <Skeleton height="100%" width="100%" />
            </Box>
          </Fragment>
        ))}

      </View>
    </View >
  )
}


const styles = StyleSheet.create({
  panel: { gap: 12, width: '100%', height: '100%' },
  loading: { minHeight: 160, alignItems: 'center', justifyContent: 'center' },
  permissionNotice: { minHeight: 160, alignItems: 'center', justifyContent: 'center', gap: 8 },
  collectionList: { gap: 8 },
  collectionButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, backgroundColor: palette.primaryContainer },
  selectedCollectionButton: { backgroundColor: palette.primary },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, paddingBottom: 24, },
  selectedOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'flex-end', justifyContent: 'flex-end', padding: 8 },
  empty: { minHeight: 160, alignItems: 'center', justifyContent: 'center' },
})

