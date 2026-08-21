import { View, TextInput, type TextInputProps } from 'react-native'
import { palette, radius } from '../../config/tokens'
import { Typography } from './Typography'
import { sxToStyle, type Sx } from './sx'

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  variant?: 'standard' | 'outlined'
  fullWidth?: boolean
  minRows?: number
  /** MUI 처럼 입력 위에 이름을 얹는다. */
  label?: string
  size?: 'small' | 'medium'
  sx?: Sx
}

// 웹 MUI TextField 와 같은 자리를 차지한다.
export function TextField({
  variant = 'outlined',
  fullWidth,
  multiline,
  minRows = 1,
  label,
  size,
  sx,
  ...rest
}: TextFieldProps) {
  const input = (
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

  if (label == null) return input

  return (
    <View style={{ width: fullWidth ? '100%' : undefined, gap: 4 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      {input}
    </View>
  )
}
