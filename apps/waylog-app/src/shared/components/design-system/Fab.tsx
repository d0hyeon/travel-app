import type { ReactNode } from 'react'
import { StyleSheet, Pressable, type StyleProp, type ViewStyle } from 'react-native'
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
        [styles.pressable, [styles.pressable2, { width: box, height: box, borderRadius: box / 2, backgroundColor: color === 'primary' ? palette.primary : '#fff' }]],
        style,
      ]}
    >
      {children}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  pressable: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },

  pressable2: {
    shadowOffset: { width: 0, height: 2 },
  },
})
