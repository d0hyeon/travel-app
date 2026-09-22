export function getFlightStatusNotificationDestination(data: unknown): string | null {
  if (!hasExactStringFields(data, ['tripId', 'transportId'])) return null
  return `/trip/${data.tripId}/transport/${data.transportId}`
}

function hasExactStringFields(data: unknown, fieldNames: readonly string[]): data is Record<string, string> {
  if (data == null || typeof data !== 'object') return false

  const fields = Object.entries(data)
  return fields.length === fieldNames.length
    && fields.every(([fieldName, value]) => fieldNames.includes(fieldName) && typeof value === 'string')
}
