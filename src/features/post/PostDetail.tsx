import { Box, ImageList, ImageListItem, Stack, Typography } from '@mui/material'
import { PhotoThunbnail } from '~shared/components/photo/PhotoThumbnail'
import { PostLikeButton } from './PostLikeButton'
import type { PhotoPost } from './post.types'

interface Props {
  post: PhotoPost
}

export function PostDetail({ post }: Props) {
  return (
    <Stack spacing={2} px={2} py={2}>
      {post.title && (
        <Typography variant="h6">{post.title}</Typography>
      )}

      <ImageList cols={1} gap={8}>
        {post.photos.map(photo => (
          <ImageListItem key={photo.id}>
            <PhotoThunbnail src={photo.url} />
          </ImageListItem>
        ))}
      </ImageList>

      {post.description && (
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {post.description}
        </Typography>
      )}

      <Box>
        <PostLikeButton postId={post.id} />
      </Box>
    </Stack>
  )
}
