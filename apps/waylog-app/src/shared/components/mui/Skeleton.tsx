import { Box } from './Box'
import type { Sx } from './sx'

export interface SkeletonProps {
  width?: number | string
  height?: number | string
  variant?: 'text' | 'rectangular' | 'circular'
  sx?: Sx
}

export function Skeleton({ width = '100%', height = 16, variant = 'text', sx }: SkeletonProps) {
  return (
    <Box
      sx={{
        width,
        height,
        borderRadius: variant === 'circular' ? 999 : variant === 'text' ? 4 : 8,
        backgroundColor: 'rgba(0,0,0,0.08)',
        ...(sx ?? {}),
      }}
    />
  )
}
