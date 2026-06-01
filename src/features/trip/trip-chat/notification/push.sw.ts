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

sw.addEventListener('push', (event: PushEvent) => {
  if (!isChatPushEvent(event)) return;
  const { title, body, tripId } = event.data.json();

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

sw.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  if (!isChatNotificationEvent(event)) {
    return;
  }

  const tripId = event.notification.data.tripId;
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

const ChatPushEventDataSchema = z.object({
  title: z.string(),
  body: z.string(),
  tripId: z.string()
}) satisfies ZodSchema<ChatPushEventPayload>;

type ChatPushEvent = Omit<PushEvent, 'data'> & {
  data: Omit<PushMessageData, 'json'> & { json: () => ChatPushEventPayload }
}
function isChatPushEvent(event: PushEvent): event is ChatPushEvent {
  if (event.data == null) {
    return false;
  }
  
  const { success } = ChatPushEventDataSchema.safeParse(event.data.json())
  return success;
}

const ChatNotificationPayloadSchema = z.object({
  tripId: z.string()
}) satisfies ZodSchema<ChatNotificationPayload>

type ChatNotificationEvent = Omit<NotificationEvent, 'notification'> & {
  notification: Omit<Notification, 'data'> & {
    data: ChatNotificationPayload;
  }
}

function isChatNotificationEvent(event: NotificationEvent): event is ChatNotificationEvent {
  const { success } = ChatNotificationPayloadSchema.safeParse(event.notification.data);

  return success;
}

