import type { ReactNode } from 'react'
import { StyleSheet, Pressable, type StyleProp, type ViewStyle, PressableProps } from 'react-native'

export interface IconButtonProps extends PressableProps {
  children?: ReactNode
  onPress?: () => void
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}

export function IconButton({ children, onPress, size = 'medium', disabled, style, ...props }: IconButtonProps) {
  const box = size === 'small' ? 28 : size === 'large' ? 44 : 36

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={[
        [styles.pressable, { width: box, height: box, borderRadius: box / 2, opacity: disabled ? 0.4 : 1 }],
        style,
      ]}
      {...props}
    >
      {children}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  pressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
