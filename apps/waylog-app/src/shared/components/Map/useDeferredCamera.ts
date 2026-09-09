import { useState } from 'react'
import { usePreservedCallback, useVariation } from '@waylog/react'
import type { MapState } from '@rnmapbox/maps'
import type { MapBounds } from '@waylog/domains/modules/map'
import type { MapCamera } from './useMapMarkerRegistry.utils'
import { useTimer } from './useTimer'

// 손을 뗀 뒤 이어지는 관성을 한 번으로 묶는다.
const UPDATE_INTERVAL = 200

interface Params {
  screenWidth: number
  isMoving: () => boolean
  onApply?: (bounds: MapBounds) => void
}

/**
 * 카메라 이벤트는 초당 수십 번 들어온다. 그때마다 클러스터를 다시 묶으면 어지러우므로
 * 제스처가 끝나거나 카메라 이동이 멎은 시점까지 반영을 미룬다.
 */
export function useDeferredCamera({ screenWidth, isMoving, onApply }: Params) {
  const [camera, setCamera] = useState<MapCamera | null>(null)
  const [getPending, setPending] = useVariation<MapCamera | null>(null)
  const [wasGestureActive, setGestureActive] = useVariation(false)

  // 반영 직후 잇따라 들어오는 이벤트를 이 간격으로 묶는다.
  const updateInterval = useTimer()

  const notifyApply = usePreservedCallback((bounds: MapBounds) => onApply?.(bounds))

  const apply = (next: MapCamera) => {
    setPending(null)
    setCamera(next)
    notifyApply(next.bounds)
  }

  const scheduleNextUpdate = () => {
    updateInterval.start(UPDATE_INTERVAL, () => {
      const pending = getPending()
      if (pending == null) return

      apply(pending)
      scheduleNextUpdate()
    })
  }

  const track = (state: MapState) => {
    const isGestureActive = state.gestures.isGestureActive
    const hasGestureEnded = wasGestureActive() && !isGestureActive
    setGestureActive(isGestureActive)

    const next = toMapCamera(state, screenWidth)

    // 카메라를 옮기는 중이면 이동이 끝날 때 applyFinal 이 반영한다.
    if (isMoving() || isGestureActive) {
      setPending(next)
      return
    }

    // 손을 뗀 순간만 간격을 건너뛰고 바로 반영한다.
    if (updateInterval.isRunning() && !hasGestureEnded) {
      setPending(next)
      return
    }

    apply(next)
    scheduleNextUpdate()
  }

  /**
   * 카메라 이동이 끝났다. 마지막 위치로 반영한다. 곧바로 따라 들어오는 같은 이동의
   * 이벤트는 다음 간격까지 미뤄지고, 그 사이 사용자가 지도를 움직였다면 그 값이 반영된다.
   */
  const applyFinal = (state: MapState) => {
    apply(toMapCamera(state, screenWidth))
    scheduleNextUpdate()
  }

  /** 새 이동이 시작됐다. 이전 이동을 기다리던 값은 모두 버린다. */
  const discardPending = () => {
    updateInterval.cancel()
    setPending(null)
  }

  return { camera, track, applyFinal, discardPending }
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
