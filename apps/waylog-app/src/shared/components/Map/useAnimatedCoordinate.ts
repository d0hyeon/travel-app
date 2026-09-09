import { useEffect, useRef, useState } from 'react'
import { Easing } from 'react-native-reanimated'

interface Coordinate {
  latitude: number
  longitude: number
}

const MOVE_DURATION = 300
// 매 프레임 리렌더하면 마커가 많을 때 브릿지가 밀린다. 이 정도면 눈에 띄지 않는다.
const FRAME_INTERVAL = 33
const ease = Easing.out(Easing.quad)

let batchStartedAt = 0
let batchReleaseId: ReturnType<typeof setTimeout> | null = null

// 한 번의 카메라 갱신으로 함께 움직이는 클러스터들이 같은 순간에 출발하도록 시작 시각을 공유한다.
function claimBatchStartTime(): number {
  if (batchReleaseId == null) {
    batchStartedAt = Date.now()
  } else {
    clearTimeout(batchReleaseId)
  }

  batchReleaseId = setTimeout(() => {
    batchReleaseId = null
  }, 0)

  return batchStartedAt
}

/** 좌표를 목적지까지 옮긴다. */
export function useAnimatedCoordinate(
  destination: Coordinate,
  origin?: Coordinate,
): Coordinate {
  const { latitude, longitude } = destination
  const [current, setCurrent] = useState(origin ?? destination)

  const frameRef = useRef<number | null>(null)
  const currentRef = useRef(current)
  currentRef.current = current

  const targetRef = useRef(destination)
  targetRef.current = destination

  useEffect(() => {
    const startFrom = currentRef.current
    const target = targetRef.current
    const hasArrived =
      startFrom.latitude === target.latitude && startFrom.longitude === target.longitude
    if (hasArrived) return

    const startedAt = claimBatchStartTime()
    let drawnAt = 0

    const step = () => {
      const elapsed = Date.now() - startedAt
      const ratio = Math.min(elapsed / MOVE_DURATION, 1)
      const isDue = elapsed - drawnAt >= FRAME_INTERVAL

      if (isDue || ratio === 1) {
        drawnAt = elapsed
        setCurrent(interpolate(startFrom, target, ease(ratio)))
      }

      if (ratio < 1) frameRef.current = requestAnimationFrame(step)
    }

    frameRef.current = requestAnimationFrame(step)

    return () => {
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current)
    }
  }, [latitude, longitude])

  return current
}

function interpolate(
  origin: Coordinate,
  destination: Coordinate,
  ratio: number,
): Coordinate {
  return {
    latitude: origin.latitude + (destination.latitude - origin.latitude) * ratio,
    longitude: origin.longitude + (destination.longitude - origin.longitude) * ratio,
  }
}
