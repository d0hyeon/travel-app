import { useState, type ReactNode } from 'react'
import { useSharedValue } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { ResumableZoom } from 'react-native-zoom-toolkit'

interface Props {
  children: ReactNode
  width?: number
  height?: number
  onZoomStart?: () => void
  onZoomEnd?: () => void
}

const MAX_SCALE = 4
const ZOOMED_SCALE_THRESHOLD = 1.01

/** 웹 ZoomArea의 pinch, double-tap, 확대 상태 이동을 react-native-zoom-toolkit 으로 옮긴다. */
export function ZoomArea({ children, width, height, onZoomStart, onZoomEnd }: Props) {
  const currentScale = useSharedValue(1)
  const isZoomed = useSharedValue(false)
  const [isPanEnabled, setIsPanEnabled] = useState(false)

  const notifyZoomStart = () => {
    setIsPanEnabled(true)
    onZoomStart?.()
  }

  const notifyZoomEndIfReset = () => {
    if (!isZoomed.value || currentScale.value > ZOOMED_SCALE_THRESHOLD) return
    isZoomed.value = false
    setIsPanEnabled(false)
    onZoomEnd?.()
  }

  const sizeStyle = width == null && height == null ? { flex: 1 } : { width, height }

  return (
    <ResumableZoom
      style={sizeStyle}
      maxScale={MAX_SCALE}
      panEnabled={isPanEnabled}
      onUpdate={({ scale }) => {
        'worklet'
        currentScale.value = scale
        if (scale <= ZOOMED_SCALE_THRESHOLD || isZoomed.value) return
        isZoomed.value = true
        scheduleOnRN(notifyZoomStart)
      }}
      onGestureEnd={notifyZoomEndIfReset}
    >
      {children}
    </ResumableZoom>
  )
}
