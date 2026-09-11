import { AuthGuard } from '@waylog/domains/clients'
import { PostCreationScreen } from '../../src/features/post/PostCreationScreen'
import { LoginRedirect } from '../../src/features/auth/auth-redirect'

export default function NewPostRoute() {
  return (
    <AuthGuard fallback={<LoginRedirect />}>
      <PostCreationScreen />
    </AuthGuard>
  )
}
