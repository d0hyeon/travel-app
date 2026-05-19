import { Stack } from '@mui/material'
import { useFeed } from './useFeed'


// @ts-ignore
import 'swiper/css'
// @ts-ignore
import 'swiper/css/pagination'
import { useScrollRestore } from '~shared/hooks/interaction/useScrollRestore'
import { PostCard } from './PostCard'




export function PostFeed() {
  const { data: posts } = useFeed()
  useScrollRestore();

  return (
    <Stack spacing={2} onPointerDown={(event) => console.log(event)}>
      {posts.map((post) => <PostCard key={post.id} post={post} />)}
    </Stack >
  )
}
