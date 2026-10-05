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

    // 우리가 건 카메라 애니메이션은 끝나는 시각을 알고 있으므로 applyFinal 이 맡는다.
    if (isMoving()) {
      setPending(next)
      return
    }

    // 제스처가 이어지는 동안에도 이 간격으로 따라간다. Mapbox 는 팬을 놓을 때
    // 제스처 종료 이벤트를 주지 않아, 손을 뗀 순간만 기다리면 영영 반영되지 않는다.
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
