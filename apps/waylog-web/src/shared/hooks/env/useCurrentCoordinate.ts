import { useEffectEvent, useState } from 'react';
import type { Coordinate } from '@waylog/domains/utils';
import { useAsyncEffect } from '@waylog/react';

let permissionPromise: Promise<boolean> | null = null;
const getPermission = () => {
  if (permissionPromise) return permissionPromise;

  permissionPromise = navigator.permissions
    .query({ name: 'geolocation' })
    .then((status) => status.state !== 'denied');

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
        // eslint-disable-next-line react-hooks/rules-of-hooks
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
      // eslint-disable-next-line react-hooks/rules-of-hooks
      handleError,
      { enableHighAccuracy: true }
    )

    return () => navigator.geolocation.clearWatch(subscriptionId);
  }, [enabled, once])

  return location
}
