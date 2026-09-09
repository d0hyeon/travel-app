import { StyleSheet, Pressable, type StyleProp, type ViewStyle } from 'react-native'
import { palette } from '../../config/tokens'
import { Typography } from './Typography'

export interface CheckboxProps {
  checked?: boolean
  size?: 'small' | 'medium'
  onChange?: (event?: unknown) => void
  style?: StyleProp<ViewStyle>
}

export function Checkbox({ checked = false, size = 'medium', onChange, style }: CheckboxProps) {
  const box = size === 'small' ? 18 : 22
  return (
    <Pressable
      onPress={() => onChange?.()}
      style={[
        [styles.pressable, { width: box, height: box, borderColor: checked ? palette.primary : palette.divider, backgroundColor: checked ? palette.primary : 'transparent' }],
        style,
      ]}
    >
      {checked && (
        <Typography style={[styles.typography, { fontSize: size === 'small' ? 11 : 13 }]}>
          ✓
      </Typography>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typography: {
    color: '#fff',
    fontWeight: '900',
  },
})
