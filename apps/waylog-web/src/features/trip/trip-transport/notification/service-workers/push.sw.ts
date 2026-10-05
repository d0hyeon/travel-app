/// <reference lib="webworker" />

import {
  getFlightStatusPushNotificationDestination,
  parseFlightStatusPushNotification,
} from './flightStatusPushNotification'

declare const self: ServiceWorkerGlobalScope

self.addEventListener('push', (event: PushEvent) => {
  const notification = parseFlightStatusPushNotification(event.data?.json())
  if (notification == null) return

  event.waitUntil(
    self.registration.showNotification(notification.title, {
      body: notification.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: { tripId: notification.tripId, transportId: notification.transportId },
    }),
  )
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  const targetUrl = getFlightStatusPushNotificationDestination(event.notification.data)
  if (targetUrl == null) return

  event.notification.close()
  event.waitUntil(openNotificationDestination(targetUrl))
})

function openNotificationDestination(targetUrl: string) {
  return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
    if (clientList.length > 0) return clientList[0].navigate(targetUrl)
    return self.clients.openWindow(targetUrl)
  })
}
