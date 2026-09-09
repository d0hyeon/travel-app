import { AuthGuard } from '@waylog/domains/clients'
import { Redirect, useLocalSearchParams } from 'expo-router'
import { PostDetailScreen } from '../../src/features/post/PostDetailScreen'

export default function PostDetailRoute() {
  const { postId } = useLocalSearchParams<{ postId?: string }>()

  if (typeof postId !== 'string') return <Redirect href="/feed" />

  return (
    <AuthGuard fallback={<Redirect href="/login" />}>
      <PostDetailScreen postId={postId} />
    </AuthGuard>
  )
}
