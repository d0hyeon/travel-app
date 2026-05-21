import { Box } from "@mui/material";
import { useRef, type ReactNode } from "react";
import { useAnimation } from "~shared/hooks/animation/useAnimation";
import { useAsyncEffect } from "~shared/hooks/extends/useAsyncEffect";
import { useVariation } from "~shared/hooks/extends/useVariation";

interface Props {
  isOpen?: boolean;
  onClose?: () => void;
  children?: ReactNode;
}

export function FullScreenPopup({ isOpen, onClose, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const animation = useAnimation({
    frames: [
      { transform: 'translateY(20%)', opacity: 0 },
      { transform: 'translateY(0)', opacity: 1 }
    ],
    duration: 250
  }, ref.current);
  const [getCurrent, setCurrent] = useVariation('closed');

  useAsyncEffect(async () => {
    const current = getCurrent();
    if (isOpen && current === 'closed') {
      await animation.play()
      setCurrent('opened');
      return;
    }
    if (!isOpen && current === 'opened') {
      await animation.reverse();
      setCurrent('closed');
      onClose?.();
    }
  }, [isOpen])


  return (
    <Box
      ref={ref}
      className="fullscreen-popup"
      height="100dvh"
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1300,
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        transform: 'translateY(100%)',
        opacity: 0,
      }}
    >
      {children}
    </Box>
  )
}