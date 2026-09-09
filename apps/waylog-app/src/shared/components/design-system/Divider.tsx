import { palette } from '../../config/tokens'
import { Box } from './Box'
import type { Sx } from './sx'

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical'
  sx?: Sx
}

export function Divider({ orientation = 'horizontal', sx }: DividerProps) {
  const isVertical = orientation === 'vertical'

  return (
    <Box
      sx={{
        width: isVertical ? 1 : undefined,
        height: isVertical ? undefined : 1,
        alignSelf: isVertical ? 'stretch' : undefined,
        backgroundColor: palette.divider,
        ...(sx ?? {}),
      }}
    />
  )
}
