import { assert } from '@waylog/utility'
import { useLocalSearchParams } from 'expo-router'

export function useTransportId() {
  const { transportId } = useLocalSearchParams<{
    transportId?: string | string[]
  }>()
  assert(typeof transportId === 'string', '[useTransportId] 잘못된 접근입니다.')

  return transportId
}
