import type { Coordinate } from '@waylog/domains/utils'
import * as Location from 'expo-location'
import { useEffect, useState } from 'react'

interface Options {
  enabled?: boolean
  onChange?: (value: Coordinate) => void
  onRejectPermission?: () => void
}

// 웹 useCurrentCoordinate 와 같은 시그니처를 유지한다.
// navigator.geolocation 대신 expo-location 을 쓴다.
export function useCurrentCoordinate({ enabled = true, onChange, onRejectPermission }: Options = {}) {
  const [coordinate, setCoordinate] = useState<Coordinate | null>(null)

  useEffect(() => {
    if (!enabled) return

    let cancelled = false

    void (async () => {
      // 권한 대화상자가 떠 있는 동안 화면을 떠날 수 있다.
      // 떠난 뒤에는 상태도 콜백도 건드리지 않는다.
      const permission = await Location.requestForegroundPermissionsAsync()
      if (cancelled) return

      if (!permission.granted) {
        onRejectPermission?.()
        return
      }

      const position = await Location.getCurrentPositionAsync({})
      if (cancelled) return

      const next = { lat: position.coords.latitude, lng: position.coords.longitude }
      setCoordinate(next)
      onChange?.(next)
    })()

    return () => {
      cancelled = true
    }
  }, [enabled])

  return coordinate
}
