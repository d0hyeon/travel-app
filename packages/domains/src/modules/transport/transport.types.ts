import { reverseKeyValue } from '../../utils'
import type { ValueOf } from '../../utils'

export const TransportType = {
  도보: 'walk',
  차량: 'car',
  항공: 'flight',
  기차: 'train',
  버스: 'bus'
} as const
export type TransportType = ValueOf<typeof TransportType>
export const TransportTypeLabel = reverseKeyValue(TransportType)
