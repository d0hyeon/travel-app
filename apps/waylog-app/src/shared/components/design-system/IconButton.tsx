import type { ReactNode } from 'react'
import { Pressable, type StyleProp, type ViewStyle } from 'react-native'

export interface IconButtonProps {
  children?: ReactNode
  onPress?: () => void
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}

export function IconButton({ children, onPress, size = 'medium', disabled, style }: IconButtonProps) {
  const box = size === 'small' ? 28 : size === 'large' ? 44 : 36

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={[
        {
          width: box,
          height: box,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: box / 2,
          opacity: disabled ? 0.4 : 1,
        },
        style,
      ]}
    >
      {children}
    </Pressable>
  )
}
