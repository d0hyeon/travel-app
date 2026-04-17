import { useEffect, useState } from 'react'
import type { Coordinate } from '~shared/model/coordinate.model'

interface Options {
  enabled?: boolean;
  once?: boolean
}
export function useCurrentLocation({ enabled = true, once = false }: Options = {}): Coordinate | null {
  const [location, setLocation] = useState<Coordinate | null>(null)

  useEffect(() => {
    if (!enabled || !navigator.geolocation) return
    if (once) {
      return navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => { /* 권한 거부 시 null 유지 */ },
        { enableHighAccuracy: true }
      );
    }

    const subscriptionId = navigator.geolocation.watchPosition((pos) => {
      setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
    })

    return () => navigator.geolocation.clearWatch(subscriptionId);
  }, [enabled, once])

  return location
}
