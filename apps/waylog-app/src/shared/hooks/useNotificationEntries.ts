import * as Notifications from "expo-notifications";
import { useEffect, useEffectEvent, useRef } from "react";

export type TypedNotification<Data> = Notifications.Notification & {
  request: {
    content: Omit<Notifications.NotificationContent, "data"> & { data: Data };
  };
};

type IsPrevented = (notification: Notifications.Notification) => boolean;

let preventRules: IsPrevented[] = [];

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const isAllowed = !preventRules.some((isPrevented) =>
      isPrevented(notification),
    );

    return {
      shouldShowBanner: isAllowed,
      shouldShowList: isAllowed,
      shouldPlaySound: isAllowed,
      shouldSetBadge: false,
    };
  },
});

interface Options<Data> {
  prevented: (
    notification: Notifications.Notification,
  ) => notification is TypedNotification<Data>;
  onPrevent?: (notification: TypedNotification<Data>) => void;
}

export function usePreventNotification<Data>({
  prevented,
  onPrevent,
}: Options<Data>) {
  const checkPrevented = useEffectEvent(prevented);
  const handlePrevent = useEffectEvent(
    (notification: Notifications.Notification) => {
      if (prevented(notification)) onPrevent?.(notification);
    },
  );

  useEffect(() => {
    const isPrevented: IsPrevented = (notification) => checkPrevented(notification);
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        handlePrevent(notification);
      },
    );
    preventRules = [...preventRules, isPrevented];

    return () => {
      subscription.remove();
      preventRules = preventRules.filter((rule) => rule !== isPrevented);
    };
  }, []);
}

type Callback = (response: Notifications.NotificationResponse) => void;

export function useNotificationPressListener(callback: Callback) {
  const isUnmountedRef = useRef(false);

  const handleCallback = useEffectEvent(
    (response: Notifications.NotificationResponse | null) => {
      if (response && !isUnmountedRef.current) callback(response);
    },
  );
  useEffect(() => {
    isUnmountedRef.current = false;

    // 알림으로 앱이 켜진 경우
    void Notifications.getLastNotificationResponseAsync().then(handleCallback);

    // 앱이 떠 있는 동안 탭한 경우
    const subscription =
      Notifications.addNotificationResponseReceivedListener(handleCallback);

    return () => {
      isUnmountedRef.current = true;
      subscription.remove();
    };
  }, []);
}
