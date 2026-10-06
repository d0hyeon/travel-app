import { forwardRef } from 'react'
import { StyleSheet, View } from 'react-native'
import { BlurView } from 'expo-blur'
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect'
import type { GlassStyle } from 'expo-glass-effect'
import type { ViewProps } from 'react-native'

// 기기 특성이라 실행 중 바뀌지 않는다. 렌더마다 묻지 않는다.
const supportsLiquidGlass = isLiquidGlassAvailable()

interface GlassSurfaceProps extends ViewProps {
  /** Liquid Glass 를 쓸 수 없는 기기에서 대신 적용할 블러 세기 (0~100) */
  fallbackBlurIntensity: number
  /** 유리에 입히는 색. 배경이 밝아 굴절만으로는 존재가 드러나지 않을 때 준다 */
  tintColor?: string
  /**
   * 유리의 두께감. 유리를 겹칠 때는 아래를 clear, 위를 regular 로 두어야
   * 위쪽 유리의 경계가 아래에 묻히지 않는다.
   */
  glassStyle?: GlassStyle
}

/**
 * 유리 재질 표면. iOS 26 이상에서는 Apple 의 Liquid Glass 를,
 * 그 아래에서는 블러로 대신한다. 위치·크기 애니메이션은 이 컴포넌트를 감싼
 * 쪽이 맡으므로 여기서는 재질만 책임진다.
 */
export const GlassSurface = forwardRef<View, GlassSurfaceProps>(function GlassSurface(
  { fallbackBlurIntensity, tintColor, glassStyle = 'regular', style, children, ...props },
  ref,
) {
  if (supportsLiquidGlass) {
    return (
      <GlassView ref={ref} style={style} glassEffectStyle={glassStyle} tintColor={tintColor} {...props}>
        {children}
      </GlassView>
    )
  }

  // 블러만으로는 존재가 드러나지 않아 옅은 색을 함께 깐다. 소비자가 준
  // tintColor 를 그대로 쓴다 — Liquid Glass 쪽과 같은 색이어야 기기에 따라
  // 밝기가 뒤집히지 않는다. 색을 주지 않았다면 옅은 음영으로 대신한다.
  // Liquid Glass 는 스스로 명암을 만들므로 이 색을 따로 깔지 않는다.
  return (
    <View
      ref={ref}
      style={[style, { backgroundColor: tintColor ?? FALLBACK_SHADE }]}
      {...props}
    >
      <BlurView
        intensity={fallbackBlurIntensity}
        tint="light"
        // Android 는 기본이 'none' 이라 블러 없이 반투명 판만 남는다.
        experimentalBlurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  )
})

const FALLBACK_SHADE = 'rgba(0,0,0,0.08)'
