import { styled } from '@mui/system'
import { useCallback, useEffect, useRef, useState } from 'react'

interface UseResizableSplitOptions {
  /** Initial split ratio (percentage for first panel). Default: 50 */
  initialRatio?: number
  /** Minimum ratio for first panel. Default: 20 */
  minRatio?: number
  /** Maximum ratio for first panel. Default: 80 */
  maxRatio?: number
  /** Direction of split. Default: 'horizontal' */
  direction?: 'horizontal' | 'vertical'
  /** Callback when resize ends */
  onResizeEnd?: (ratio: number) => void
}

interface UseResizableSplitReturn {
  /** Current split ratio (percentage) */
  ratio: number
  /** Ref to attach to the container element */
  containerRef: React.RefObject<HTMLDivElement>
  /** Props to spread on the resize handle */
  handleProps: {
    onMouseDown: () => void
    onTouchStart: (e: React.TouchEvent) => void
  }
  /** Whether currently dragging */
  isDragging: boolean
}

export function useResizableSplit(options: UseResizableSplitOptions = {}): UseResizableSplitReturn {
  const {
    initialRatio = 50,
    minRatio = 20,
    maxRatio = 80,
    direction = 'horizontal',
    onResizeEnd,
  } = options

  const [ratio, setRatio] = useState(initialRatio)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const [isDragging, setIsDragging] = useState(false)

  const clamp = useCallback(
    (value: number) => Math.min(maxRatio, Math.max(minRatio, value)),
    [minRatio, maxRatio]
  )

  const calculateRatio = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return ratio

      const rect = containerRef.current.getBoundingClientRect()

      if (direction === 'horizontal') {
        return ((clientX - rect.left) / rect.width) * 100
      } else {
        return ((clientY - rect.top) / rect.height) * 100
      }
    },
    [direction, ratio]
  )

  const startDrag = useCallback(() => {
    isDraggingRef.current = true
    setIsDragging(true)
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize'
    document.body.style.userSelect = 'none'
  }, [direction])

  const handleMouseDown = useCallback(() => {
    startDrag()
  }, [startDrag])

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()
      startDrag()
    },
    [startDrag]
  )

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return
      const newRatio = calculateRatio(e.clientX, e.clientY)
      setRatio(clamp(newRatio))
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || !e.touches[0]) return
      const touch = e.touches[0]
      const newRatio = calculateRatio(touch.clientX, touch.clientY)
      setRatio(clamp(newRatio))
    }

    const handleEnd = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false
        setIsDragging(false)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        onResizeEnd?.(ratio)
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleEnd)
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleEnd)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleEnd)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleEnd)
    }
  }, [calculateRatio, clamp, onResizeEnd, ratio])

  return {
    ratio,
    containerRef: containerRef as React.RefObject<HTMLDivElement>,
    handleProps: {
      onMouseDown: handleMouseDown,
      onTouchStart: handleTouchStart,
    },
    isDragging,
  }
}

// Styled resize handle components
export const ResizeHandleHorizontal = styled('div')(({ theme }) => ({
  width: 8,
  cursor: 'col-resize',
  backgroundColor: theme.palette.grey[100],
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  transition: 'background-color 0.2s',
  touchAction: 'none',
  '&:hover': {
    backgroundColor: theme.palette.grey[300],
  },
  '&::after': {
    content: '""',
    width: 3,
    height: 40,
    borderRadius: 2,
    backgroundColor: theme.palette.grey[400],
  },
}))

export const ResizeHandleVertical = styled('div')(({ theme }) => ({
  height: 8,
  cursor: 'row-resize',
  backgroundColor: theme.palette.grey[100],
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  transition: 'background-color 0.2s',
  touchAction: 'none',
  '&:hover': {
    backgroundColor: theme.palette.grey[300],
  },
  '&::after': {
    content: '""',
    width: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.palette.grey[400],
  },
}))
