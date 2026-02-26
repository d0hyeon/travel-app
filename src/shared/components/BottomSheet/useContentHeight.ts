import { useCallback, useEffect, useState, type RefObject } from 'react';

interface UseContentHeightOptions {
  contentRef: RefObject<HTMLDivElement | null>;
  enabled: boolean;
}

export function useContentHeight({ contentRef, enabled }: UseContentHeightOptions) {
  const [contentHeight, setContentHeight] = useState<number | null>(null);

  const measure = useCallback(() => {
    if (!enabled || !contentRef.current) return;

    const height = contentRef.current.scrollHeight;
    setContentHeight(height);
  }, [enabled, contentRef]);

  useEffect(() => {
    if (!enabled) return;

    // 초기 측정 (렌더링 후)
    const timer = setTimeout(measure, 0);

    // ResizeObserver로 컨텐츠 크기 변화 감지
    const observer = new ResizeObserver(measure);
    if (contentRef.current) {
      observer.observe(contentRef.current);
    }

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [enabled, measure, contentRef]);

  return { contentHeight, measure };
}
