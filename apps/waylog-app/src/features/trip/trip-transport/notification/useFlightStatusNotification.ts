import * as Notifications from 'expo-notifications'
import { useEffect } from 'react'
import { useAppNavigation } from '../../../../shared/hooks/useAppNavigation'
import { getFlightStatusNotificationDestination } from './flightStatusNotification'

export function useFlightStatusNotificationResponse() {
  const navigation = useAppNavigation()

  useEffect(() => {
    let isMounted = true

    const openTransport = (response: Notifications.NotificationResponse | null) => {
      const destination = getFlightStatusNotificationDestination(response?.notification.request.content.data)
      if (destination == null) return

      navigation.navigate('TransportDetail', destination)
    }

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (isMounted) openTransport(response)
    })

    const subscription = Notifications.addNotificationResponseReceivedListener(openTransport)

    return () => {
      isMounted = false
      subscription.remove()
    }
  }, [navigation])
}
