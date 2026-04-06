import { useEffect, useState } from 'react'
import type { Coordinate } from '~shared/components/Map'

export function useCurrentLocation(): Coordinate | null {
  const [location, setLocation] = useState<Coordinate | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => { /* 권한 거부 시 null 유지 */ },
      { enableHighAccuracy: true }
    )
  }, [])

  return location
}
