import { Stack, Typography } from '@mui/material'
import { PostCard } from '~features/post/PostCard'
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
    <Stack spacing={2} px={2} py={2}>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </Stack>
  )
}
