import type { ReactNode } from 'react'
import { palette } from '../../config/tokens'
import { Box } from './Box'
import { Typography } from './Typography'

export interface BadgeProps {
  /** 표시할 수. 0 이면 뱃지를 감춘다 — MUI 와 같은 동작이다. */
  badgeContent?: number
  max?: number
  color?: 'error' | 'primary'
  children?: ReactNode
}

export function Badge({ badgeContent = 0, max = 99, color = 'error', children }: BadgeProps) {
  const isVisible = badgeContent > 0

  return (
    <Box sx={{ position: 'relative' }}>
      {children}
      {isVisible && (
        <Box
          sx={{
            position: 'absolute',
            top: -6,
            right: -6,
            minWidth: 18,
            height: 18,
            paddingHorizontal: 5,
            borderRadius: 9,
            backgroundColor: color === 'error' ? '#d32f2f' : palette.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography sx={{ fontSize: 10, fontWeight: '700', color: '#fff', lineHeight: 12 }}>
            {badgeContent > max ? `${max}+` : badgeContent}
          </Typography>
        </Box>
      )}
    </Box>
  )
}
