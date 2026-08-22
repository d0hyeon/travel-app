import { Redirect } from 'expo-router'
import { useAuth } from '@waylog/domains/clients'
import { PostFormScreen } from '../../src/features/post/post-form/PostFormScreen'

export default function NewPostRoute() {
  const { data: auth } = useAuth({ required: false })
  if (auth == null) return <Redirect href="/login" />
  return <PostFormScreen />
}
