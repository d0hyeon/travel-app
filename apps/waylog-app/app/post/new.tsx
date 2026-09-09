import { Redirect } from 'expo-router'
import { useAuth } from '@waylog/domains/clients'
import { PostCreationScreen } from '../../src/features/post/PostCreationScreen'

export default function NewPostRoute() {
  const { data: auth } = useAuth({ required: false })
  if (auth == null) return <Redirect href="/login" />
  return <PostCreationScreen />
}
