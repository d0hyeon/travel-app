import { Panzoom } from '@fancyapps/ui';
import type { WheelAction } from '@fancyapps/ui/types/Panzoom/types';
import { Box, type BoxProps } from '@mui/material';

import { useEffect, useState } from 'react';
import { usePreservedCallback } from '~shared/hooks/usePreservedCallback';

type PanzoomOption = Exclude<ConstructorParameters<typeof Panzoom>[1], undefined>;
type PickedOption = Pick<PanzoomOption, 'minScale' | 'maxScale' | 'bounce' | 'minScale' | 'maxScale'> & {
  click?: Exclude<PanzoomOption['click'], Function>;
  doubleClick?: Exclude<PanzoomOption['dblClick'], Function>;
};

type Props = PickedOption &
  BoxProps & {
    onZoomStart?: (instance: Panzoom) => void;
    onZoomEnd?: (instance: Panzoom) => void;
    wheel?: WheelAction | (() => WheelAction);
  };


export function ZoomArea({
  minScale = Panzoom.defaults.minScale,
  maxScale = Panzoom.defaults.maxScale,
  click = 'iterateZoom',
  doubleClick = 'toggleMax',
  bounce = Panzoom.defaults.bounce,
  children,
  onZoomStart = () => { },
  onZoomEnd = () => { },
  wheel = 'zoom',
  ...props
}: Props) {
  const [element, setElement] = useState<HTMLElement | null>(null);

  const preservedZoomStart = usePreservedCallback((instance: Panzoom) => {
    setTimeout(() => {
      if (instance.getMatrix().a > 1) {
        onZoomStart?.(instance);
      }
    }, 1000 / 60)
  });

  const preservedZoomEnd = usePreservedCallback((instance: Panzoom) => {
    if (instance.isScaling === false && instance.current.a === 1) {
      onZoomEnd?.(instance);
    }
  });


  useEffect(() => {
    if (element) {
      const instance = new Panzoom(element, {
        minScale,
        maxScale,
        click,
        dblClick: doubleClick,
        bounce,
        wheel,
        mouseMoveFactor: 1000,
        on: {
          startAnimation: () => preservedZoomStart(instance),
          endAnimation: () => preservedZoomEnd(instance),
        },
      });
      return () => instance.destroy();
    }
  }, [element, minScale, maxScale, bounce, click, wheel, doubleClick]);


  return (
    <Box ref={setElement} {...props}>
      {children}
    </Box>
  );
}
