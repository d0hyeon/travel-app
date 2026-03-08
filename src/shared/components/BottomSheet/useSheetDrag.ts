import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// ============================================================
// Constants
// ============================================================

const DEFAULT_SNAP_POINTS = [0.3, 0.5, 0.7, 0.9] as const;
export const DRAG_HANDLE_HEIGHT = 28;

// ============================================================
// Pure Functions
// ============================================================

interface CalculateSnapPointsInput {
  defaultSnapPoints: number[] | readonly number[] | undefined;
  defaultSnapIndex: number | undefined;
  contentHeight: number | null;
  containerHeight: number;
}

interface CalculateSnapPointsOutput {
  snapPoints: number[] | readonly number[];
  initialSnapIndex: number;
}

/**
 * snap 설정 계산
 * - snapPoints 미지정 시: contentHeight 기반으로 자동 계산
 * - snapIndex 미지정 시: contentHeight에 가장 가까운 snap 선택
 */
function calculateSnapPoints({
  defaultSnapPoints,
  defaultSnapIndex,
  contentHeight,
  containerHeight,
}: CalculateSnapPointsInput): CalculateSnapPointsOutput {
  const needsAutoHeight = defaultSnapPoints === undefined;
  const needsAutoSnapIndex = defaultSnapPoints !== undefined && defaultSnapIndex === undefined;

  // Case 1: snapPoints 미지정 → contentHeight 기반 단일 snap
  if (needsAutoHeight && contentHeight !== null) {
    const contentRatio = Math.min(0.95, (contentHeight + DRAG_HANDLE_HEIGHT) / containerHeight);
    return {
      snapPoints: [contentRatio],
      initialSnapIndex: 0,
    };
  }

  // Case 2: snapPoints 지정, snapIndex 미지정 → contentHeight에 가장 가까운 snap
  if (needsAutoSnapIndex && contentHeight !== null && defaultSnapPoints) {
    const contentRatio = (contentHeight + DRAG_HANDLE_HEIGHT) / containerHeight;
    let nearestIndex = 0;
    let minDiff = Math.abs(contentRatio - defaultSnapPoints[0]);

    for (let i = 1; i < defaultSnapPoints.length; i++) {
      const diff = Math.abs(contentRatio - defaultSnapPoints[i]);
      if (diff < minDiff) {
        minDiff = diff;
        nearestIndex = i;
      }
    }

    return {
      snapPoints: defaultSnapPoints,
      initialSnapIndex: nearestIndex,
    };
  }

  // Case 3: 모두 지정됨 또는 기본값 사용
  return {
    snapPoints: defaultSnapPoints ?? DEFAULT_SNAP_POINTS,
    initialSnapIndex: defaultSnapIndex ?? 0,
  };
}

interface SnapToHeightInput {
  snapIndex: number;
  snapPoints: number[] | readonly number[];
  containerHeight: number;
  minHeight: number;
}

/**
 * snap index → 픽셀 높이 변환
 */
function snapToHeight({ snapIndex, snapPoints, containerHeight, minHeight }: SnapToHeightInput): number {
  return Math.max(minHeight, containerHeight * snapPoints[snapIndex]);
}

interface HeightToSnapInput {
  height: number;
  snapPoints: number[] | readonly number[];
  containerHeight: number;
  allowClose: boolean;
}

/**
 * 픽셀 높이 → 가장 가까운 snap index 변환
 * @returns snap index. allowClose가 true이고 충분히 아래로 드래그하면 -1 (닫기 신호)
 */
function heightToSnap({ height, snapPoints, containerHeight, allowClose }: HeightToSnapInput): number {
  const ratio = height / containerHeight;

  // 닫기 임계값 체크
  if (allowClose && ratio < snapPoints[0] * 0.5) {
    return -1;
  }

  let nearestIndex = 0;
  let minDiff = Math.abs(ratio - snapPoints[0]);

  for (let i = 1; i < snapPoints.length; i++) {
    const diff = Math.abs(ratio - snapPoints[i]);
    if (diff < minDiff) {
      minDiff = diff;
      nearestIndex = i;
    }
  }

  return nearestIndex;
}

// ============================================================
// Hook
// ============================================================

interface UseSheetDragOptions {
  /** 스냅 포인트 (0-1 비율). 미제공시 컨텐츠 높이에 맞춤 */
  defaultSnapPoints?: number[] | readonly number[];
  /** 초기 스냅 인덱스. 미제공시 컨텐츠 높이에 가장 가까운 스냅 선택 */
  defaultSnapIndex?: number;
  /** 컨텐츠 높이 (px). auto height 계산에 사용 */
  contentHeight: number | null;
  /** 컨테이너 높이 (px) */
  containerHeight: number;
  /** 최소 높이 (px) */
  minHeight: number;
  /** 모달 열림 상태. 열릴 때 snap이 초기값으로 리셋됨 */
  isOpen?: boolean;
  /** 닫기 콜백 (모달 모드에서만 사용) */
  onClose?: () => void;
}

export interface DragState {
  isDragging: boolean;
  startY: number;
  startHeight: number;
}

export interface DragHandlers {
  onDragStart: (clientY: number) => void;
  onDragMove: (clientY: number) => void;
  onDragEnd: () => void;
}

export function useSheetDrag({
  defaultSnapPoints,
  defaultSnapIndex,
  contentHeight,
  containerHeight,
  minHeight,
  isOpen,
  onClose,
}: UseSheetDragOptions) {
  const isModalMode = isOpen !== undefined;

  // --- Snap 계산 ---
  const { snapPoints, initialSnapIndex } = useMemo(
    () => calculateSnapPoints({ defaultSnapPoints, defaultSnapIndex, contentHeight, containerHeight }),
    [defaultSnapPoints, defaultSnapIndex, contentHeight, containerHeight]
  );

  // --- Snap 상태 ---
  const [snapIndex, setSnapIndex] = useState(initialSnapIndex);

  // initialSnapIndex 변경 또는 모달 열릴 때 snap 동기화
  useEffect(() => {
    setSnapIndex(initialSnapIndex);
  }, [initialSnapIndex, isOpen]);

  // --- Drag 상태 ---
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef<DragState>({
    isDragging: false,
    startY: 0,
    startHeight: 0,
  });

  // --- 높이 계산 ---
  const getHeightForSnap = useCallback(
    (index: number) => snapToHeight({ snapIndex: index, snapPoints, containerHeight, minHeight }),
    [snapPoints, containerHeight, minHeight]
  );

  const baseHeight = getHeightForSnap(snapIndex);
  const currentHeight = isDragging
    ? Math.max(0, Math.min(containerHeight, baseHeight + dragOffset))
    : baseHeight;

  // --- Drag 핸들러 ---
  const handleDragStart = useCallback((clientY: number) => {
    dragState.current = {
      isDragging: true,
      startY: clientY,
      startHeight: getHeightForSnap(snapIndex),
    };
    setIsDragging(true);
  }, [snapIndex, getHeightForSnap]);

  const handleDragMove = useCallback((clientY: number) => {
    if (!dragState.current.isDragging) return;
    setDragOffset(dragState.current.startY - clientY);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (!dragState.current.isDragging) return;

    const newHeight = Math.max(0, Math.min(
      containerHeight * 0.95,
      dragState.current.startHeight + dragOffset
    ));

    const newSnapIndex = heightToSnap({
      height: newHeight,
      snapPoints,
      containerHeight,
      allowClose: isModalMode,
    });

    dragState.current.isDragging = false;
    setIsDragging(false);
    setDragOffset(0);

    if (newSnapIndex === -1) {
      onClose?.();
    } else {
      setSnapIndex(newSnapIndex);
    }
  }, [dragOffset, snapPoints, containerHeight, isModalMode, onClose]);

  // --- Document level 마우스 이벤트 ---
  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => handleDragMove(e.clientY);
    const onMouseUp = () => handleDragEnd();

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // --- Return ---
  const handlers: DragHandlers = {
    onDragStart: handleDragStart,
    onDragMove: handleDragMove,
    onDragEnd: handleDragEnd,
  };

  return {
    snapPoints,
    snapIndex,
    setSnapIndex,
    currentHeight,
    isDragging,
    dragState,
    handlers,
  };
}
