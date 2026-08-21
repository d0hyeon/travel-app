import type { ReactNode } from 'react'
import { Stack, type StackProps } from '../../../../shared/components/mui'

type FloatingCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

const CORNER_STYLE: Record<FloatingCorner, object> = {
  'top-left': { top: 0, left: 0 },
  'top-right': { top: 0, right: 0 },
  'bottom-left': { bottom: 0, left: 0 },
  'bottom-right': { bottom: 0, right: 0 },
}

interface Props extends StackProps {
  corner: FloatingCorner
  zIndex?: number
  children?: ReactNode
}

// 지도 위에 띄우는 컨트롤 컨테이너. 어느 코너에 붙일지 소비자가 결정한다.
export function FloatingControl({ corner, zIndex, sx, ...props }: Props) {
  return (
    <Stack
      sx={{
        position: 'absolute',
        gap: 8,
        padding: 8,
        zIndex,
        ...CORNER_STYLE[corner],
        ...(sx ?? {}),
      }}
      {...props}
    />
  )
}
