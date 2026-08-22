import { getActivedChatTripId } from '@waylog/domains/modules/trip-chat'
import { useRouter } from 'expo-router'
import * as Notifications from 'expo-notifications'
import { useEffect } from 'react'

// 웹 push.sw.ts 와 같은 판단을 한다.
// 이미 그 채팅방을 보고 있으면 알림을 띄우지 않고, 탭하면 그 방을 연다.
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const tripId = toTripId(notification.request.content.data)
    const isInChat = tripId != null && getActivedChatTripId() === tripId

    return {
      shouldShowBanner: !isInChat,
      shouldShowList: !isInChat,
      shouldPlaySound: !isInChat,
      shouldSetBadge: false,
    }
  },
})

/**
 * 알림을 탭했을 때 해당 채팅방으로 보낸다.
 *
 * 앱이 꺼져 있다 알림으로 켜진 경우도 같은 경로로 다룬다 —
 * getLastNotificationResponseAsync 가 그 응답을 들고 있다.
 */
export function useChatNotificationResponse() {
  const router = useRouter()

  useEffect(() => {
    let isMounted = true

    const openTrip = (response: Notifications.NotificationResponse | null) => {
      const tripId = toTripId(response?.notification.request.content.data)
      if (tripId == null) return

      router.push(`/trip/${tripId}`)
    }

    // 알림으로 앱이 켜진 경우
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (isMounted) openTrip(response)
    })

    // 앱이 떠 있는 동안 탭한 경우
    const subscription = Notifications.addNotificationResponseReceivedListener(openTrip)

    return () => {
      isMounted = false
      subscription.remove()
    }
  }, [router])
}

function toTripId(data: unknown): string | null {
  if (data == null || typeof data !== 'object') return null

  const { tripId } = data as { tripId?: unknown }
  return typeof tripId === 'string' ? tripId : null
}
