import { Box, type BoxProps } from "@mui/material";
import { useEffect, useEffectEvent, useState } from "react";

type Props = {
  onResize?: (entry: ResizeObserverEntry) => void;
} & BoxProps

export function ResizeObserverArea({ onResize, children, ...props }: Props) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const handleResize = useEffectEvent((entry: ResizeObserverEntry) => onResize?.(entry));

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => handleResize(entry));

    if (container) {
      observer.observe(container);

      return () => observer.disconnect();
    }
  }, [container])

  return (
    <Box ref={setContainer} {...props}>
      {children}
    </Box>
  )
}