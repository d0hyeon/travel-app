import { use, useCallback, useEffect, useMemo } from "react";
import { useSuspenseQuery } from "@waylog/react";
import { assert } from "@waylog/domains/utils";
import { addPushSubscription, findPushSubscription, removePushSubscription } from "./auth.api";
import { useAuth } from "./useAuth";

let promise: Promise<ServiceWorkerRegistration | undefined> | null = null;
function getSWRegistration() {
  if (navigator?.serviceWorker?.getRegistration == null) {
    return Promise.resolve(null);
  }
  if (promise == null) {
    promise = navigator.serviceWorker.getRegistration();
  }
  return promise;
}

let promisedBrowserSubscription: Promise<PushSubscription | null> | null = null;
function restoreLocalSubscription(registration: ServiceWorkerRegistration | undefined, vapidKey: Uint8Array) {
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
const vapidKey = urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY);

export function useWebPushSubscription() {
  const { data: currentUser } = useAuth();

  const registration = use(getSWRegistration());
  const isEnabled = registration != null && registration.pushManager != null;
  const localSubscription = isEnabled ? use(restoreLocalSubscription(registration, vapidKey)) : undefined;

  const { data: registeredSubscription, refetch } = useSuspenseQuery({
    queryKey: pushSubscriptionKey(currentUser.id, localSubscription?.endpoint),
    queryFn: () => {
      if (localSubscription == null) return null;
      return findPushSubscription(currentUser.id, localSubscription.endpoint);
    },
  });

  const isSubscribed = registeredSubscription != null;
  const hasStaleLocalSubscription = localSubscription != null && registeredSubscription == null;

  useEffect(() => {
    if (hasStaleLocalSubscription) {
      localSubscription.unsubscribe();
    }
  }, [hasStaleLocalSubscription, localSubscription])

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
    assert(localSubscription != null, 'Local subscription is required to unsubscribe');
    await removePushSubscription(currentUser.id, localSubscription.endpoint);
    await refetch();
  }, [currentUser, localSubscription, isSubscribed, refetch]);

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
