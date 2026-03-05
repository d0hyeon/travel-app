import { useEffect, useState } from 'react';

interface UseSheetStatusOptions {
  isOpen: boolean | undefined;
  defaultSnapIndex?: number;
  onResetSnapIndex?: (index: number) => void;
}

export function useBottomSheetStatus({ isOpen }: UseSheetStatusOptions) {
  const isModalMode = isOpen !== undefined;
  const [isVisible, setIsVisible] = useState(!isModalMode);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!isModalMode) return;

    if (isOpen) {
      setIsVisible(true);
      /** 이게 어떤 목적인지 모르겠다
       * onResetSnapIndex(defaultSnapIndex); 
       */
      // 브라우저가 렌더링할 틈을 주기 위해 최소 지연
      const timer = setTimeout(() => setIsAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      // 애니메이션 완료 후 visibility 해제
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isModalMode, isOpen]);

  return {
    isModalMode,
    isVisible,
    isAnimating,
  };
}
