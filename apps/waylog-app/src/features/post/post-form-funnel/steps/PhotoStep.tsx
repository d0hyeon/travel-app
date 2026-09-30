import { MaterialIcons } from '@expo/vector-icons'
import { usePrevValue } from '@waylog/react'
import { useEffect, useRef, useState } from 'react'
import { LayoutChangeEvent, LayoutRectangle, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { Box, Button, Stack } from '~/shared/components/design-system'
import { BottomArea } from '../../../../shared/components/BottomArea'
import { LoadableImage } from '../../../../shared/components/LoadableImage'
import { palette } from '../../../../shared/config/tokens'
import { LibraryPhoto } from '../../../../shared/modules/photo-library/usePhotoLibrary'
import type { PostFormPhoto } from '../postFormFunnel.types'
import { PhotoPicker } from './PhotoPicker'
import { useScrollGesture } from './useScrollGesture'

export function PhotoStep({ tripId, defaultValue, onNext }: { tripId?: string; defaultValue: PostFormPhoto[]; onNext: (photos: PostFormPhoto[]) => void }) {
  const [selectedPhotos, setPhotos] = useState<LibraryPhoto[]>(defaultValue)

  const collapsed = useSharedValue(false);
  const scrollHandlers = useScrollGesture({
    onScrollStart: () => collapsed.set(true),
    onScrollOver: () => collapsed.set(false),
  })

  const [previewSize, handleLayout] = useLayoutSize({ once: true })
  const previewStyle = useAnimatedStyle(() => {
    if (previewSize == null) return {}
    return ({
      height: withTiming(
        collapsed.value
          ? previewSize.width / 2
          : previewSize.width,
      ),
    })
  })

  const handlePreviewPress = () => collapsed.set(false);
  const tapGesture = Gesture.Tap().maxDistance(10)
    .onEnd((_event, success) => {
      if (success) {
        scheduleOnRN(handlePreviewPress)
      }
    })

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <Animated.View style={previewStyle} onLayout={handleLayout}>
          <GestureDetector gesture={tapGesture}>
            <View collapsable={false} style={{ flex: 1 }}>
              <PhotoPreview photos={selectedPhotos} />
            </View>
          </GestureDetector>
        </Animated.View>
        <View style={{ flex: 1, height: '100%' }}>
          <PhotoPicker tripId={tripId} onSelect={setPhotos} onScroll={scrollHandlers} />
        </View>
      </View>
      <BottomArea position="static" style={styles.actions}>
        <Button
          variant="contained"
          size="large"
          fullWidth
          disabled={selectedPhotos.length === 0}
          onPress={() => onNext(selectedPhotos)}
        >
          다음 ({selectedPhotos.length}장)
        </Button>
      </BottomArea>
    </View>
  )
}

function useLayoutSize(options?: { once?: boolean }) {
  const [layout, setLayout] = useState<LayoutRectangle | null>(null);
  const handleLayout = (event: LayoutChangeEvent) => {
    if (options?.once && layout != null) return;
    setLayout(event.nativeEvent.layout)
  }

  return [layout, handleLayout] as const;
}

function PhotoPreview({ photos }: { photos: LibraryPhoto[] }) {
  const [width, setWidth] = useState<number | null>(null);
  const [pageIndex, setPageIndex] = useState(0);

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width == null) return;
    if (width <= 0) return
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width)
    setPageIndex(nextIndex)
  }

  const ref = useRef<ScrollView>(null)
  const prevLength = usePrevValue(photos.length);

  useEffect(() => {
    if (width == null) return;

    if (prevLength < photos.length || pageIndex >= photos.length) {
      const nextIndex = photos.length - 1;
      ref.current?.scrollTo({ x: width * nextIndex, animated: true });
      setPageIndex(nextIndex);
    }
  }, [photos.length]);


  if (photos.length === 0) {
    return (
      <View style={[styles.photoPlaceholder, { height: '100%' }]}>
        <MaterialIcons name="photo-library" size={44} color={palette.textSecondary} />
      </View>
    )
  }

  return (
    <View style={styles.previewContainer}>
      <ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      >

        {photos.map((photo) => (
          <Stack key={`preview-${photo.uri}`} style={{ width, height: '100%', }}>
            <LoadableImage source={{ uri: photo.uri }} style={{ height: '100%' }} resizeMode='contain' />
          </Stack>
        ))}

      </ScrollView>
      {photos.length > 1 && (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          style={styles.pagination}
        >
          {photos.map((photo, index) => (
            <Box
              key={`preview-pagenation-${photo.uri}=${index}`}
              style={[styles.paginationDot, { width: index === pageIndex ? 6 : 5, height: index === pageIndex ? 6 : 5, backgroundColor: index === pageIndex ? palette.primary : 'rgba(255,255,255,0.5)' }]}
            />
          ))}
        </Stack>
      )}
    </View>
  )
}


const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 24, flex: 1 },
  actions: { borderTopWidth: 1, borderTopColor: palette.divider },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: palette.divider, borderRadius: 16 },

  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  selectedOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'flex-end', justifyContent: 'flex-end', padding: 8 },
  previews: { flexDirection: 'row', gap: 2 },
  previewContainer: { position: 'relative', height: '100%', width: '100%', borderWidth: 1, borderStyle: 'solid', borderColor: palette.divider, borderRadius: 16 },
  pagination: { position: 'absolute', bottom: 8, left: 0, right: 0, gap: 4 },
  paginationDot: { borderRadius: 3, backgroundColor: palette.primary },
})
