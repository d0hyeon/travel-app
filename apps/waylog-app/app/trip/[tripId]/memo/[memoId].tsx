import { useLocalSearchParams } from 'expo-router'
import { TripMemoEditScreen } from '../../../../src/features/trip/trip-memo/TripMemoEditScreen'

export default function TripMemoEditRoute() {
  const { tripId, memoId } = useLocalSearchParams<{ tripId: string; memoId: string }>()

  // 'new' 는 신규 작성이다. 기존 메모 id 가 아니다.
  return <TripMemoEditScreen tripId={tripId} memoId={memoId === 'new' ? undefined : memoId} />
}
