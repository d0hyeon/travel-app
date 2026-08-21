import type { ReactNode } from 'react'
import { Pressable } from 'react-native'
import { sxToStyle, type Sx } from './sx'

export interface IconButtonProps {
  children?: ReactNode
  onClick?: () => void
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  sx?: Sx
}

export function IconButton({ children, onClick, size = 'medium', disabled, sx }: IconButtonProps) {
  const box = size === 'small' ? 28 : size === 'large' ? 44 : 36

  return (
    <Pressable
      onPress={disabled ? undefined : onClick}
      style={[
        {
          width: box,
          height: box,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: box / 2,
          opacity: disabled ? 0.4 : 1,
        },
        sxToStyle(sx),
      ]}
    >
      {children}
    </Pressable>
  )
}
