import { Stack, Typography } from '@mui/material'
import { PostCard } from './PostCard'
import type { Post } from './post.types'

interface Props {
  posts: Post[]
  emptyMessage?: string
}

export function PostFeed({ posts, emptyMessage = '아직 포스트가 없어요' }: Props) {
  if (posts.length === 0) {
    return (
      <Stack alignItems="center" justifyContent="center" py={6}>
        <Typography variant="body2" color="text.secondary">{emptyMessage}</Typography>
      </Stack>
    )
  }

  return (
    <Stack spacing={2}>
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </Stack>
  )
}
