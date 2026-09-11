import { useEffect, useRef } from 'react'
import { usePreservedCallback } from '@waylog/react'
import type Mapbox from '@rnmapbox/maps'
import type { Coordinate } from '@waylog/domains/modules/map'
import {
  deltaToZoom,
  levelToDelta,
  toFitBounds,
  toViewportBounds,
  type FitBounds,
} from './NativeMap.utils'

const FIT_PADDING = 60
const FIT_DURATION = 0
const PAN_DURATION = 300

interface FitOptions {
  padding?: number
  duration?: number
}

interface Params {
  onMoveStart: () => void
  onMoveEnd: () => void
}

export function useCameraControl({ onMoveStart, onMoveEnd }: Params) {
  const ref = useRef<Mapbox.Camera>(null)
  const moveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const notifyMoveStart = usePreservedCallback(onMoveStart)
  const notifyMoveEnd = usePreservedCallback(onMoveEnd)

  const startMove = (move: () => void, duration: number) => {
    notifyMoveStart()
    move()

    if (moveTimerRef.current != null) clearTimeout(moveTimerRef.current)
    moveTimerRef.current = setTimeout(() => {
      moveTimerRef.current = null
      notifyMoveEnd()
    }, duration)
  }

  const moveToBounds = (
    bounds: FitBounds | null,
    { padding = FIT_PADDING, duration = FIT_DURATION }: FitOptions,
  ) => {
    if (bounds == null) return

    startMove(
      () =>
        ref.current?.setCamera({
          bounds: {
            ne: bounds.ne,
            sw: bounds.sw,
            paddingTop: padding,
            paddingBottom: padding,
            paddingLeft: padding,
            paddingRight: padding,
          },
          animationMode: duration === 0 ? 'none' : 'easeTo',
          animationDuration: duration,
        }),
      duration,
    )
  }

  /** 좌표들이 꽉 차게 당긴다. 배율은 지도가 범위에 맞춰 정한다. */
  const fitTo = usePreservedCallback(
    (coordinates: Coordinate[], options: FitOptions = {}) => {
      moveToBounds(toFitBounds(coordinates), options)
    },
  )

  // 자동으로 맞출 때는 마커가 하나여도 주변 지형이 보여야 해, 최소 범위를 지킨다.
  const fitToViewport = usePreservedCallback(
    (coordinates: Coordinate[], options: FitOptions = {}) => {
      moveToBounds(toViewportBounds(coordinates), options)
    },
  )

  // 웹과 같이 level 을 준 호출만 축척을 바꾼다. 생략하면 현재 축척을 유지한 채
  // 중심만 옮긴다 — 목록에서 항목을 고르는 것은 확대 요청이 아니다.
  const panTo = usePreservedCallback((center: Coordinate, level?: number) => {
    startMove(
      () =>
        ref.current?.setCamera({
          centerCoordinate: [center.lng, center.lat],
          ...(level == null ? {} : { zoomLevel: deltaToZoom(levelToDelta(level)) }),
          animationDuration: PAN_DURATION,
        }),
      PAN_DURATION,
    )
  })

  const isMoving = usePreservedCallback(() => moveTimerRef.current != null)

  useEffect(() => () => {
    if (moveTimerRef.current != null) clearTimeout(moveTimerRef.current)
  }, [])

  return { ref, fitTo, fitToViewport, panTo, isMoving }
}
