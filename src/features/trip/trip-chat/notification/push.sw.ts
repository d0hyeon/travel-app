/// <reference lib="webworker" />

import { generatePath } from 'react-router';
import { AppRoute } from '~app/routes';
import { ChattingNotificationMessageSchema, ChattingNotificationType } from './chatting-notification.types';
import z, { type ZodSchema } from 'zod';

const sw = self as unknown as ServiceWorkerGlobalScope

const openChatTripIds = new Set<string>()

sw.addEventListener('message', (event: ExtendableMessageEvent) => {
  const { success, data } = ChattingNotificationMessageSchema.safeParse(event.data);
  if (!success) return;

  const { type, tripId } = data;

  switch (type) {
    case ChattingNotificationType.open: {
      return openChatTripIds.add(tripId);
    }
    case ChattingNotificationType.close: {
      return openChatTripIds.delete(tripId);
    }
  }
})

type ChatPushEventPayload = {
  title: string;
  body: string;
  tripId: string;
}
const ChatPushEventDataSchema = z.object({
  title: z.string(),
  body: z.string(),
  tripId: z.string()
}) satisfies ZodSchema<ChatPushEventPayload>;

sw.addEventListener('push', (event: PushEvent) => {
  const parsed = ChatPushEventDataSchema.safeParse(event.data?.json());
  if (!parsed.success) return;
  
  const { title, body, tripId } = parsed.data;
  if (openChatTripIds.has(tripId)) return;

  event.waitUntil(
    sw.registration.showNotification(title, {
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: { tripId } satisfies ChatNotificationPayload,
    })
  )
})

type ChatNotificationPayload = {
  tripId: string;
} 
const ChatNotificationPayloadSchema = z.object({
  tripId: z.string()
}) satisfies ZodSchema<ChatNotificationPayload>


sw.addEventListener('notificationclick', (event: NotificationEvent) => {
  const parsed = ChatNotificationPayloadSchema.safeParse(event.notification.data);
  if (!parsed.success) return;
  
  event.notification.close();
  const { tripId } = parsed.data;
  const targetUrl = generatePath(AppRoute.여행_채팅, { tripId });

  event.waitUntil(
    sw.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].navigate(targetUrl)
      }
      return sw.clients.openWindow(targetUrl)
    })
  )
})

