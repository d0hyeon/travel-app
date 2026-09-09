import type { ReactNode } from 'react'
import { StyleSheet, ActivityIndicator, Pressable, type StyleProp, type TextStyle, type ViewStyle } from 'react-native'
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { palette, radius } from '../../config/tokens'
import { Typography } from './Typography'

// 웹 theme.ts 의 MuiButton size variant 를 모바일 수치로 옮긴다.
const SIZE = {
  small: { height: 24, borderRadius: radius.sm, fontSize: 11, paddingHorizontal: 8 },
  medium: { height: 32, borderRadius: radius.md, fontSize: 13, paddingHorizontal: 12 },
  large: { height: 40, borderRadius: radius.lg, fontSize: 14, paddingHorizontal: 16 },
} as const

const LOADER_GAP = 6

export interface ButtonProps {
  children?: ReactNode
  variant?: 'contained' | 'outlined' | 'text'
  size?: 'small' | 'medium' | 'large'
  color?: 'primary' | 'error' | 'inherit'
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
  const main = color === 'error' ? palette.error : palette.primary
  const isInactive = disabled === true || loading === true
  const textColor = variant === 'contained' ? '#fff' : main

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isInactive ? 0.4 : 1, { duration: 200 }),
  }))

  const loaderSize = dims.fontSize
  const animatedLoaderStyle = useAnimatedStyle(() => ({
    opacity: withTiming(loading === true ? 1 : 0, { duration: 200 }),
    width: withTiming(loading === true ? loaderSize + LOADER_GAP : 0, { duration: 200 }),
  }))

  return (
    <AnimatedPressable
      onPress={isInactive ? undefined : onPress}
      style={[
        [styles.animatedPressable, { height: dims.height, borderRadius: dims.borderRadius, paddingHorizontal: dims.paddingHorizontal, backgroundColor: variant === 'contained' ? main : 'transparent', borderWidth: variant === 'outlined' ? 1 : 0, borderColor: main, ...(fullWidth ? { flex: 1, alignSelf: 'center' } : { alignSelf: 'flex-start' }) }],
        animatedContainerStyle,
        style,
      ]}
    >
      {startIcon}
      <Animated.View style={[styles.view, animatedLoaderStyle]}>
        <ActivityIndicator size="small" color={textColor} />
      </Animated.View>
      <Typography
        style={[
          [styles.typography, { fontSize: dims.fontSize, color: textColor }],
          textStyle,
        ]}
      >
        {children}
      </Typography>
    </AnimatedPressable>
  )
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

const styles = StyleSheet.create({
  view: {
    overflow: 'hidden',
    alignItems: 'center',
  },
  typography: {
    fontWeight: '900',
  },

  animatedPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
})
