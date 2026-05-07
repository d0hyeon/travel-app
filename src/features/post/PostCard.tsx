import { Box, Card, CardActionArea, CardContent, Stack, Typography } from '@mui/material'
import { Link } from 'react-router'
import { PhotoThunbnail } from '~shared/components/photo/PhotoThumbnail'
import { PostLikeButton } from './PostLikeButton'
import type { Post } from './post.types'

interface Props {
  post: Post
}

export function PostCard({ post }: Props) {
  const cover = post.photos[0]

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardActionArea component={Link} to={`/post/${post.id}`}>
        {cover && (
          <Box sx={{ aspectRatio: '4 / 3', overflow: 'hidden' }}>
            <PhotoThunbnail src={cover.url} />
          </Box>
        )}
        <CardContent>
          <Stack spacing={1}>
            {post.title && (
              <Typography variant="subtitle1" noWrap>{post.title}</Typography>
            )}
            {post.description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {post.description}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary">
              사진 {post.photos.length}장
            </Typography>
          </Stack>
        </CardContent>
      </CardActionArea>
      <Box px={2} pb={1}>
        <PostLikeButton postId={post.id} />
      </Box>
    </Card>
  )
}
