import { PostVisibility, type Post } from '@waylog/domains/modules/post'
import { MaterialIcons } from '@expo/vector-icons'
import { Pressable, ScrollView, type LayoutChangeEvent } from 'react-native'
import React from 'react'
import { Box, Stack, Typography } from '../../shared/components/mui'
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

  const handleCardLayout = (event: LayoutChangeEvent) => {
    const nextWidth = event?.nativeEvent?.layout?.width
    if (typeof nextWidth !== 'number' || nextWidth <= 0) return
    setCardWidth((currentWidth) => currentWidth === nextWidth ? currentWidth : nextWidth)
  }

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="포스트 상세 보기">
      <Box onLayout={handleCardLayout} sx={{ overflow: 'hidden', borderRadius: 16, backgroundColor: '#fff' }}>
        <PostPhotoGallery post={post} width={cardWidth} />
        <Stack sx={{ gap: 8, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 16 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ gap: 8 }}>
            <PostAuthor
              authorId={post.authorId}
              place={post.places[0]?.name}
              additionalPlaceCount={Math.max(0, post.places.length - 1)}
              onPress={onPress}
            />
            <PostLikeButton postId={post.id} />
          </Stack>
          {post.description && <Typography sx={{ color: palette.textSecondary, fontSize: 13, paddingHorizontal: 4 }}>{post.description}</Typography>}
          {post.visibility !== PostVisibility.PUBLIC && (
            <Stack direction="row" alignItems="center" sx={{ gap: 4 }}>
              <MaterialIcons name="lock-outline" size={14} color={palette.textSecondary} />
              <Typography sx={{ color: palette.textSecondary, fontSize: 11 }}>비공개</Typography>
            </Stack>
          )}
        </Stack>
      </Box>
    </Pressable>
  )
}

function PostPhotoGallery({ post, width }: { post: Post; width: number }) {
  const pageWidth = width > 0 ? width : '100%'

  if (post.photos.length === 0) {
    return <Box sx={{ aspectRatio: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.06)' }}><MaterialIcons name="image" size={40} color={palette.textSecondary} /></Box>
  }

  return (
    <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
      {post.photos.map((photo) => (
        <LoadableImage key={photo.url} source={{ uri: photo.url }} style={{ width: pageWidth, aspectRatio: 1 }} resizeMode="cover" />
      ))}
    </ScrollView>
  )
}
