import { use, useCallback, useMemo, useState } from "react";
import { assert } from "~shared/utils/types";
import { addPushSubscription, removePushSubscription } from "./auth.api";
import { useAuth } from "./useAuth";

let promise: Promise<ServiceWorkerRegistration | undefined> | null = null;
function getRegistration() {
  if (promise == null) {
    promise = navigator.serviceWorker.getRegistration();
  }
  return promise;
}

const UNSUBSCRIBED_ENDPOINTS_KEY = 'push_unsubscribed_endpoints';

function getUnsubscribedEndpoints(): Set<string> {
  try {
    const stored = localStorage.getItem(UNSUBSCRIBED_ENDPOINTS_KEY);
    return new Set(stored ? JSON.parse(stored) : []);
  } catch {
    return new Set();
  }
}

function markEndpointUnsubscribed(endpoint: string) {
  const endpoints = getUnsubscribedEndpoints();
  endpoints.add(endpoint);
  localStorage.setItem(UNSUBSCRIBED_ENDPOINTS_KEY, JSON.stringify([...endpoints]));
}

function clearEndpointUnsubscribed(endpoint: string) {
  const endpoints = getUnsubscribedEndpoints();
  endpoints.delete(endpoint);
  localStorage.setItem(UNSUBSCRIBED_ENDPOINTS_KEY, JSON.stringify([...endpoints]));
}

let promisedBrowserSubscription: Promise<PushSubscription | null> | null = null;
function getPushSubscription(registration: ServiceWorkerRegistration | undefined, vapidKey: Uint8Array) {
  if (promisedBrowserSubscription == null) {
    promisedBrowserSubscription = (async () => {
      if (!registration) return null;
      const existing = await registration.pushManager.getSubscription();
      if (existing) return existing;
      if (Notification.permission !== 'granted') return null;
      // SW 업데이트로 구독이 사라진 경우 자동 재구독 (명시적으로 해제한 endpoint는 제외)
      const newSubscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: vapidKey.buffer as ArrayBuffer });
      if (getUnsubscribedEndpoints().has(newSubscription.endpoint)) {
        await newSubscription.unsubscribe();
        return null;
      }
      return newSubscription;
    })();
  }
  return promisedBrowserSubscription;
}

export function useWebPushSubscription() {
  const { data: currentUser } = useAuth();

  const registration = use(getRegistration());
  const isEnabled = registration != null;

  const vapidKey = urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY);
  const existingSubscription = isEnabled ? use(getPushSubscription(registration, vapidKey)) : undefined;
  const [isSubscribed, setIsSubscribed] = useState(!!existingSubscription);

  const hasPermission = Notification.permission === 'granted';

  const requestPermission = useCallback(async () => {
    if (hasPermission) return true;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }, [hasPermission])

  const subscribe = useCallback(async () => {
    assert(registration != null, 'Service worker registration is required to subscribe to push notifications');

    try {
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey.buffer as ArrayBuffer,
      });
      

      await addPushSubscription(currentUser.id, newSubscription);
      clearEndpointUnsubscribed(newSubscription.endpoint);
      promisedBrowserSubscription = null;
      setIsSubscribed(true);
    } catch (error) {
      alert('구독에 실패' + JSON.stringify(error));
      console.error('Failed to subscribe to push notifications:', error);
    }
  }, [currentUser, registration]);

  const unsubscribe = useCallback(async () => {
    assert(isSubscribed, 'Not subscribed to push notifications');
    assert(registration != null, 'Service worker registration is required');

    try {
      const subscription = await registration.pushManager.getSubscription();
      console.log('[WebPush] subscription:', subscription);
      const result = await subscription?.unsubscribe();
      console.log('[WebPush] unsubscribe result:', result);
      if (subscription) markEndpointUnsubscribed(subscription.endpoint);
      promisedBrowserSubscription = null;
      await removePushSubscription(currentUser.id);
      setIsSubscribed(false);
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
    }
  }, [currentUser, isSubscribed, registration])

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
