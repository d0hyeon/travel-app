import { Box } from "@mui/material";
import { useState, type ReactNode, useImperativeHandle, type Ref } from "react";
import { Easing, useAnimation, type AnimationSpec } from "~shared/hooks/animation/useAnimation";
import { useAsyncEffect } from "@waylog/react";
import { useVariation } from "@waylog/react";

export interface ScreenTransition {
  frames?: Keyframe[];

}

export interface FullScreenPopupProps {
  isOpen?: boolean;
  onClose?: () => void;
  children?: ReactNode;
  transition?: Partial<AnimationSpec>;
  enterFrom?: 'bottom' | 'right';
}

const EnterMotion = {
  bottom: { offset: 'translateY(20%)', duration: 250, easing: Easing.Linear },
  right: { offset: 'translateX(100%)', duration: 320, easing: Easing.Decelerate },
} as const;

export function FullScreenPopup({ isOpen, onClose, transition, enterFrom = 'bottom', children }: FullScreenPopupProps) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const animation = useAnimation({
    frames: [
      { transform: EnterMotion[enterFrom].offset, opacity: 0 },
      { transform: 'translate(0)', opacity: 1 }
    ],
    duration: EnterMotion[enterFrom].duration,
    easing: EnterMotion[enterFrom].easing,
    ...transition,
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
      setCurrent('closed');
      await animation.reverse();

      onClose?.();
    }
  }, [isOpen, container]);

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