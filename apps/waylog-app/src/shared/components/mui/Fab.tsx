import type { ReactNode } from 'react'
import { Pressable } from 'react-native'
import { palette } from '../../config/tokens'
import { sxToStyle, type Sx } from './sx'

export interface FabProps {
  children?: ReactNode
  onClick?: () => void
  color?: 'primary' | 'default'
  size?: 'small' | 'medium' | 'large'
  sx?: Sx
}

export function Fab({ children, onClick, color = 'primary', size = 'medium', sx }: FabProps) {
  const box = size === 'small' ? 40 : size === 'large' ? 64 : 56

  return (
    <Pressable
      onPress={onClick}
      style={[
        {
          width: box,
          height: box,
          borderRadius: box / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: color === 'primary' ? palette.primary : '#fff',
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          elevation: 4,
        },
        sxToStyle(sx),
      ]}
    >
      {children}
    </Pressable>
  )
}
