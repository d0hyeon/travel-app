import { AuthGuard } from '@waylog/domains/clients'
import { Redirect, useLocalSearchParams } from 'expo-router'
import { PlaceDetailScreen } from '../../src/features/explorer/PlaceDetailScreen'

export default function ExplorerPlaceDetailRoute() {
  const { placeId: rawPlaceId } = useLocalSearchParams<{ placeId?: string | string[] }>()
  const placeId = Array.isArray(rawPlaceId) ? rawPlaceId[0] : rawPlaceId

  if (placeId == null || placeId === '') return <Redirect href="/explorer" />

  return (
    <AuthGuard fallback={<Redirect href="/login" />}>
      <PlaceDetailScreen placeId={placeId} />
    </AuthGuard>
  )
}
