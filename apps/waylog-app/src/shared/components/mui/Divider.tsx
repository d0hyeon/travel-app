import { palette } from '../../config/tokens'
import { Box } from './Box'
import type { Sx } from './sx'

export interface DividerProps {
  sx?: Sx
}

export function Divider({ sx }: DividerProps) {
  return <Box sx={{ height: 1, backgroundColor: palette.divider, ...(sx ?? {}) }} />
}
