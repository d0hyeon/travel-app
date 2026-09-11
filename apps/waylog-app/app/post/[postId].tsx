import { AuthGuard } from '@waylog/domains/clients'
import { Redirect, useLocalSearchParams } from 'expo-router'
import { PostDetailScreen } from '../../src/features/post/PostDetailScreen'
import { LoginRedirect } from '../../src/features/auth/auth-redirect'

export default function PostDetailRoute() {
  const { postId } = useLocalSearchParams<{ postId?: string }>()

  if (typeof postId !== 'string') return <Redirect href="/feed" />

  return (
    <AuthGuard fallback={<LoginRedirect />}>
      <PostDetailScreen postId={postId} />
    </AuthGuard>
  )
}
