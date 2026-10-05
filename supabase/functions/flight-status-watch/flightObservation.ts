export interface FlightObservation {
  kind: string
  scheduledAt: string | null
  estimatedAt: string | null
  gate: string | null
  terminal: string | null
  arrivalScheduledAt: string | null
  arrivalEstimatedAt: string | null
}
