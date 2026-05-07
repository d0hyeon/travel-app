import { Box, ImageList, ImageListItem, Stack, Typography } from '@mui/material'
import { useUserFeed } from '~features/post/useUserFeed'

interface Props {
  userId: string
}

export function ProfileFeedTab({ userId }: Props) {
  const { data: posts } = useUserFeed(userId)

  if (posts.length === 0) {
    return (
      <Stack alignItems="center" justifyContent="center" py={6}>
        <Typography variant="body2" color="text.secondary">
          아직 포스트가 없어요
        </Typography>
      </Stack>
    )
  }
  return (
    <ImageList cols={3}>
      {posts.map(post => (
        <ImageListItem key={post.id} >
          <Box component="img" src={post.photos[0].url} sx={{ aspectRatio: '1 / 1' }} />
        </ImageListItem>
      ))}

    </ImageList>
  )
}
