import type { ReactNode } from 'react'
import { StyleSheet, ActivityIndicator, type StyleProp, type TextStyle, type ViewStyle } from 'react-native'
import { Button as TamaguiButton, Text, useTheme } from 'tamagui'
import { radius } from '../../config/tokens'
import { resolveButtonColors, type ButtonColor, type ButtonVariant } from './Button.theme'

// 웹 theme.ts 의 MuiButton size variant 를 모바일 수치로 옮긴다.
const SIZE = {
  small: { height: 24, borderRadius: radius.sm, fontSize: 11, paddingHorizontal: 8 },
  medium: { height: 32, borderRadius: radius.md, fontSize: 13, paddingHorizontal: 12 },
  large: { height: 40, borderRadius: radius.lg, fontSize: 14, paddingHorizontal: 16 },
} as const

export interface ButtonProps {
  children?: ReactNode
  variant?: ButtonVariant
  size?: 'small' | 'medium' | 'large'
  color?: ButtonColor
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  startIcon?: ReactNode
  onPress?: () => void
  style?: StyleProp<ViewStyle>
  /** 라벨 텍스트에만 적용한다. style 은 컨테이너로 간다. */
  textStyle?: StyleProp<TextStyle>
}

export function Button({
  children,
  variant = 'text',
  size = 'medium',
  color = 'primary',
  disabled,
  loading,
  fullWidth,
  startIcon,
  onPress,
  style,
  textStyle,
}: ButtonProps) {
  const dims = SIZE[size]
  const theme = useTheme()
  const isInactive = disabled === true || loading === true
  const colors = resolveButtonColors(variant, color, {
    primary: theme.primary.val,
    danger: theme.danger.val,
    onPrimary: theme.onPrimary.val,
    onSurface: theme.onSurface.val,
  })

  return (
    <TamaguiButton
      unstyled
      disabled={isInactive}
      onPress={isInactive ? undefined : onPress}
      style={[
        styles.button,
        {
          height: dims.height,
          borderRadius: dims.borderRadius,
          paddingHorizontal: dims.paddingHorizontal,
          ...colors,
          opacity: isInactive ? 0.4 : 1,
          ...(fullWidth ? { flex: 1, width: '100%', alignSelf: 'center' } : { alignSelf: 'flex-start' }),
        },
        style,
      ]}
      pressStyle={isInactive ? undefined : styles.pressed}
    >
      {startIcon}
      {loading === true && <ActivityIndicator size="small" color={colors.textColor} />}
      <Text
        style={[
          styles.label,
          { fontSize: dims.fontSize, color: colors.textColor },
          textStyle,
        ]}
      >
        {children}
      </Text>
    </TamaguiButton>
  )
}

const styles = StyleSheet.create({
  label: {
    fontWeight: '900',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  pressed: {
    opacity: 0.72,
  },
})
