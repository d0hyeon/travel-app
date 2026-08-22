import { useAuth } from '@waylog/domains/clients'
import { Redirect } from 'expo-router'
import { ExplorerScreen } from '../../src/features/explorer/ExplorerScreen'

export default function MostSavedRoute() {
  const { data: auth } = useAuth({ required: false })
  if (auth == null) return <Redirect href="/login" />
  return <ExplorerScreen mode="most-saved" />
}
