import { useAuth } from '@waylog/domains/clients'
import { Redirect } from 'expo-router'
import { TopVisitedScreen } from '../../src/features/explorer/explorer-ranking/TopVisitedScreen'

export default function TopVisitedRoute() {
  const { data: auth } = useAuth({ required: false })
  if (auth == null) return <Redirect href="/login" />
  return <TopVisitedScreen />
}
