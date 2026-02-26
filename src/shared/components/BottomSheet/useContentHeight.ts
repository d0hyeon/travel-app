import { useCallback, useEffect, useState } from 'react';

interface UseContentHeightOptions {
  content: HTMLDivElement | null;
  enabled: boolean;
}

export function useContentHeight({ content, enabled }: UseContentHeightOptions) {

  const [contentHeight, setContentHeight] = useState<number | null>(null);

  const measure = useCallback(() => {
    if (!enabled || !content) return;

    const height = content.scrollHeight;
    setContentHeight(height);
  }, [enabled, content]);

  useEffect(() => {
    if (!enabled) return;

    // 초기 측정 (렌더링 후)
    const timer = setTimeout(measure, 20);

    // ResizeObserver로 컨텐츠 크기 변화 감지
    const observer = new ResizeObserver(measure);
    if (content) {
      observer.observe(content);
    }

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [enabled, measure, content]);

  return { contentHeight, measure, isMeasuring: enabled && contentHeight == null };
}
