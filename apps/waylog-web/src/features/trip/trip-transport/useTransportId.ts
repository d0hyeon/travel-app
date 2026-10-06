import { assert } from '@waylog/utility'
import { useParams } from 'react-router'

export function useTransportId() {
  const { transportId } = useParams<{ transportId: string }>()
  assert(!!transportId, '[useTransportId] 잘못된 접근입니다.')

  return transportId
}
