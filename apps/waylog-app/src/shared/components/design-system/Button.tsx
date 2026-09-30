import { useEffect, type ReactNode } from 'react'
import { StyleSheet, Pressable, Text, type StyleProp, type TextStyle, type ViewStyle } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useTheme } from 'tamagui'
import { radius } from '../../config/tokens'
import { CircularProgress } from './CircularProgress'
import { resolveButtonColors, type ButtonColor, type ButtonVariant } from './Button.theme'

const LOADER_SIZE = 14

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
  const isLoading = loading === true;

  const loaderStyle = useAnimatedStyle(() => ({
    width: withTiming(isLoading ? LOADER_SIZE : 0),
    marginRight: withTiming(isLoading ? 4 : 0),
    opacity: withTiming(isLoading ? 1 : 0),
  }))

  const scale = useSharedValue(1);

  const fillOpacityValue = (() => {
    if (disabled) return 0.4;
    if (isLoading) return 0.55;
    return 1;
  })()

  const opacityStyle = useAnimatedStyle(() => ({
    opacity: withTiming(fillOpacityValue),
  }))
  const transformStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return (
    <Animated.View
      style={[styles.container, opacityStyle, transformStyle, fullWidth ? styles.fullWidth : styles.contentFit]}
    >
      <Pressable
        disabled={isInactive}
        onPressIn={() => scale.set(withTiming(0.95, { duration: 150 }))}
        onPress={isInactive ? undefined : onPress}
        onPressOut={() => scale.set(withTiming(1, { duration: 150 }))}
        style={[
          styles.button,
          {
            height: dims.height,
            borderRadius: dims.borderRadius,
            paddingHorizontal: dims.paddingHorizontal,
            backgroundColor: colors.backgroundColor,
            borderColor: colors.borderColor,
            borderWidth: colors.borderWidth,
          },
          style,
          fullWidth ? styles.fullWidth : styles.contentFit
        ]}
      >
        {startIcon != null && <Animated.View style={styles.startIcon}>{startIcon}</Animated.View>}
        <Animated.View style={[styles.loader, loaderStyle]}>
          <CircularProgress size={LOADER_SIZE} color={colors.textColor} />
        </Animated.View>
        <Text
          style={[
            styles.label,
            { fontSize: dims.fontSize, color: colors.textColor },
            textStyle,
          ]}
        >
          {children}
        </Text>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  label: {
    fontWeight: '900',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  startIcon: {
    marginRight: 4,
  },
  fullWidth: {
    flex: 1,
    width: '100%',
    alignSelf: 'center'
  },
  contentFit: {
    alignSelf: 'flex-start'
  }
})
