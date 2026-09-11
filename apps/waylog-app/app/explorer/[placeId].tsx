import { AuthGuard } from '@waylog/domains/clients'
import { Redirect, useLocalSearchParams } from 'expo-router'
import { PlaceDetailScreen } from '../../src/features/explorer/PlaceDetailScreen'
import { LoginRedirect } from '../../src/features/auth/auth-redirect'

export default function ExplorerPlaceDetailRoute() {
  const { placeId: rawPlaceId } = useLocalSearchParams<{ placeId?: string | string[] }>()
  const placeId = Array.isArray(rawPlaceId) ? rawPlaceId[0] : rawPlaceId

  if (placeId == null || placeId === '') return <Redirect href="/explorer" />

  return (
    <AuthGuard fallback={<LoginRedirect />}>
      <PlaceDetailScreen placeId={placeId} />
    </AuthGuard>
  )
}
