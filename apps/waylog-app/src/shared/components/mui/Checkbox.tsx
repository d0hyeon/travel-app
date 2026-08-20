import { Pressable } from 'react-native'
import { palette } from '../../config/tokens'
import { Typography } from './Typography'
import { sxToStyle, type Sx } from './sx'

export interface CheckboxProps {
  checked?: boolean
  size?: 'small' | 'medium'
  onChange?: (event?: unknown) => void
  sx?: Sx
}

export function Checkbox({ checked = false, size = 'medium', onChange, sx }: CheckboxProps) {
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
        sxToStyle(sx),
      ]}
    >
      {checked && (
        <Typography sx={{ color: '#fff', fontSize: size === 'small' ? 11 : 13, fontWeight: '900' }}>
          ✓
        </Typography>
      )}
    </Pressable>
  )
}
