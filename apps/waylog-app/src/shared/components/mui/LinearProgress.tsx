import { palette } from '../../config/tokens'
import { Box } from './Box'

export interface LinearProgressProps {
  /** 0-100 */
  value?: number
}

export function LinearProgress({ value = 0 }: LinearProgressProps) {
  return (
    <Box sx={{ height: 2, backgroundColor: palette.divider, borderRadius: 1 }}>
      <Box
        sx={{
          height: '100%',
          width: `${Math.min(Math.max(value, 0), 100)}%`,
          backgroundColor: palette.primary,
          borderRadius: 1,
        }}
      />
    </Box>
  )
}
