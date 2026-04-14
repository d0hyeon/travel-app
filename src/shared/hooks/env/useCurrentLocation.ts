import { useEffect, useState } from 'react'
import type { Coordinate } from '~shared/model/coordinate.model'

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
