import { useRouter } from 'expo-router'
import * as Notifications from 'expo-notifications'
import { useEffect } from 'react'
import { getFlightStatusNotificationDestination } from './flightStatusNotification'

export function useFlightStatusNotificationResponse() {
  const router = useRouter()

  useEffect(() => {
    let isMounted = true

    const openTransport = (response: Notifications.NotificationResponse | null) => {
      const destination = getFlightStatusNotificationDestination(response?.notification.request.content.data)
      if (destination == null) return

      router.push(destination)
    }

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (isMounted) openTransport(response)
    })

    const subscription = Notifications.addNotificationResponseReceivedListener(openTransport)

    return () => {
      isMounted = false
      subscription.remove()
    }
  }, [router])
}
