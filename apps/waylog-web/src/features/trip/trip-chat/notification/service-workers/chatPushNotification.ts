import { generatePath } from 'react-router'
import z from 'zod'
import { AppRoute } from '@waylog/routes'
import { isTripChatPushData } from '@waylog/domains/modules/trip-chat/tripChatPush'

const ChatPushNotificationSchema = z.strictObject({
  title: z.string(),
  body: z.string(),
  tripId: z.string(),
})

export type ChatPushNotification = z.infer<typeof ChatPushNotificationSchema>

export function parseChatPushNotification(payload: unknown): ChatPushNotification | null {
  const parsed = ChatPushNotificationSchema.safeParse(payload)
  return parsed.success ? parsed.data : null
}

export function getChatPushNotificationTripId(data: unknown): string | null {
  if (!isTripChatPushData(data)) return null
  return data.tripId
}

export function getChatPushNotificationDestination(tripId: string) {
  return generatePath(AppRoute.여행_채팅, { tripId })
}
