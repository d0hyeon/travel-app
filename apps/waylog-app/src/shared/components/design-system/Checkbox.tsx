import { MaterialIcons } from '@expo/vector-icons'
import { StyleSheet, Pressable, type StyleProp, type ViewStyle } from 'react-native'
import { palette } from '~shared/config/tokens'

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
      {checked && <MaterialIcons name="check" size={size === 'small' ? 12 : 16} color="#fff" />}
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
})
