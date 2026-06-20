import { useCallback, useEffect, useRef, useState } from 'react';

interface UseContentHeightOptions {
  content: HTMLDivElement | null;
  enabled: boolean;
}

export function useContentHeight({ content, enabled }: UseContentHeightOptions) {
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const contentRef = useRef(content);
  
  useEffect(() => {
    contentRef.current = content;
  }, [content])

  const measure = useCallback(() => {
    if (!enabled || !contentRef.current) return;

    const height = contentRef.current.scrollHeight;
    setContentHeight(height);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    // 초기 측정 (렌더링 후)
    const timer = setTimeout(measure, 20);

    // ResizeObserver로 컨텐츠 크기 변화 감지
    const observer = new ResizeObserver(measure);
    if (contentRef.current) {
      observer.observe(contentRef.current);
    }

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [enabled, measure]);

  return { contentHeight, measure, isMeasuring: enabled && contentHeight == null };
}
