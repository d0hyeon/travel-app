import { Box } from "@mui/material";
import { useState, type ReactNode } from "react";
import { useAnimation, type AnimationSpec } from "~shared/hooks/animation/useAnimation";
import { useAsyncEffect } from "~shared/hooks/extends/useAsyncEffect";
import { useVariation } from "~shared/hooks/extends/useVariation";

export interface ScreenTransition {
  frames?: Keyframe[];

}

interface Props {
  isOpen?: boolean;
  onClose?: () => void;
  children?: ReactNode;
  transition?: Partial<AnimationSpec>;
}

export function FullScreenPopup({ isOpen, onClose, transition, children }: Props) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const animation = useAnimation({
    frames: [
      { transform: 'translateY(20%)', opacity: 0 },
      { transform: 'translateY(0)', opacity: 1 }
    ],
    duration: 250,
    ...transition
  }, container);
  const [getCurrent, setCurrent] = useVariation('closed');

  useAsyncEffect(async () => {
    if (container == null) return;
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
  }, [isOpen, container])


  return (
    <Box
      ref={setContainer}
      className="fullscreen-popup"
      height="100dvh"
      sx={[
        {
          position: 'fixed',
          inset: 0,
          bgcolor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
          transform: 'translateY(100%)',
          opacity: 0,
          height: '100dvh',
          overflow: 'auto'
        },
        theme => ({ zIndex: theme.zIndex.modal })
      ]}
    >
      {children}
    </Box>
  )
}