import { Box, Fade, type BoxProps } from '@mui/material';
import { useCallback, useEffect, useImperativeHandle, useRef, useState, type ReactNode, type Ref } from 'react';
import { useVariation } from '~shared/hooks/useVariation';
import { IntersectionArea } from './IntersectionArea';

export type BottomSheetRef = {
  snap: number;
}

interface DraggableBottomSheetProps {
  children: ReactNode
  /** 스냅 포인트 (0-1 비율, 바텀시트가 차지하는 비율) */
  snapPoints?: number[] | readonly number[];
  /** 초기 스냅 포인트 인덱스 */
  defaultSnapIndex?: number
  /** 최소 높이 (px) */
  minHeight?: number
  /** 모달 모드: 열림/닫힘 상태 */
  isOpen?: boolean
  /** 모달 모드: 닫기 콜백 */
  onClose?: () => void
  /** 스냅 변경 콜백 (바텀시트가 차지하는 비율 전달) */
  onSnapChange?: (snapRatio: number) => void;
  ref?: Ref<BottomSheetRef>;

  slotProps?: { body?: BoxProps }
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
  ref,
  slotProps,
}: DraggableBottomSheetProps) {
  const isModalMode = isOpen !== undefined
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [snapIndex, setSnapIndex] = useState(defaultSnapIndex)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isVisible, setIsVisible] = useState(!isModalMode)
  const [isAnimating, setIsAnimating] = useState(false)

  useImperativeHandle(ref, () => {
    return {
      snap: snapPoints[snapIndex],
    }
  }, [snapIndex, ...snapPoints])

  // 모달 모드: isOpen 변경 시 visibility 및 애니메이션 제어
  useEffect(() => {
    if (isModalMode) {
      if (isOpen) {
        setIsVisible(true)
        setSnapIndex(defaultSnapIndex)
        // 즉시 애니메이션 시작 (브라우저가 렌더링할 틈을 주기 위해 최소 지연)
        const timer = setTimeout(() => setIsAnimating(true), 10)
        return () => clearTimeout(timer)
      } else {
        setIsAnimating(false)
        // 애니메이션 완료 후 visibility 해제
        const timer = setTimeout(() => setIsVisible(false), 300)
        return () => clearTimeout(timer)
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
    return container?.parentElement?.clientHeight ?? window.innerHeight
  }, [container])

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


  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    handleDragStart(e.touches[0].clientY);
  }, [handleDragStart])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    handleDragMove(e.touches[0].clientY)
  }, [handleDragMove]);

  const [getIsScrolled, setIsScrolled] = useVariation(false);

  const isEnableControlOnBodyRef = useRef(true);
  const handleBodyTouchStart = useCallback((e: React.TouchEvent) => {
    if (getIsScrolled() || shouldPreventSheetDrag(e.target)) {
      isEnableControlOnBodyRef.current = false;
      return;
    }
    e.stopPropagation();
    handleDragStart(e.touches[0].clientY);
    isEnableControlOnBodyRef.current = true;
  }, [handleDragStart])
  const handleBodyTouchMove = useCallback((e: React.TouchEvent) => {
    const isEnableControlOnBody = isEnableControlOnBodyRef.current;
    const isGuestureToBottom = dragState.current.startY < e.touches[0].clientY;
    const isScrolled = getIsScrolled();

    if (isEnableControlOnBody && isGuestureToBottom && !isScrolled) {
      e.stopPropagation();
      handleDragMove(e.touches[0].clientY)
    }
  }, [handleDragMove]);

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

  // 현재 높이 계산
  const baseHeight = getHeightForSnap(snapIndex)
  const containerHeight = getContainerHeight()
  const currentHeight = isDragging
    ? Math.max(0, Math.min(containerHeight, baseHeight + dragOffset))
    : isModalMode && !isAnimating
      ? 0
      : baseHeight

  const bodyRef = useRef(null);

  // 모달 모드가 아니거나 visible 상태일 때만 렌더링
  if (isModalMode && !isVisible && !isOpen) {
    return null
  }

  const sheetContent = (
    <Box
      ref={setContainer}
      sx={{
        position: isModalMode ? 'fixed' : 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: currentHeight,
        bgcolor: 'background.paper',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: isDragging ? 'none' : 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: isModalMode ? 1300 : 10,
        '& *': {
          overscrollBehaviorY: 'none',
        }
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
      <Box
        {...slotProps?.body}
        sx={[
          { flex: 1, overflow: 'auto' },
          ...(Array.isArray(slotProps?.body?.sx) ? slotProps.body.sx : [slotProps?.body?.sx])
        ]}
        onTouchStart={isModalMode ? handleBodyTouchStart : undefined}
        onTouchMove={isModalMode ? handleBodyTouchMove : undefined}
        onTouchEnd={isModalMode ? handleTouchEnd : undefined}
        ref={bodyRef}
      >
        <IntersectionArea
          root={bodyRef.current}
          onEnter={async () => {
            // await waitForTouchEnd();
            // console.log('enter')
            setIsScrolled(false);
          }}
          onLeave={() => {
            setIsScrolled(true)
            console.log('leave')
          }}
        >
          <span />
        </IntersectionArea>
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
            onClick={onClose}
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

DraggableBottomSheet.Scrollable = (props: BoxProps) => {
  return (
    <Box data-scrollable="true" {...props} />
  )
}

function isHtmlElement(node: EventTarget): node is HTMLElement {
  return node instanceof HTMLElement;
}
function isNode(node: EventTarget): node is Node {
  return node instanceof Node && !isHtmlElement(node);
}
/**
 * 해당 노드가 터치 이벤트를 독점해야 하는 요소인지 판별
 * @param {EventTarget} target - event.target
 * @returns {boolean} - true면 시트 드래그를 중단해야 함
 */
function shouldPreventSheetDrag(target: EventTarget) {
  let current: EventTarget | null = target;

  while (current) {
    if (isNode(current)) {
      current = current.parentElement;
      continue;
    }
    if (!isHtmlElement(current)) {
      return false;
    }
    const isScrollable = current.hasAttribute('[data-scrollable]');
    if (isScrollable) return true;
    // 1. 입력창 및 폼 요소 (포커스 및 텍스트 선택 보장)
    const isInput = ['INPUT', 'TEXTAREA', 'SELECT', 'OPTION'].includes(current.tagName);
    const isContentEditable = current.isContentEditable;

    // 2. 개발자가 명시한 스크롤 가능 영역 (data-scrollable)
    // 3. 지도 등 외부 라이브러리 (data-prevent-sheet 혹은 특정 클래스)
    const hasScrollAttribute = current.dataset.scrollable === 'true' ||
      current.dataset.preventSheet === 'true';

    if (isInput || isContentEditable || hasScrollAttribute) {
      return true; // 시트 드래그 로직 중단
    }
    // 상위 부모로 이동
    current = current.parentElement;
  }

  return false; // 시트 드래그 허용
}

function waitForTouchEnd() {
  return new Promise<void>((resolve) => {
    const handler = () => {
      resolve();
      document.removeEventListener('touchend', handler);
    }
    document.addEventListener('touchend', handler);
  })
}