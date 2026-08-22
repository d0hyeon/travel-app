import { useAuth } from '@waylog/domains/clients'
import { Redirect, useLocalSearchParams } from 'expo-router'
import { PlaceDetailScreen } from '../../src/features/explorer/PlaceDetailScreen'

export default function ExplorerPlaceDetailRoute() {
  const { data: auth } = useAuth({ required: false })
  const { placeId: rawPlaceId } = useLocalSearchParams<{ placeId?: string | string[] }>()
  const placeId = Array.isArray(rawPlaceId) ? rawPlaceId[0] : rawPlaceId

  if (auth == null) return <Redirect href="/login" />
  if (placeId == null || placeId === '') return <Redirect href="/explorer" />

  return <PlaceDetailScreen placeId={placeId} />
}
