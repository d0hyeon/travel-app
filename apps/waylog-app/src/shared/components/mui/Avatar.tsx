import type { ReactNode } from 'react'
import { palette } from '../../config/tokens'
import { LoadableImage } from '../LoadableImage'
import { Box } from './Box'
import { Typography } from './Typography'
import { sxToStyle, type Sx } from './sx'

const DEFAULT_SIZE = 40

export interface AvatarProps {
  src?: string
  /** 이미지가 없을 때 보여줄 대체 내용. 보통 이름 첫 글자다. */
  children?: ReactNode
  sx?: Sx
}

export function Avatar({ src, children, sx }: AvatarProps) {
  const style = sxToStyle(sx)
  const size = typeof style.width === 'number' ? style.width : DEFAULT_SIZE

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: 'rgba(0,0,0,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        ...(sx ?? {}),
      }}
    >
      {src != null ? (
        <LoadableImage source={{ uri: src }} style={{ width: size, height: size }} resizeMode="cover" />
      ) : (
        <Typography
          sx={{
            fontSize: typeof style.fontSize === 'number' ? style.fontSize : size / 2,
            color: palette.textSecondary,
          }}
        >
          {children}
        </Typography>
      )}
    </Box>
  )
}
