import { StyleSheet, View, TextInput, type TextInputProps } from 'react-native'
import { palette, radius } from '../../config/tokens'
import { Typography } from './Typography'
import { Ref } from 'react'

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  variant?: 'standard' | 'outlined'
  fullWidth?: boolean
  minRows?: number
  /** MUI 처럼 입력 위에 이름을 얹는다. */
  label?: string
  size?: 'small' | 'medium'
  style?: TextInputProps['style']
  ref?: Ref<TextInput>
}

// 웹 MUI TextField 와 같은 자리를 차지한다.
export function TextField({
  variant = 'outlined',
  fullWidth,
  multiline,
  minRows = 1,
  label,
  size,
  style,
  ...rest
}: TextFieldProps) {
  const input = (
    <TextInput

      multiline={multiline}
      placeholderTextColor={palette.textSecondary}
      style={[
        [styles.inputTextInput, { width: fullWidth ? '100%' : undefined, paddingHorizontal: variant === 'standard' ? 0 : 12, minHeight: multiline ? minRows * 20 : 40, textAlignVertical: multiline ? 'top' : 'center', borderWidth: variant === 'outlined' ? 1 : 0, borderRadius: variant === 'outlined' ? radius.md : 0 }],
        style,
      ]}
      {...rest}
    />
  )

  if (label == null) return input

  return (
    <View style={[styles.view, { width: fullWidth ? '100%' : undefined }]}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      {input}
    </View>
  )
}

const styles = StyleSheet.create({
  inputTextInput: {
    fontSize: 14,
    color: palette.text,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: palette.divider,
  },
  view: {
    gap: 4,
  },
})
