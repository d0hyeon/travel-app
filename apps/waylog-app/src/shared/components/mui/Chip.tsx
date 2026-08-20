import { palette } from '../../config/tokens'
import { Box } from './Box'
import { Typography } from './Typography'
import type { Sx } from './sx'

export interface ChipProps {
  label: string
  size?: 'small' | 'medium'
  sx?: Sx
}

export function Chip({ label, size = 'medium', sx }: ChipProps) {
  return (
    <Box
      sx={{
        paddingHorizontal: size === 'small' ? 6 : 10,
        paddingVertical: size === 'small' ? 2 : 4,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.08)',
        alignSelf: 'flex-start',
        ...(sx ?? {}),
      }}
    >
      <Typography sx={{ fontSize: size === 'small' ? 11 : 13, color: palette.text }}>
        {label}
      </Typography>
    </Box>
  )
}
