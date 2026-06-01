import { Box } from "@mui/material";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { useAnimation } from "~shared/hooks/animation/useAnimation";
import { useElementSize } from "~shared/hooks/dom/useElementSize";
import { useIsMounted } from "~shared/hooks/useIsMounted";

type Props = {
  children: ReactNode;
  open?: boolean;
  delay?: number;
  duration?: number;
};

export function SlideReveal({ children, open = true, delay = 0, duration = 800 }: Props) {
  const [size, calculate] = useElementSize({ once: true });
  const isPrepared = size != null;

  const frames = useMemo(() => {
    if (!isPrepared) return [];
    return [
      { height: '0px', opacity: 0, offset: 0 },
      { height: `${size.height}px`, opacity: 0, transform: 'scale(0.9)', offset: 0.3 },
      { height: `${size.height}px`, opacity: 0, transform: 'scale(0.9)', offset: 0.6 },
      { height: `${size.height}px`, opacity: 1, transform: 'scale(1)', offset: 1 },
    ]
  }, [isPrepared])

  const containerRef = useRef<HTMLDivElement>(null);
  const animation = useAnimation(
    { frames, duration, delay },
    containerRef.current
  );

  const isMounted = useIsMounted();
  useEffect(() => {
    if (!isPrepared) return;
    if (open) {
      animation.play();
    } else if (isMounted) {
      animation.reverse();
    }
  }, [open, isPrepared]);

  return (
    <Box position="relative" overflow="hidden" height="0px" ref={containerRef}>
      <Box ref={calculate} position={size == null ? 'absolute' : 'relative'}>
        {children}
      </Box>
    </Box>
  );
}
