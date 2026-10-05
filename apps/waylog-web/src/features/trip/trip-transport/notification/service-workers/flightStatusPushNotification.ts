import { generatePath } from 'react-router'
import z from 'zod'
import { AppRoute } from '@waylog/routes'

const FlightStatusPushNotificationSchema = z.strictObject({
  title: z.string(),
  body: z.string(),
  tripId: z.string(),
  transportId: z.string(),
})

const FlightStatusPushNotificationDataSchema = z.strictObject({
  tripId: z.string(),
  transportId: z.string(),
})

export type FlightStatusPushNotification = z.infer<typeof FlightStatusPushNotificationSchema>

export function parseFlightStatusPushNotification(payload: unknown): FlightStatusPushNotification | null {
  const parsed = FlightStatusPushNotificationSchema.safeParse(payload)
  return parsed.success ? parsed.data : null
}

export function getFlightStatusPushNotificationDestination(data: unknown): string | null {
  const parsed = FlightStatusPushNotificationDataSchema.safeParse(data)
  if (!parsed.success) return null

  return getFlightStatusPushDestination(parsed.data)
}

export function getFlightStatusPushDestination({
  tripId,
  transportId,
}: Pick<FlightStatusPushNotification, 'tripId' | 'transportId'>) {
  return generatePath(AppRoute.여행_교통편_상세, { tripId, transportId })
}
