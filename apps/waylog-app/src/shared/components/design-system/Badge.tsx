import { StyleSheet } from 'react-native'
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
    <Box style={styles.container}>
      {children}
      {isVisible && (
        <Box
          style={[styles.badge, { backgroundColor: color === 'error' ? '#d32f2f' : palette.primary }]}
        >
          <Typography style={styles.label}>
            {badgeContent > max ? `${max}+` : badgeContent}
          </Typography>
        </Box>
      )}
    </Box>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 12,
  },
})
