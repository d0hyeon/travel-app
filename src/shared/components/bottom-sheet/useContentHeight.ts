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
    if (!enabled || !content) return;

    // 초기 측정 (렌더링 후)
    const timer = setTimeout(measure, 20);

    // ResizeObserver로 컨텐츠 크기 변화 감지 (이미지/폼 등 비동기 로딩 후 재측정)
    const observer = new ResizeObserver(measure);
    observer.observe(content);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [enabled, measure, content]);

  return { contentHeight, measure, isMeasuring: enabled && contentHeight == null };
}
