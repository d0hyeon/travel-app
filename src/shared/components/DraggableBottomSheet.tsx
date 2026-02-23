import { Box, Fade } from '@mui/material'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

interface DraggableBottomSheetProps {
  children: ReactNode
  /** 스냅 포인트 (0-1 비율, 바텀시트가 차지하는 비율) */
  snapPoints?: number[]
  /** 초기 스냅 포인트 인덱스 */
  defaultSnapIndex?: number
  /** 최소 높이 (px) */
  minHeight?: number
  /** 모달 모드: 열림/닫힘 상태 */
  isOpen?: boolean
  /** 모달 모드: 닫기 콜백 */
  onClose?: () => void
  /** 스냅 변경 콜백 (바텀시트가 차지하는 비율 전달) */
  onSnapChange?: (snapRatio: number) => void
}

const DEFAULT_SNAP_POINTS = [0.3, 0.5, 0.7, 0.9]

export function DraggableBottomSheet({
  children,
  snapPoints = DEFAULT_SNAP_POINTS,
  defaultSnapIndex = 0,
  minHeight = 100,
  isOpen,
  onClose,
  onSnapChange,
}: DraggableBottomSheetProps) {
  const isModalMode = isOpen !== undefined
  const containerRef = useRef<HTMLDivElement>(null)
  const [snapIndex, setSnapIndex] = useState(defaultSnapIndex)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isVisible, setIsVisible] = useState(!isModalMode)

  // 모달 모드: isOpen 변경 시 visibility 제어
  useEffect(() => {
    if (isModalMode) {
      if (isOpen) {
        setIsVisible(true)
        setSnapIndex(defaultSnapIndex)
      } else {
        setIsVisible(false)
      }
    }
  }, [isOpen, isModalMode, defaultSnapIndex])

  // 스냅 변경 시 콜백 호출
  useEffect(() => {
    onSnapChange?.(snapPoints[snapIndex])
  }, [snapIndex, snapPoints, onSnapChange])

  // 드래그 상태를 ref로 관리 (클로저 문제 해결)
  const dragState = useRef({
    isDragging: false,
    startY: 0,
    startHeight: 0,
  })

  const getContainerHeight = useCallback(() => {
    return containerRef.current?.parentElement?.clientHeight ?? window.innerHeight
  }, [])

  const getHeightForSnap = useCallback((index: number) => {
    const containerHeight = getContainerHeight()
    return Math.max(minHeight, containerHeight * snapPoints[index])
  }, [getContainerHeight, snapPoints, minHeight])

  const findNearestSnapIndex = useCallback((height: number) => {
    const containerHeight = getContainerHeight()
    const ratio = height / containerHeight

    // 모달 모드에서 특정 임계값 이하로 드래그하면 닫기
    if (isModalMode && ratio < snapPoints[0] * 0.5) {
      return -1 // 닫기 신호
    }

    let nearestIndex = 0
    let minDiff = Math.abs(ratio - snapPoints[0])

    for (let i = 1; i < snapPoints.length; i++) {
      const diff = Math.abs(ratio - snapPoints[i])
      if (diff < minDiff) {
        minDiff = diff
        nearestIndex = i
      }
    }

    return nearestIndex
  }, [getContainerHeight, snapPoints, isModalMode])

  const handleDragStart = useCallback((clientY: number) => {
    const currentHeight = getHeightForSnap(snapIndex)
    dragState.current = {
      isDragging: true,
      startY: clientY,
      startHeight: currentHeight,
    }
    setIsDragging(true)
  }, [snapIndex, getHeightForSnap])

  const handleDragMove = useCallback((clientY: number) => {
    if (!dragState.current.isDragging) return

    const deltaY = dragState.current.startY - clientY
    setDragOffset(deltaY)
  }, [])

  const handleDragEnd = useCallback(() => {
    if (!dragState.current.isDragging) return

    const { startHeight } = dragState.current
    const containerHeight = getContainerHeight()
    const newHeight = Math.max(0, Math.min(containerHeight * 0.95, startHeight + dragOffset))
    const newSnapIndex = findNearestSnapIndex(newHeight)

    dragState.current.isDragging = false
    setIsDragging(false)
    setDragOffset(0)

    if (newSnapIndex === -1) {
      // 모달 닫기
      onClose?.()
    } else {
      setSnapIndex(newSnapIndex)
    }
  }, [dragOffset, getContainerHeight, findNearestSnapIndex, onClose])

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    handleDragStart(e.touches[0].clientY);
  }, [handleDragStart])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    handleDragMove(e.touches[0].clientY)
  }, [handleDragMove])

  const handleTouchEnd = useCallback(() => {
    handleDragEnd()
  }, [handleDragEnd])

  // Mouse handlers
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientY)
    }

    const handleMouseUp = () => {
      handleDragEnd()
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleDragMove, handleDragEnd])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    handleDragStart(e.clientY)
  }, [handleDragStart])

  const handleBackdropClick = useCallback(() => {
    onClose?.()
  }, [onClose])

  // 현재 높이 계산
  const baseHeight = getHeightForSnap(snapIndex)
  const containerHeight = getContainerHeight()
  const currentHeight = isDragging
    ? Math.max(0, Math.min(containerHeight * 0.95, baseHeight + dragOffset))
    : baseHeight

  // 모달 모드가 아니거나 visible 상태일 때만 렌더링
  if (isModalMode && !isVisible && !isOpen) {
    return null
  }

  const sheetContent = (
    <Box
      ref={containerRef}
      sx={{
        position: isModalMode ? 'fixed' : 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: isModalMode && !isOpen ? 0 : currentHeight,
        bgcolor: 'background.paper',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: isDragging ? 'none' : 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: isModalMode ? 1300 : 10,
      }}
    >
      {/* Drag Handle */}
      <Box
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        sx={{
          position: 'relative',
          zIndex: 15,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          py: 3.5,
          mb: -1,
          my: -2,
          cursor: 'grab',
          touchAction: 'none',
          userSelect: 'none',
          flexShrink: 0,
          '&:active': {
            cursor: 'grabbing',
          },
          background: 'transfer'
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 4,
            borderRadius: 2,
            bgcolor: 'grey.300',
          }}
        />
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {children}
      </Box>
    </Box>
  )

  // 모달 모드: 백드롭 + 시트
  if (isModalMode) {
    return (
      <>
        <Fade in={isOpen}>
          <Box
            onClick={handleBackdropClick}
            sx={{
              position: 'fixed',
              inset: 0,
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1299,
            }}
          />
        </Fade>
        {sheetContent}
      </>
    )
  }

  return sheetContent
}
