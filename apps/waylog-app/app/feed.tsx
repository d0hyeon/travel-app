import { useAuth } from '@waylog/domains/clients'
import { Redirect } from 'expo-router'
import { FeedScreen } from '../src/features/post/FeedScreen'

export default function FeedRoute() {
  const { data: auth } = useAuth({ required: false })

  if (auth == null) return <Redirect href="/login" />

  return <FeedScreen />
}
