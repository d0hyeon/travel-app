import { useCallback } from 'react';

interface UseSnapPointsOptions {
  snapPoints: number[] | readonly number[];
  minHeight: number;
  getContainerHeight: () => number;
  isModalMode: boolean;
}

export function useSnapPoints({
  snapPoints,
  minHeight,
  getContainerHeight,
  isModalMode,
}: UseSnapPointsOptions) {
  const getHeightForSnap = useCallback((index: number) => {
    const containerHeight = getContainerHeight();
    return Math.max(minHeight, containerHeight * snapPoints[index]);
  }, [getContainerHeight, snapPoints, minHeight]);

  const findNearestSnapIndex = useCallback((height: number) => {
    const containerHeight = getContainerHeight();
    const ratio = height / containerHeight;

    // 모달 모드에서 특정 임계값 이하로 드래그하면 닫기
    if (isModalMode && ratio < snapPoints[0] * 0.5) {
      return -1; // 닫기 신호
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
  }, [getContainerHeight, snapPoints, isModalMode]);

  return {
    getHeightForSnap,
    findNearestSnapIndex,
  };
}
