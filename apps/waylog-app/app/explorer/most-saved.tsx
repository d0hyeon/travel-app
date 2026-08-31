import { useAuth } from '@waylog/domains/clients'
import { Redirect } from 'expo-router'
import { MostSavedScreen } from '../../src/features/explorer/explorer-saved/MostSavedScreen'

export default function MostSavedRoute() {
  const { data: auth } = useAuth({ required: false })
  if (auth == null) return <Redirect href="/login" />
  return <MostSavedScreen />
}
