import { PostVisibility, type Post } from '@waylog/domains/modules/post'
import { MaterialIcons } from '@expo/vector-icons'
import {
  Pressable,
  ScrollView,
  useWindowDimensions,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native'
import React from 'react'
import { Box, Stack, Typography } from '~/shared/components/design-system'
import { palette } from '../../shared/config/tokens'
import { PostAuthor } from './PostAuthor'
import { PostLikeButton } from './PostLikeButton'
import { LoadableImage } from '../../shared/components/LoadableImage'

interface Props {
  post: Post
  onPress: () => void
}

export function PostCard({ post, onPress }: Props) {
  const [cardWidth, setCardWidth] = React.useState(0)
  // 카드 폭을 재기 전에는 정사각형 높이를 알 수 없어 레이아웃이 순간 시프트한다.
  // 화면 폭 근사치를 최소 높이로 먼저 잡아 자리를 비워 둔다.
  const { width: screenWidth } = useWindowDimensions()
  const estimatedHeight = screenWidth - 32

  const handleCardLayout = (event: LayoutChangeEvent) => {
    const nextWidth = event?.nativeEvent?.layout?.width
    if (typeof nextWidth !== 'number' || nextWidth <= 0) return
    setCardWidth((currentWidth) => currentWidth === nextWidth ? currentWidth : nextWidth)
  }

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="포스트 상세 보기">
      <Box onLayout={handleCardLayout} style={{ overflow: 'hidden', borderRadius: 16, backgroundColor: '#fff' }}>
        <PostPhotoGallery post={post} width={cardWidth} minHeight={estimatedHeight} />
        <Stack style={{ gap: 8, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 16 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" style={{ gap: 8 }}>
            <PostAuthor
              authorId={post.authorId}
              place={post.places[0]?.name}
              additionalPlaceCount={Math.max(0, post.places.length - 1)}
              onPress={onPress}
            />
            <PostLikeButton postId={post.id} />
          </Stack>
          {post.description && <Typography style={{ color: palette.textSecondary, fontSize: 13, paddingHorizontal: 4 }}>{post.description}</Typography>}
          {post.visibility !== PostVisibility.PUBLIC && (
            <Stack direction="row" alignItems="center" style={{ gap: 4 }}>
              <MaterialIcons name="lock-outline" size={14} color={palette.textSecondary} />
              <Typography style={{ color: palette.textSecondary, fontSize: 11 }}>비공개</Typography>
            </Stack>
          )}
        </Stack>
      </Box>
    </Pressable>
  )
}

function PostPhotoGallery({ post, width, minHeight }: { post: Post; width: number; minHeight: number }) {
  const pageWidth = width > 0 ? width : '100%'
  const [pageIndex, setPageIndex] = React.useState(0)

  if (post.photos.length === 0) {
    return <Box style={{ aspectRatio: 1, minHeight, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.06)' }}><MaterialIcons name="image" size={40} color={palette.textSecondary} /></Box>
  }

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width <= 0) return
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width)
    setPageIndex(nextIndex)
  }

  return (
    <Box style={{ position: 'relative' }}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        style={{ minHeight }}
      >
        {post.photos.map((photo) => (
          <LoadableImage key={photo.url} source={{ uri: photo.url }} style={{ width: pageWidth, aspectRatio: 1, minHeight }} resizeMode="cover" />
        ))}
      </ScrollView>
      {post.photos.length > 1 && (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          style={{ position: 'absolute', bottom: 8, left: 0, right: 0, gap: 4 }}
        >
          {post.photos.map((photo, index) => (
            <Box
              key={photo.url}
              style={{
                width: index === pageIndex ? 6 : 5,
                height: index === pageIndex ? 6 : 5,
                borderRadius: 3,
                backgroundColor: index === pageIndex ? '#fff' : 'rgba(255,255,255,0.5)',
              }}
            />
          ))}
        </Stack>
      )}
    </Box>
  )
}
