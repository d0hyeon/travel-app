import { useEffect, useRef } from 'react'
import type { MapState } from '@rnmapbox/maps'
import type { MapBounds } from '@waylog/domains/modules/map'
import { useVariation } from '@waylog/react'
import { useCameraControl } from './useCameraControl'
import { useDeferredCamera } from './useDeferredCamera'

type DeferredCamera = ReturnType<typeof useDeferredCamera>

interface Params {
  screenWidth: number
  onApply?: (bounds: MapBounds) => void
}

/** 지도 카메라를 조종하고, 클러스터를 다시 묶을 시점의 카메라를 내놓는다. */
export function useMapCamera({ screenWidth, onApply }: Params) {
  const [getLastState, setLastState] = useVariation<MapState | null>(null)

  // 커밋된 렌더의 deferred 만 담는다. 렌더 본문에서 쓰면 suspend 로 버려진 렌더의
  // setCamera 가 남아, 마운트되지 않은 컴포넌트를 갱신하게 된다.
  const committedDeferredRef = useRef<DeferredCamera | null>(null)

  const control = useCameraControl({
    onMoveStart: () => committedDeferredRef.current?.discardPending(),
    onMoveEnd: () => {
      const lastState = getLastState()
      if (lastState == null) return

      committedDeferredRef.current?.applyFinal(lastState)
    },
  })

  const deferred = useDeferredCamera({ screenWidth, isMoving: control.isMoving, onApply })

  useEffect(() => {
    committedDeferredRef.current = deferred
    return () => {
      committedDeferredRef.current = null
    }
  })

  return {
    camera: deferred.camera,
    ref: control.ref,
    fitTo: control.fitTo,
    fitToViewport: control.fitToViewport,
    panTo: control.panTo,
    track: (state: MapState) => {
      setLastState(state)
      deferred.track(state)
    },
  }
}
