import { useEffect, useRef } from 'react'
import { usePreservedCallback } from '@waylog/react'
import type Mapbox from '@rnmapbox/maps'
import type { Coordinate } from '@waylog/domains/modules/map'
import { DEFAULT_DELTA, deltaToZoom, levelToDelta } from './NativeMap.utils'

const FIT_PADDING = 60
const FIT_DURATION = 0
const PAN_DURATION = 300

interface FitOptions {
  padding?: number
  duration?: number
}

interface Params {
  onMoveEnd: () => void
}

export function useCameraControl({ onMoveEnd }: Params) {
  const ref = useRef<Mapbox.Camera>(null)
  const moveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const notifyMoveEnd = usePreservedCallback(onMoveEnd)

  const startMove = (move: () => void, duration: number) => {
    move()

    if (moveTimerRef.current != null) clearTimeout(moveTimerRef.current)
    moveTimerRef.current = setTimeout(() => {
      moveTimerRef.current = null
      notifyMoveEnd()
    }, duration)
  }

  const fitTo = usePreservedCallback(
    (coordinates: Coordinate[], { padding = FIT_PADDING, duration = FIT_DURATION }: FitOptions = {}) => {
      if (coordinates.length === 0) return

      const lats = coordinates.map((coordinate) => coordinate.lat)
      const lngs = coordinates.map((coordinate) => coordinate.lng)

      startMove(
        () =>
          ref.current?.setCamera({
            bounds: {
              ne: [Math.max(...lngs), Math.max(...lats)],
              sw: [Math.min(...lngs), Math.min(...lats)],
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
    },
  )

  const panTo = usePreservedCallback((center: Coordinate, level?: number) => {
    const delta = level == null ? DEFAULT_DELTA : levelToDelta(level)

    startMove(
      () =>
        ref.current?.setCamera({
          centerCoordinate: [center.lng, center.lat],
          zoomLevel: deltaToZoom(delta),
          animationDuration: PAN_DURATION,
        }),
      PAN_DURATION,
    )
  })

  const isMoving = usePreservedCallback(() => moveTimerRef.current != null)

  useEffect(() => () => {
    if (moveTimerRef.current != null) clearTimeout(moveTimerRef.current)
  }, [])

  return { ref, fitTo, panTo, isMoving }
}
