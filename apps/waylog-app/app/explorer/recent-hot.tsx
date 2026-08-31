import { useAuth } from '@waylog/domains/clients'
import { Redirect } from 'expo-router'
import { RecentHotScreen } from '../../src/features/explorer/explorer-recent/RecentHotScreen'

export default function RecentHotRoute() {
  const { data: auth } = useAuth({ required: false })
  if (auth == null) return <Redirect href="/login" />
  return <RecentHotScreen />
}
