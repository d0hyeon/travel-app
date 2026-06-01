import { use, useCallback, useEffect, useMemo } from "react";
import { useSuspenseQuery } from "~shared/hooks/extends/useSuspenseQuery";
import { assert } from "~shared/utils/types";
import { addPushSubscription, getPushSubscriptionEndpoint, removePushSubscription } from "./auth.api";
import { useAuth } from "./useAuth";

let promise: Promise<ServiceWorkerRegistration | undefined> | null = null;
function getRegistration() {
  if (promise == null) {
    promise = navigator.serviceWorker.getRegistration();
  }
  return promise;
}

let promisedBrowserSubscription: Promise<PushSubscription | null> | null = null;
function getLocalSubscription(registration: ServiceWorkerRegistration | undefined, vapidKey: Uint8Array) {
  if (promisedBrowserSubscription == null) {
    promisedBrowserSubscription = (async () => {
      if (!registration?.pushManager) return null;
      const existing = await registration.pushManager.getSubscription();
      if (existing) return existing;
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return null;
      // SW 업데이트로 구독이 사라진 경우 자동 재구독
      return registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: vapidKey.buffer as ArrayBuffer });
    })();
  }
  return promisedBrowserSubscription;
}

const pushSubscriptionKey = (userId: string, endpoint: string | undefined) => ['push_subscriptions', userId, endpoint];

export function useWebPushSubscription() {
  const { data: currentUser } = useAuth();

  const registration = use(getRegistration());
  const isEnabled = registration != null && registration.pushManager != null;

  const vapidKey = urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY);
  const localSubscription = isEnabled ? use(getLocalSubscription(registration, vapidKey)) : undefined;

  const { data: subscriptionEndpoint, refetch } = useSuspenseQuery({
    queryKey: pushSubscriptionKey(currentUser.id, localSubscription?.endpoint),
    queryFn: () => {
      if (localSubscription == null) return null;
      return getPushSubscriptionEndpoint(currentUser.id, localSubscription.endpoint);
    },
  });

  const isSubscribed = subscriptionEndpoint != null;

  useEffect(() => {
    if (!isSubscribed && localSubscription != null) {
      localSubscription.unsubscribe();
    }
  }, [isSubscribed])

  const subscribe = useCallback(async () => {
    assert(isEnabled, 'Service worker registration is required to subscribe to push notifications');
    const newSubscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidKey.buffer
    });

    await addPushSubscription(currentUser.id, newSubscription);
    promisedBrowserSubscription = null;
    await refetch();
  }, [currentUser, registration]);

  const unsubscribe = useCallback(async () => {
    assert(isSubscribed, 'Not subscribed to push notifications');
    await removePushSubscription(currentUser.id, subscriptionEndpoint);
    await refetch();
  }, [currentUser, subscriptionEndpoint]);

  const hasPermission = typeof Notification !== 'undefined' && Notification.permission === 'granted';
  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return false;
    if (hasPermission) return true;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }, [hasPermission]);

  return useMemo(() => ({
    isEnabled,
    isSubscribed,
    subscribe,
    unsubscribe,
    hasPermission,
    requestPermission,
  }), [isSubscribed, subscribe, unsubscribe, hasPermission, requestPermission, isEnabled]);
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}
