import type { ReactNode } from 'react'
import { ActivityIndicator, Pressable } from 'react-native'
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { palette, radius } from '../../config/tokens'
import { Typography } from './Typography'
import { sxToStyle, type Sx } from './sx'

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
  onClick?: () => void
  sx?: Sx
  /** 라벨 텍스트에만 적용한다. sx 는 컨테이너로 간다. */
  textSx?: Sx
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
  onClick,
  sx,
  textSx,
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
      onPress={isInactive ? undefined : onClick}
      style={[
        {
          height: dims.height,
          borderRadius: dims.borderRadius,
          paddingHorizontal: dims.paddingHorizontal,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          backgroundColor: variant === 'contained' ? main : 'transparent',
          borderWidth: variant === 'outlined' ? 1 : 0,
          borderColor: main,
          // 부모가 row 면 alignSelf 는 세로 정렬이라 너비가 늘지 않는다.
          // 주축을 채우려면 flex 로 늘린다. 다만 stretch 를 함께 주면
          // 교차축까지 늘어나 지정한 height 를 넘겨 버린다.
          ...(fullWidth ? { flex: 1, alignSelf: 'center' } : { alignSelf: 'flex-start' }),
        },
        animatedContainerStyle,
        sxToStyle(sx),
      ]}
    >
      {startIcon}
      <Animated.View style={[{ overflow: 'hidden', alignItems: 'center' }, animatedLoaderStyle]}>
        <ActivityIndicator size="small" color={textColor} />
      </Animated.View>
      <Typography
        sx={{
          fontSize: dims.fontSize,
          fontWeight: '900',
          color: textColor,
          ...(textSx ?? {}),
        }}
      >
        {children}
      </Typography>
    </AnimatedPressable>
  )
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)
