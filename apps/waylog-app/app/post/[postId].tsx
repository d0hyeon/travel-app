import { useAuth } from '@waylog/domains/clients'
import { Redirect, useLocalSearchParams } from 'expo-router'
import { PostDetailScreen } from '../../src/features/post/PostDetailScreen'

export default function PostDetailRoute() {
  const { data: auth } = useAuth({ required: false })
  const { postId } = useLocalSearchParams<{ postId?: string }>()

  if (auth == null) return <Redirect href="/login" />
  if (typeof postId !== 'string') return <Redirect href="/feed" />

  return <PostDetailScreen postId={postId} />
}
