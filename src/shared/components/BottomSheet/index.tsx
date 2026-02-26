import { Box, Fade, type BoxProps } from '@mui/material';
import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type ReactNode, type Ref } from 'react';
import { useVariation } from '~shared/hooks/useVariation';
import { IntersectionArea } from '../IntersectionArea';
import { useContentHeight } from './useContentHeight';
import { useDrag } from './useDrag';
import { useKeyboardStatus } from './useKeyboardStatus';
import { useSheetStatus } from './useSheetStatus';
import { useSnapPoints } from './useSnapPoints';
import { shouldPreventSheetDrag } from './utils';

export type BottomSheetRef = {
  snap: number;
}

interface BottomSheetProps {
  children: ReactNode
  /** 스냅 포인트 (0-1 비율, 바텀시트가 차지하는 비율). 미제공시 컨텐츠 높이에 맞춤 */
  snapPoints?: number[] | readonly number[];
  /** 초기 스냅 포인트 인덱스. 미제공시 컨텐츠 높이에 가장 가까운 스냅 선택 */
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

const DEFAULT_SNAP_POINTS = [0.3, 0.5, 0.7, 0.9] as const;
const DRAG_HANDLE_HEIGHT = 28; // 드래그 핸들 높이 (px)


export function BottomSheet({
  children,
  snapPoints: snapPointsProp,
  defaultSnapIndex: defaultSnapIndexProp,
  minHeight = 100,
  isOpen,
  onClose,
  onSnapChange,
  ref,
  slotProps,
}: BottomSheetProps) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const getContainerHeight = useCallback(() => {
    return container?.parentElement?.clientHeight ?? window.innerHeight;
  }, [container]);

  // 자동 높이 계산이 필요한지 판단
  const needsAutoHeight = snapPointsProp === undefined;
  const needsAutoSnapIndex = snapPointsProp !== undefined && defaultSnapIndexProp === undefined;
  const isAutoMode = needsAutoHeight || needsAutoSnapIndex;

  // 컨텐츠 높이 측정
  const { contentHeight } = useContentHeight({
    contentRef,
    enabled: isAutoMode,
  });

  // 실제 사용할 snapPoints와 defaultSnapIndex 계산
  const { snapPoints, defaultSnapIndex } = useMemo(() => {
    const containerHeight = getContainerHeight();

    if (needsAutoHeight && contentHeight !== null) {
      // Case 1: snapPoints 미제공 → 컨텐츠 높이를 단일 스냅으로 사용
      const contentRatio = Math.min(0.95, (contentHeight + DRAG_HANDLE_HEIGHT) / containerHeight);
      return {
        snapPoints: [contentRatio] as const,
        defaultSnapIndex: 0,
      };
    }

    if (needsAutoSnapIndex && contentHeight !== null && snapPointsProp) {
      // Case 2: snapPoints 제공, defaultSnapIndex 미제공 → 가장 가까운 스냅 찾기
      const contentRatio = (contentHeight + DRAG_HANDLE_HEIGHT) / containerHeight;
      let nearestIndex = 0;
      let minDiff = Math.abs(contentRatio - snapPointsProp[0]);

      for (let i = 1; i < snapPointsProp.length; i++) {
        const diff = Math.abs(contentRatio - snapPointsProp[i]);
        if (diff < minDiff) {
          minDiff = diff;
          nearestIndex = i;
        }
      }

      return {
        snapPoints: snapPointsProp,
        defaultSnapIndex: nearestIndex,
      };
    }

    // Case 3: 둘 다 제공됨 → 그대로 사용
    return {
      snapPoints: snapPointsProp ?? DEFAULT_SNAP_POINTS,
      defaultSnapIndex: defaultSnapIndexProp ?? 0,
    };
  }, [snapPointsProp, defaultSnapIndexProp, needsAutoHeight, needsAutoSnapIndex, contentHeight, getContainerHeight]);

  const [snapIndex, setSnapIndex] = useState(defaultSnapIndex);

  // defaultSnapIndex가 변경되면 snapIndex도 업데이트 (auto 모드에서 컨텐츠 높이 측정 완료 시)
  useEffect(() => {
    setSnapIndex(defaultSnapIndex);
  }, [defaultSnapIndex]);

  // 모달 애니메이션
  const { isModalMode, isVisible, isAnimating } = useSheetStatus({
    isOpen,
    defaultSnapIndex,
    onResetSnapIndex: setSnapIndex,
  });

  // 스냅 포인트 계산
  const { getHeightForSnap, findNearestSnapIndex } = useSnapPoints({
    snapPoints,
    minHeight,
    getContainerHeight,
    isModalMode,
  });

  // 드래그 핸들링
  const { isDragging, dragOffset, dragState, handlers } = useDrag({
    snapIndex,
    getHeightForSnap,
    getContainerHeight,
    findNearestSnapIndex,
    onSnapChange: setSnapIndex,
    onClose,
  });

  // ref 노출
  useImperativeHandle(ref, () => ({
    snap: snapPoints[snapIndex],
  }), [snapIndex, snapPoints]);

  // 스냅 변경 시 콜백
  useEffect(() => {
    onSnapChange?.(snapPoints[snapIndex]);
  }, [snapIndex, snapPoints, onSnapChange]);

  // 높이 계산
  const baseHeight = getHeightForSnap(snapIndex);
  const containerHeight = getContainerHeight();
  const currentHeight = isDragging
    ? Math.max(0, Math.min(containerHeight, baseHeight + dragOffset))
    : isModalMode && !isAnimating
      ? 0
      : baseHeight;

  // 렌더링 조건
  if (isModalMode && !isVisible && !isOpen) {
    return null;
  }

  return (
    <>
      {isModalMode && (
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
      )}
      <SheetContainer
        ref={setContainer}
        isModalMode={isModalMode}
        height={currentHeight}
        isDragging={isDragging}
      >
        <DragHandle
          handlers={handlers}
        />
        <SheetBody
          isModalMode={isModalMode}
          dragState={dragState}
          handlers={handlers}
          slotProps={slotProps}
          contentRef={contentRef}
        >
          {children}
        </SheetBody>
      </SheetContainer>
    </>
  );
}

// --- Sub Components ---

interface SheetContainerProps {
  ref: (el: HTMLDivElement | null) => void;
  isModalMode: boolean;
  height: number;
  isDragging: boolean;
  children: ReactNode;
}

function SheetContainer({ ref, isModalMode, height, isDragging, children }: SheetContainerProps) {
  return (
    <Box
      ref={ref}
      sx={{
        position: isModalMode ? 'fixed' : 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height,
        bgcolor: 'background.paper',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: isDragging ? 'none' : 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: isModalMode ? 1300 : 10,
        // '& *': {
        //   overscrollBehaviorY: 'none',
        // },
      }}
    >
      {children}
    </Box>
  );
}

interface DragHandleProps {
  handlers: {
    onDragStart: (clientY: number) => void;
    onDragMove: (clientY: number) => void;
    onDragEnd: () => void;
  };
}

function DragHandle({ handlers }: DragHandleProps) {
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    handlers.onDragStart(e.touches[0].clientY);
  }, [handlers]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    handlers.onDragMove(e.touches[0].clientY);
  }, [handlers]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handlers.onDragStart(e.clientY);
  }, [handlers]);

  return (
    <Box
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handlers.onDragEnd}
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
  );
}

interface SheetBodyProps {
  isModalMode: boolean;
  dragState: React.MutableRefObject<{ isDragging: boolean; startY: number; startHeight: number }>;
  handlers: {
    onDragStart: (clientY: number) => void;
    onDragMove: (clientY: number) => void;
    onDragEnd: () => void;
  };
  slotProps?: { body?: BoxProps };
  contentRef: React.RefObject<HTMLDivElement | null>;
  children: ReactNode;
}

function SheetBody({ isModalMode, dragState, handlers, slotProps, contentRef, children }: SheetBodyProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [getIsScrolled, setIsScrolled] = useVariation(false);
  const isEnableControlOnBodyRef = useRef(true);

  const { isOpen: isOpenKeyboard } = useKeyboardStatus();
  const handleBodyTouchStart = useCallback((e: React.TouchEvent) => {
    if (isOpenKeyboard || getIsScrolled() || shouldPreventSheetDrag(e.target)) {
      isEnableControlOnBodyRef.current = false;
      return;
    }
    e.stopPropagation();
    handlers.onDragStart(e.touches[0].clientY);
    isEnableControlOnBodyRef.current = true;
  }, [handlers, isOpenKeyboard, getIsScrolled]);

  const handleBodyTouchMove = useCallback((e: React.TouchEvent) => {
    const isGestureToBottom = dragState.current.startY < e.touches[0].clientY;
    const isScrolled = getIsScrolled();

    // 스크롤이 발생하면 이 제스처 동안 드래그 컨트롤 비활성화 (다시 0으로 돌아와도 유지)
    if (isScrolled) {
      isEnableControlOnBodyRef.current = false;
    }

    const isEnableControlOnBody = isEnableControlOnBodyRef.current;
    if (isEnableControlOnBody && isGestureToBottom && !isScrolled) {
      e.stopPropagation();
      handlers.onDragMove(e.touches[0].clientY);
    }
  }, [handlers, dragState, getIsScrolled]);

  return (
    <Box
      {...slotProps?.body}
      ref={bodyRef}
      sx={[
        { flex: 1, overflow: 'auto' },
        ...(Array.isArray(slotProps?.body?.sx) ? slotProps.body.sx : [slotProps?.body?.sx]),
      ]}
      onTouchStart={isModalMode ? handleBodyTouchStart : undefined}
      onTouchMove={isModalMode ? handleBodyTouchMove : undefined}
      onTouchEnd={isModalMode ? handlers.onDragEnd : undefined}
    >
      <IntersectionArea
        root={bodyRef.current}
        onEnter={() => setIsScrolled(false)}
        onLeave={() => setIsScrolled(true)}
      >
        <span />
      </IntersectionArea>
      <Box ref={contentRef}>
        {children}
      </Box>
    </Box>
  );
}

BottomSheet.Scrollable = (props: BoxProps) => {
  return <Box data-scrollable="true" {...props} />;
};
