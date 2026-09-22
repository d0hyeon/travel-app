import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { isTripChatPushData } from '@waylog/domains/modules/trip-chat/tripChatPush'

/**
 * 알림을 탭했을 때 해당 채팅방으로 보낸다.
 *
 * 앱이 꺼져 있다 알림으로 켜진 경우도 같은 경로로 다룬다 —
 * getLastNotificationResponseAsync 가 그 응답을 들고 있다.
 */
export function useChatNotificationResponse() {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const openTrip = (response: Notifications.NotificationResponse | null) => {
      const tripMessage = response?.notification.request.content.data
      if (!isTripChatPushData(tripMessage)) return

      router.push(`/trip/${tripMessage.tripId}`);
    };

    // 알림으로 앱이 켜진 경우
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (isMounted) openTrip(response);
    });

    // 앱이 떠 있는 동안 탭한 경우
    const subscription =
      Notifications.addNotificationResponseReceivedListener(openTrip);

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [router]);
}
