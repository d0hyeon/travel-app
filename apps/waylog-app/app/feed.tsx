import { AuthGuard } from '@waylog/domains/clients'
import { FeedScreen } from '../src/features/post/FeedScreen'
import { LoginRedirect } from '../src/features/auth/auth-redirect'

export default function FeedRoute() {
  return (
    <AuthGuard fallback={<LoginRedirect />}>
      <FeedScreen />
    </AuthGuard>
  )
}
