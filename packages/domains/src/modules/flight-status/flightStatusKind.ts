export const FlightStatusKind = {
  예정: 'scheduled',
  지연: 'delayed',
  결항: 'cancelled',
  회항: 'diverted',
  출발: 'departed',
  도착: 'arrived',
} as const
export type FlightStatusKind = (typeof FlightStatusKind)[keyof typeof FlightStatusKind]
