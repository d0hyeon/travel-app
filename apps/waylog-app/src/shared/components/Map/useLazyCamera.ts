import { useEffect, useRef, useState } from 'react'
import { usePreservedCallback } from '@waylog/react'
import type { MapState } from '@rnmapbox/maps'
import type { MapBounds } from '@waylog/domains/modules/map'
import type { MapCamera } from './useMapMarkerRegistry.utils'

// 손을 뗀 뒤 이어지는 관성을 한 번으로 묶는다.
const COAST_INTERVAL = 200

interface Params {
  screenWidth: number
  isMoving: () => boolean
  onSettle?: (bounds: MapBounds) => void
}

/**
 * 카메라 이벤트는 초당 수십 번 들어온다. 그때마다 클러스터를 다시 묶으면 어지러우므로
 * 제스처가 끝나거나 카메라 이동이 멎은 시점까지 반영을 미룬다.
 */
export function useLazyCamera({ screenWidth, isMoving, onSettle }: Params) {
  const [camera, setCamera] = useState<MapCamera | null>(null)

  const coastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = useRef<MapCamera | null>(null)
  const wasGestureActiveRef = useRef(false)

  const notifySettle = usePreservedCallback((bounds: MapBounds) => onSettle?.(bounds))

  const apply = (next: MapCamera) => {
    pendingRef.current = null
    setCamera(next)
    notifySettle(next.bounds)
  }

  const startCoastWindow = () => {
    coastTimerRef.current = setTimeout(() => {
      coastTimerRef.current = null
      const pending = pendingRef.current
      if (pending == null) return

      apply(pending)
      startCoastWindow()
    }, COAST_INTERVAL)
  }

  const track = (state: MapState) => {
    const next = toMapCamera(state, screenWidth)
    const isGestureActive = state.gestures.isGestureActive
    const hasGestureEnded = wasGestureActiveRef.current && !isGestureActive
    wasGestureActiveRef.current = isGestureActive

    // 카메라를 옮기는 중이면 그쪽이 끝날 때 settle 로 반영한다.
    if (isMoving() || isGestureActive) {
      pendingRef.current = next
      return
    }

    if (!hasGestureEnded && coastTimerRef.current != null) {
      pendingRef.current = next
      return
    }

    apply(next)
    startCoastWindow()
  }

  const settle = (state: MapState) => {
    apply(toMapCamera(state, screenWidth))
  }

  useEffect(() => () => {
    if (coastTimerRef.current != null) clearTimeout(coastTimerRef.current)
  }, [])

  return { camera, track, settle }
}

function toMapCamera(state: MapState, screenWidth: number): MapCamera {
  const [eastLng, northLat] = state.properties.bounds.ne
  const [westLng, southLat] = state.properties.bounds.sw

  return {
    zoom: state.properties.zoom,
    bounds: { north: northLat, south: southLat, east: eastLng, west: westLng },
    screenWidth,
  }
}
