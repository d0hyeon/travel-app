import { AuthGuard } from '@waylog/domains/clients'
import { Redirect } from 'expo-router'
import { PostCreationScreen } from '../../src/features/post/PostCreationScreen'

export default function NewPostRoute() {
  return (
    <AuthGuard fallback={<Redirect href="/login" />}>
      <PostCreationScreen />
    </AuthGuard>
  )
}
