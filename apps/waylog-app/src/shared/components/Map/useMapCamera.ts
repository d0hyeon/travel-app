import { useRef } from 'react'
import type { MapState } from '@rnmapbox/maps'
import type { MapBounds } from '@waylog/domains/modules/map'
import { useCameraControl } from './useCameraControl'
import { useLazyCamera } from './useLazyCamera'

interface Params {
  screenWidth: number
  onSettle?: (bounds: MapBounds) => void
}

/** 지도 카메라를 조종하고, 클러스터를 다시 묶을 시점의 카메라를 내놓는다. */
export function useMapCamera({ screenWidth, onSettle }: Params) {
  const lastStateRef = useRef<MapState | null>(null)
  const settleRef = useRef<(state: MapState) => void>(() => {})

  const control = useCameraControl({
    onMoveEnd: () => {
      if (lastStateRef.current == null) return
      settleRef.current(lastStateRef.current)
    },
  })

  const lazy = useLazyCamera({ screenWidth, isMoving: control.isMoving, onSettle })
  settleRef.current = lazy.settle

  return {
    camera: lazy.camera,
    ref: control.ref,
    fitTo: control.fitTo,
    panTo: control.panTo,
    track: (state: MapState) => {
      lastStateRef.current = state
      lazy.track(state)
    },
  }
}
