import { StyleSheet } from 'react-native'
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated'
import { GlassSurface } from './GlassSurfaces'
import { useTabNavigationContext } from './TabNavigationContext'
import { TAB_BAR_HEIGHT } from './useTabBarAppearance'

const AnimatedGlassSurface = Animated.createAnimatedComponent(GlassSurface)

// expo-blur 의 intensity 는 CSS 픽셀이 아니라 0~100 스케일이다.
// backdrop-filter: blur(5px) 에 해당하는 체감이 대략 20 전후다.
const CAPSULE_BLUR_INTENSITY = 28
const BURST_BLUR_INTENSITY = 20

// pill 배경이 밝아 굴절만으로는 캡슐 자리가 드러나지 않는다. 옅은 색을 입힌다.
const CAPSULE_TINT = 'rgba(0,0,0,0.09)'

const BURST_SCALE = 1.08

// 버스트가 라벨을 완전히 덮지 않도록 상한을 둔다. 1 이면 아무것도 안 보인다.
const BURST_MAX_OPACITY = 0.4

export const CAPSULE_INSET = 6

// Reanimated 는 한 뷰에 useAnimatedStyle 결과를 하나만 받는다. 배열로 둘을 넘기면
// 뒤엣것이 앞엣것을 덮어써 자리와 크기가 사라진다. opacity 까지 한 번에 계산한다.
function useCapsuleStyle(getOpacity: () => number) {
  const { capsule } = useTabNavigationContext()
  return useAnimatedStyle(() => ({
    opacity: getOpacity(),
    transform: [
      { translateX: capsule.x.get() + CAPSULE_INSET },
      { scale: interpolate(capsule.burst.get(), [0, 1], [1, BURST_SCALE]) },
    ],
    width: Math.max(capsule.width.get() - CAPSULE_INSET * 2, 0),
  }))
}

/** 선택된 탭을 가리키는 유리 캡슐. 항목 뒤에 깔린다. */
export function TabCapsule() {
  const { capsule } = useTabNavigationContext()
  // 캡슐은 apple 에만 있다. 측정 전에는 폭이 0 이라 좌상단에 잔상이 남지 않는다.
  const capsuleStyle = useCapsuleStyle(() => {
    'worklet'
    return capsule.width.get() > 0 ? capsule.variantProgress.get() : 0
  })

  return (
    <AnimatedGlassSurface
      style={[styles.capsule, capsuleStyle]}
      fallbackBlurIntensity={CAPSULE_BLUR_INTENSITY}
      tintColor={CAPSULE_TINT}
      pointerEvents="none"
    />
  )
}

/**
 * 전환 순간 부푼 캡슐이 라벨·아이콘을 덮는 레이어.
 * 항목보다 앞에 있어야 가릴 수 있으므로 TabCapsule 과 따로 둔다.
 */
export function TabCapsuleBurst() {
  const { capsule } = useTabNavigationContext()
  const burstStyle = useCapsuleStyle(() => {
    'worklet'
    return capsule.burst.get() * capsule.variantProgress.get() * BURST_MAX_OPACITY
  })

  return (
    <AnimatedGlassSurface
      style={[styles.capsule, burstStyle]}
      fallbackBlurIntensity={BURST_BLUR_INTENSITY}
      pointerEvents="none"
    />
  )
}

const styles = StyleSheet.create({
  // overflow: hidden 을 주면 UIVisualEffectView 가 클리핑되어 유리가 렌더되지 않는다.
  // borderRadius 는 네이티브가 읽어 처리하므로 실제 높이의 절반을 준다.
  capsule: {
    position: 'absolute',
    left: 0,
    top: CAPSULE_INSET,
    bottom: CAPSULE_INSET,
    borderRadius: (TAB_BAR_HEIGHT.apple - CAPSULE_INSET * 2) / 2,
  },
})
