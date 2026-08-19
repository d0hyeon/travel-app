import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";

interface UseContentHeightOptions {
  content: HTMLDivElement | null;
  enabled: boolean;
}

export function useContentHeight({
  content,
  enabled,
}: UseContentHeightOptions) {
  const [contentHeight, setContentHeight] = useState<number | null>(null);

  const measure = useEffectEvent(() => {
    if (!enabled || !content) return;

    const height = content.scrollHeight;
    setContentHeight(height);
  });

  useEffect(() => {
    if (!enabled) return;

    // 초기 측정 (렌더링 후)
    const timer = setTimeout(measure, 20);

    return () => clearTimeout(timer);
  }, [enabled, content]);

  return { contentHeight, isMeasuring: enabled && contentHeight == null };
}
