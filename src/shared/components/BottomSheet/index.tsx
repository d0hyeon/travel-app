import { Box, Fade, Stack } from '@mui/material';
import { useCallback, useEffect, useImperativeHandle, useMemo, useState, type ReactNode, type Ref } from 'react';
import { BottomSheetProvider } from './BottomSheetContext';
import { Body, BottomActions, Header, Scrollable } from './compounds';
import { useContentHeight } from './useContentHeight';
import { useDrag } from './useDrag';
import { useSheetStatus } from './useSheetStatus';
import { useSnapPoints } from './useSnapPoints';

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
}

const DEFAULT_SNAP_POINTS = [0.3, 0.5, 0.7, 0.9] as const;
const DRAG_HANDLE_HEIGHT = 28;

export function BottomSheet({
  children,
  snapPoints: snapPointsProp,
  defaultSnapIndex: defaultSnapIndexProp,
  minHeight = 100,
  isOpen,
  onClose,
  onSnapChange,
  ref,
}: BottomSheetProps) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [content, setContent] = useState<HTMLDivElement | null>(null);

  const getContainerHeight = useCallback(() => {
    return container?.parentElement?.clientHeight ?? window.innerHeight;
  }, [container]);

  // 자동 높이 계산이 필요한지 판단
  const needsAutoHeight = snapPointsProp === undefined;
  const needsAutoSnapIndex = snapPointsProp !== undefined && defaultSnapIndexProp === undefined;
  const isAutoMode = needsAutoHeight || needsAutoSnapIndex;

  // 컨텐츠 높이 측정
  const { contentHeight, isMeasuring } = useContentHeight({
    content,
    enabled: isAutoMode,
  });

  // 실제 사용할 snapPoints와 defaultSnapIndex 계산
  const { snapPoints, defaultSnapIndex } = useMemo(() => {
    const containerHeight = getContainerHeight();

    if (needsAutoHeight && contentHeight !== null) {
      const contentRatio = Math.min(0.95, (contentHeight + DRAG_HANDLE_HEIGHT) / containerHeight);
      return {
        snapPoints: [contentRatio] as const,
        defaultSnapIndex: 0,
      };
    }

    if (needsAutoSnapIndex && contentHeight !== null && snapPointsProp) {
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

    return {
      snapPoints: snapPointsProp ?? DEFAULT_SNAP_POINTS,
      defaultSnapIndex: defaultSnapIndexProp ?? 0,
    };
  }, [snapPointsProp, defaultSnapIndexProp, needsAutoHeight, needsAutoSnapIndex, contentHeight, getContainerHeight]);

  const [snapIndex, setSnapIndex] = useState(defaultSnapIndex);

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

  const contextValue = {
    isModalMode,
    handlers,
    dragState,
  };

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
        <DragHandle handlers={handlers} />
        <Stack height={isMeasuring ? "auto" : `calc(100% - ${DRAG_HANDLE_HEIGHT}px)`} ref={setContent}>
          <BottomSheetProvider value={contextValue}>
            {children}
          </BottomSheetProvider>
        </Stack>
      </SheetContainer>
    </>
  );
}

// --- Internal Components ---

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

// --- Compound Components ---

BottomSheet.Header = Header;
BottomSheet.Body = Body;
BottomSheet.BottomActions = BottomActions;
BottomSheet.Scrollable = Scrollable;
