import { useEffect, useState } from 'react';

interface UseSheetStatusOptions {
  isOpen: boolean | undefined;
}

/**
 * 모달 애니메이션 상태 관리
 * - isVisible: DOM에 렌더링할지 여부
 * - isAnimating: 높이 애니메이션 활성화 여부
 */
export function useSheetStatus({ isOpen }: UseSheetStatusOptions) {
  const isModalMode = isOpen !== undefined;
  const [isVisible, setIsVisible] = useState(!isModalMode);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!isModalMode) return;

    if (isOpen) {
      setIsVisible(true);
      // 브라우저가 렌더링할 틈을 주기 위해 최소 지연
      const timer = setTimeout(() => setIsAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      // 애니메이션 완료 후 visibility 해제
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isModalMode]);

  return {
    isModalMode,
    isVisible,
    isAnimating,
  };
}
