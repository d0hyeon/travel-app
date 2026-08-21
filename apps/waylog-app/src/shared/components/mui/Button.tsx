import type { ReactNode } from 'react'
import { Pressable } from 'react-native'
import { palette, radius } from '../../config/tokens'
import { Typography } from './Typography'
import { sxToStyle, type Sx } from './sx'

// 웹 theme.ts 의 MuiButton size variant 를 모바일 수치로 옮긴다.
const SIZE = {
  small: { height: 24, borderRadius: radius.sm, fontSize: 11, paddingHorizontal: 8 },
  medium: { height: 32, borderRadius: radius.md, fontSize: 13, paddingHorizontal: 12 },
  large: { height: 40, borderRadius: radius.lg, fontSize: 14, paddingHorizontal: 16 },
} as const

export interface ButtonProps {
  children?: ReactNode
  variant?: 'contained' | 'outlined' | 'text'
  size?: 'small' | 'medium' | 'large'
  color?: 'primary' | 'error' | 'inherit'
  disabled?: boolean
  fullWidth?: boolean
  startIcon?: ReactNode
  onClick?: () => void
  sx?: Sx
}

export function Button({
  children,
  variant = 'text',
  size = 'medium',
  color = 'primary',
  disabled,
  fullWidth,
  startIcon,
  onClick,
  sx,
}: ButtonProps) {
  const dims = SIZE[size]
  const main = color === 'error' ? '#d32f2f' : palette.primary

  return (
    <Pressable
      onPress={disabled ? undefined : onClick}
      style={[
        {
          height: dims.height,
          borderRadius: dims.borderRadius,
          paddingHorizontal: dims.paddingHorizontal,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          backgroundColor: variant === 'contained' ? main : 'transparent',
          borderWidth: variant === 'outlined' ? 1 : 0,
          borderColor: main,
          opacity: disabled ? 0.4 : 1,
          // 부모가 row 면 alignSelf 는 세로 정렬이라 너비가 늘지 않는다.
          // 주축을 채우려면 flex 로 늘린다. 다만 stretch 를 함께 주면
          // 교차축까지 늘어나 지정한 height 를 넘겨 버린다.
          ...(fullWidth ? { flex: 1, alignSelf: 'center' } : { alignSelf: 'flex-start' }),
        },
        sxToStyle(sx),
      ]}
    >
      {startIcon}
      <Typography
        sx={{
          fontSize: dims.fontSize,
          fontWeight: '900',
          color: variant === 'contained' ? '#fff' : main,
        }}
      >
        {children}
      </Typography>
    </Pressable>
  )
}
