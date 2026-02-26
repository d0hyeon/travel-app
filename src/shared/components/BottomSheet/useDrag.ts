import { useCallback, useEffect, useRef, useState } from 'react';

interface UseDragOptions {
  snapIndex: number;
  getHeightForSnap: (index: number) => number;
  getContainerHeight: () => number;
  findNearestSnapIndex: (height: number) => number;
  onSnapChange: (index: number) => void;
  onClose?: () => void;
}

export function useDrag({
  snapIndex,
  getHeightForSnap,
  getContainerHeight,
  findNearestSnapIndex,
  onSnapChange,
  onClose,
}: UseDragOptions) {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const dragState = useRef({
    isDragging: false,
    startY: 0,
    startHeight: 0,
  });

  const handleDragStart = useCallback((clientY: number) => {
    const currentHeight = getHeightForSnap(snapIndex);
    dragState.current = {
      isDragging: true,
      startY: clientY,
      startHeight: currentHeight,
    };
    setIsDragging(true);
  }, [snapIndex, getHeightForSnap]);

  const handleDragMove = useCallback((clientY: number) => {
    if (!dragState.current.isDragging) return;
    const deltaY = dragState.current.startY - clientY;
    setDragOffset(deltaY);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (!dragState.current.isDragging) return;

    const { startHeight } = dragState.current;
    const containerHeight = getContainerHeight();
    const newHeight = Math.max(0, Math.min(containerHeight * 0.95, startHeight + dragOffset));
    const newSnapIndex = findNearestSnapIndex(newHeight);

    dragState.current.isDragging = false;
    setIsDragging(false);
    setDragOffset(0);

    if (newSnapIndex === -1) {
      onClose?.();
    } else {
      onSnapChange(newSnapIndex);
    }
  }, [dragOffset, getContainerHeight, findNearestSnapIndex, onSnapChange, onClose]);

  // Mouse handlers (document level)
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => handleDragMove(e.clientY);
    const handleMouseUp = () => handleDragEnd();

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  return {
    isDragging,
    dragOffset,
    dragState,
    handlers: {
      onDragStart: handleDragStart,
      onDragMove: handleDragMove,
      onDragEnd: handleDragEnd,
    },
  };
}
