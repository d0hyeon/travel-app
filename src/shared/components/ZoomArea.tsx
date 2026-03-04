import { Panzoom } from '@fancyapps/ui';
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
  ...props
}: Props) {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const preservedZoomStart = usePreservedCallback(onZoomStart);
  const preservedZoomEnd = usePreservedCallback(onZoomEnd);

  useEffect(() => {
    if (element) {
      const instance = new Panzoom(element, {
        minScale,
        maxScale,
        click,
        dblClick: doubleClick,
        bounce,
        on: {
          startAnimation: () => preservedZoomStart(instance),
          endAnimation: () => preservedZoomEnd(instance),
        },
      });

      return () => instance.destroy();
    }
  }, [element, minScale, maxScale, bounce, click, doubleClick]);

  return (
    <Box ref={setElement} {...props}>
      {children}
    </Box>
  );
}
