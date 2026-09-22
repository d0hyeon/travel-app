/// <reference lib="webworker" />

import { ChattingNotificationMessageSchema, ChattingNotificationType } from './chatting-notification.types';
import {
  getChatPushNotificationDestination,
  getChatPushNotificationTripId,
  parseChatPushNotification,
} from './chatPushNotification';

declare const self: ServiceWorkerGlobalScope;
const openChatTripIds = new Set<string>()

self.addEventListener('message', (event: ExtendableMessageEvent) => {
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

self.addEventListener('push', (event: PushEvent) => {
  const notification = parseChatPushNotification(event.data?.json());
  if (notification == null) return;
  
  const { title, body, tripId } = notification;
  if (openChatTripIds.has(tripId)) return;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: { tripId },
    })
  )
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  const tripId = getChatPushNotificationTripId(event.notification.data);
  if (tripId == null) return;
  
  event.notification.close();
  const targetUrl = getChatPushNotificationDestination(tripId);

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].navigate(targetUrl)
      }
      return self.clients.openWindow(targetUrl)
    })
  )
})
