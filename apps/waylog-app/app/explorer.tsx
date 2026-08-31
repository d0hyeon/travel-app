import { useAuth } from '@waylog/domains/clients'
import { Redirect } from 'expo-router'
import { ExplorerCatalogScreen } from '../src/features/explorer/ExplorerCatalogScreen'

export default function ExplorerRoute() {
  const { data: auth } = useAuth({ required: false })
  if (auth == null) return <Redirect href="/login" />
  return <ExplorerCatalogScreen />
}
