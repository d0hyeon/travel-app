import { AuthGuard } from '@waylog/domains/clients'
import { Redirect } from 'expo-router'
import { FeedScreen } from '../src/features/post/FeedScreen'

export default function FeedRoute() {
  return (
    <AuthGuard fallback={<Redirect href="/login" />}>
      <FeedScreen />
    </AuthGuard>
  )
}
