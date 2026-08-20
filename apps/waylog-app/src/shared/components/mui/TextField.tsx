import { TextInput, type TextInputProps } from 'react-native'
import { palette, radius } from '../../config/tokens'
import { sxToStyle, type Sx } from './sx'

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  variant?: 'standard' | 'outlined'
  fullWidth?: boolean
  minRows?: number
  sx?: Sx
}

// 웹 MUI TextField 와 같은 자리를 차지한다.
export function TextField({
  variant = 'outlined',
  fullWidth,
  multiline,
  minRows = 1,
  sx,
  ...rest
}: TextFieldProps) {
  return (
    <TextInput
      multiline={multiline}
      placeholderTextColor={palette.textSecondary}
      style={[
        {
          fontSize: 14,
          color: palette.text,
          width: fullWidth ? '100%' : undefined,
          paddingHorizontal: variant === 'standard' ? 0 : 12,
          paddingVertical: 8,
          minHeight: multiline ? minRows * 20 : 40,
          textAlignVertical: multiline ? 'top' : 'center',
          borderWidth: variant === 'outlined' ? 1 : 0,
          borderBottomWidth: 1,
          borderColor: palette.divider,
          borderRadius: variant === 'outlined' ? radius.md : 0,
        },
        sxToStyle(sx),
      ]}
      {...rest}
    />
  )
}
