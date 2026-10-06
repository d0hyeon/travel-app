export interface TripChatPushData {
  tripId: string
}

export function isTripChatPushData(value: unknown): value is TripChatPushData {
  if (value == null || typeof value !== 'object') return false

  const fields = Object.entries(value)
  return fields.length === 1 && fields[0][0] === 'tripId' && typeof fields[0][1] === 'string'
}
