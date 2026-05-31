/// <reference lib="webworker" />

import { ChattingNotificationEvent } from './chatting-notification.types'
import type { ChattingNotificationMessage } from './chatting-notification.types'

const sw = self as unknown as ServiceWorkerGlobalScope

const openChatTripIds = new Set<string>()

sw.addEventListener('message', (event: ExtendableMessageEvent) => {
  const { type, tripId } = (event.data ?? {}) as ChattingNotificationMessage
  if (type === ChattingNotificationEvent.open) openChatTripIds.add(tripId)
  if (type === ChattingNotificationEvent.close) openChatTripIds.delete(tripId)
})

sw.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return

  const { title, body, tripId } = event.data.json() as { title: string; body: string; tripId?: string }

  if (tripId && openChatTripIds.has(tripId)) return

  event.waitUntil(
    sw.registration.showNotification(title, {
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: { tripId },
    })
  )
})

sw.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const tripId = (event.notification.data as { tripId?: string })?.tripId
  const targetUrl = tripId ? `/trip/${tripId}/chat` : '/'

  event.waitUntil(
    sw.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].navigate(targetUrl)
      }
      return sw.clients.openWindow(targetUrl)
    })
  )
})
