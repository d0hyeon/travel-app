import type { ReactNode } from 'react'
import { Pressable, type StyleProp, type ViewStyle } from 'react-native'
import { palette } from '../../config/tokens'

export interface FabProps {
  children?: ReactNode
  onPress?: () => void
  color?: 'primary' | 'default'
  size?: 'small' | 'medium' | 'large'
  style?: StyleProp<ViewStyle>
}

export function Fab({ children, onPress, color = 'primary', size = 'medium', style }: FabProps) {
  const box = size === 'small' ? 40 : size === 'large' ? 64 : 56

  return (
    <Pressable
      onPress={onPress}
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
        style,
      ]}
    >
      {children}
    </Pressable>
  )
}
