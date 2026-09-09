import { Pressable, type StyleProp, type ViewStyle } from 'react-native'
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
        {
          width: box,
          height: box,
          borderRadius: 4,
          borderWidth: 2,
          borderColor: checked ? palette.primary : palette.divider,
          backgroundColor: checked ? palette.primary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      {checked && (
        <Typography style={{ color: '#fff', fontSize: size === 'small' ? 11 : 13, fontWeight: '900' }}>
          ✓
      </Typography>
      )}
    </Pressable>
  )
}
