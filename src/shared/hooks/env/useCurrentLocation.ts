import { useState } from 'react';
import type { Coordinate } from '~shared/model/coordinate.model';
import { useAsyncEffect } from '../extends/useAsyncEffect';

interface Options {
  enabled?: boolean;
  once?: boolean;
  onChange?: (value: Coordinate) => void;
}

let permissionPromise: Promise<boolean> | null = null;

const getPermission = () => {
  if (permissionPromise) return permissionPromise;
  
  permissionPromise =  new Promise<boolean>(async (resolve) => {
    const status = await navigator.permissions.query({ name: 'geolocation' })
    
    if (status.state === 'prompt') {
      status.addEventListener('change', async () => {
        resolve(await getPermission());
      })
    }
    resolve(status.state === 'granted')
  })

  return permissionPromise;
}
export function useCurrentLocation({ enabled = true, once = false, onChange }: Options = {}): Coordinate | null {
  const [location, setLocation] = useState<Coordinate | null>(null)

       
  useAsyncEffect(async () => {
    const hasPermission = await getPermission()
    if (!enabled || !navigator.geolocation || !hasPermission) return;
    
    if (once) {
      return navigator.geolocation.getCurrentPosition(
        (pos) => {
          const value = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          setLocation(value)
          onChange?.(value);
        },
        () => { /* 권한 거부 시 null 유지 */ },
        { enableHighAccuracy: true }
      );
    }

    const subscriptionId = navigator.geolocation.watchPosition((pos) => {
      const value = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      setLocation(value)
      onChange?.(value);
    })

    return () => navigator.geolocation.clearWatch(subscriptionId);
  }, [ enabled, once])

  return location
}
