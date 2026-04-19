import { useEffectEvent, useState } from 'react';
import type { Coordinate } from '~shared/model/coordinate.model';
import { useAsyncEffect } from '../extends/useAsyncEffect';

let permissionPromise: Promise<boolean> | null = null;
const getPermission = () => {
  if (permissionPromise) return permissionPromise;
  
  permissionPromise = new Promise<boolean>(async (resolve) => {
    const status = await navigator.permissions.query({ name: 'geolocation' })
    
    if (status.state === 'prompt') {
      status.addEventListener('change', async () => {
        resolve(status.state === 'granted');
      })
    }
    resolve(status.state === 'granted')
  })

  return permissionPromise;
}

interface Options {
  enabled?: boolean;
  once?: boolean;
  onChange?: (value: Coordinate) => void;
  onRejectPermission?: () => void;
  onError?: (error: Omit<GeolocationPositionError, 'PERMISSION_DENIED'>) => void;
}

export function useCurrentCoordinate({
  enabled = true,
  once = false,
  onChange,
  onError,
  onRejectPermission
}: Options = {}): Coordinate | null {
  const [location, setLocation] = useState<Coordinate | null>(null)

  const handleError = useEffectEvent((error: GeolocationPositionError) => {
    if (error.code === error.PERMISSION_DENIED) {
      onRejectPermission?.()
    } else {
      onError?.(error);
    }
  })
       
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
        handleError,
        { enableHighAccuracy: true }
      );
    }

    const subscriptionId = navigator.geolocation.watchPosition(
      (pos) => {
        const value = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setLocation(value)
        onChange?.(value);
      },
      handleError,
      { enableHighAccuracy: true }
    )

    return () => navigator.geolocation.clearWatch(subscriptionId);
  }, [enabled, once])

  return location
}
