import { Stack, styled } from '@mui/material';

type FloatingCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface FloatingControlProps {
  corner: FloatingCorner;
}

const CORNER_STYLE: Record<FloatingCorner, object> = {
  'top-left': { top: 0, left: 0 },
  'top-right': { top: 0, right: 0 },
  'bottom-left': { bottom: 0, left: 0 },
  'bottom-right': { bottom: 0, right: 0 },
};

// 지도 위에 띄우는 컨트롤 컨테이너. 어느 코너에 붙일지 소비자가 결정한다.
export const FloatingControl = styled(Stack, {
  shouldForwardProp: (prop) => prop !== 'corner',
})<FloatingControlProps>(({ corner }) => ({
  position: 'absolute',
  gap: 8,
  padding: 8,
  ...CORNER_STYLE[corner],
}));
