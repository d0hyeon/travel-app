import { Box, ImageList, ImageListItem, Stack, Typography } from '@mui/material'
import { generatePath, Link } from 'react-router'
import { AppRoute } from '~app/routes'
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
          <Link to={generatePath(AppRoute.포스트_상세, { postId: post.id })} viewTransition>
            <Box
              component="img"
              src={post.photos[0].url}
              sx={{ width: '100%', height: '100%', aspectRatio: '1 / 1', objectFit: 'cover', objectPosition: 'center' }}
            />
          </Link>
        </ImageListItem>
      ))}

    </ImageList>
  )
}
