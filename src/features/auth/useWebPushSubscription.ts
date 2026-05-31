import { useCallback, use } from "react";
import { useLoading } from "~shared/hooks/useLoading";
import { addPushSubscription } from "./auth.api";
import { useAuth } from "./useAuth";
import { assert } from "~shared/utils/types";

let promise: Promise<ServiceWorkerRegistration | undefined> | null = null;
function getRegistration() {
  if (promise == null) {
    promise = navigator.serviceWorker.getRegistration();
  }
  return promise;
}

let promisedSubscriptions: Promise<PushSubscription | null> | null = null;
function getPushSubscription(registration: ServiceWorkerRegistration | undefined) {
  if (promisedSubscriptions == null) {
    promisedSubscriptions = registration?.pushManager.getSubscription() ?? Promise.resolve(null);
  }
  return promisedSubscriptions;
}


export function useWebPushSubscription() {
  const { data: currentUser } = useAuth();
  const [isLoading, startTransition] = useLoading();

  const registration = use(getRegistration());
  const isEnabled = registration != null;

  const existingSubscription = isEnabled ? use(getPushSubscription(registration)) : undefined;
  const isSubscribed = !!existingSubscription;

  const hasPermission = Notification.permission === 'granted';

  const requestPermission = useCallback(async () => {
    if (hasPermission) return true;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }, [hasPermission])

  const subscribe = useCallback(() => {
    assert(!isSubscribed, 'Already subscribed to push notifications');
    assert(registration != null, 'Service worker registration is required to subscribe to push notifications');
    
    startTransition(async () => {
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
      
      try {
        const newSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey,
        });

        await addPushSubscription(currentUser.id, newSubscription);
        console.log('Subscribed to push notifications:', newSubscription);
      } catch (error) {
        console.error('Failed to subscribe to push notifications:', error);
      }
    })
  }, [currentUser])
  
  return { subscribe, isSubscribed, requestPermission, hasPermission, isLoading, isEnabled };
}   

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
} 