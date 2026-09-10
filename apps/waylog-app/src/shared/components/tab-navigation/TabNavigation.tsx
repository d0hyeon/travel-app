import { StyleSheet, View } from 'react-native'
import { useEffect, useState } from 'react'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import Animated from 'react-native-reanimated'
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics'
import { palette } from '../../config/tokens'
import { TabNavigationContext } from './TabNavigationContext'
import { TabNavigationItem } from './TabNavigationItem'
import { TabCapsule, TabCapsuleBurst } from './TabCapsule'
import { TabCapsuleDragArea } from './TabCapsuleDragArea'
import { useItemLayouts } from './useItemLayouts'
import { useTabCapsuleState } from './useTabCapsuleState'
import { FLOATING_MARGIN, TAB_BAR_HEIGHT, useTabBarAppearance } from './useTabBarAppearance'
import type { TabNavigationItemLayout, TabNavigationProps } from './TabNavigation.types'

export function TabNavigation({
  variant,
  value,
  defaultValue,
  onChange,
  onTab,
  style,
  children,
}: TabNavigationProps) {
  const { isApple, variantProgress, shadowStyle, containerStyle, defaultGradientStyle } =
    useTabBarAppearance(variant)
  const [uncontrolledKey, setUncontrolledKey] = useState(defaultValue ?? '')
  const activeKey = value ?? uncontrolledKey

  const { reportLayout, findLayout, orderedSlots } = useItemLayouts()
  const { capsule, moveTo } = useTabCapsuleState(variantProgress)

  const commitSelection = (key: string) => {
    setUncontrolledKey(key)
    onChange?.(key)
  }

  // 탭을 눌러 고르는 경로. 드래그는 지나가며 이미 울리므로 이쪽을 쓰지 않는다.
  const handleSelect = (key: string) => {
    // 이미 선택된 탭을 다시 눌러도 울리면 손끝에 노이즈가 된다.
    if (key !== activeKey) impactAsync(ImpactFeedbackStyle.Light).catch(() => { })
    commitSelection(key)
  }

  const reportItemLayout = (key: string, layout: TabNavigationItemLayout) => {
    reportLayout(key, layout)
    if (key === activeKey) moveTo(layout)
  }

  // 소비자가 value 로 탭을 바꾼 경우. 항목 측정이 끝난 뒤라면 캡슐이 따라간다.
  useEffect(() => {
    const layout = findLayout(activeKey)
    if (layout) moveTo(layout)
  }, [activeKey, findLayout, moveTo])

  return (
    <TabNavigationContext.Provider
      value={{ activeKey, variant, onSelect: handleSelect, reportItemLayout, capsule, orderedSlots }}
    >
      <View style={style} pointerEvents="box-none">
        {isApple && <FloatingGapHalo />}
        <Animated.View style={shadowStyle}>
          <TabCapsuleDragArea onFinish={commitSelection} onMove={onTab}>
            <Animated.View style={[styles.container, containerStyle]}>
              <Animated.View style={[styles.gradient, defaultGradientStyle]}>
                <LinearGradient
                  colors={[palette.background, '#f4f5f7']}
                  style={styles.gradientFill}
                />
              </Animated.View>
              {isApple && (
                <BlurView
                  intensity={40}
                  tint="light"
                  // Android 는 기본이 'none' 이라 블러 없이 반투명 판만 남는다.
                  experimentalBlurMethod="dimezisBlurView"
                  style={styles.blur}
                />
              )}
              <TabCapsule />
              {children}
              <TabCapsuleBurst />
            </Animated.View>
          </TabCapsuleDragArea>
        </Animated.View>
      </View>
    </TabNavigationContext.Provider>
  )
}

/**
 * pill 아래로 드리워지는 블러. pill 이 화면 바닥에서 떠 있어 그 틈으로
 * 콘텐츠가 그대로 비치는데, 균일한 블러 한 장을 깔면 블러의 경계선이
 * 그대로 보여 판을 덧댄 것처럼 읽힌다.
 *
 * 그래서 그림자와 같은 방식을 쓴다. pill 경계에서 조금씩 더 바깥까지
 * 번지는 레이어를 겹치되 멀어질수록 흐림과 불투명도를 함께 낮춘다.
 * 겹친 세기가 합산되어 pill 경계에서 바깥으로 연속적으로 감쇠한다.
 *
 * 위로는 번지지 않는다. pill 위는 스크롤 콘텐츠가 지나가는 자리라
 * 흐림이 올라오면 읽던 것이 가려진다. 아래로는 좌우보다 넉넉히 뻗어
 * 빛을 위에서 받은 그림자처럼 보이게 한다.
 */
function FloatingGapHalo() {
  return (
    <View style={styles.halo} pointerEvents="none">
      {HALO_LAYERS.map(({ sideSpread, bottomSpread, blurIntensity, opacity }) => (
        <BlurView
          key={sideSpread}
          intensity={blurIntensity}
          tint="light"
          // Android 는 기본이 'none' 이라 블러 없이 반투명 판만 남는다.
          experimentalBlurMethod="dimezisBlurView"
          style={[
            styles.haloLayer,
            {
              opacity,
              left: FLOATING_MARGIN.side - sideSpread,
              right: FLOATING_MARGIN.side - sideSpread,
              bottom: FLOATING_MARGIN.bottom - bottomSpread,
              borderRadius: TAB_BAR_HEIGHT.apple / 2 + sideSpread,
            },
          ]}
        />
      ))}
    </View>
  )
}

TabNavigation.Item = TabNavigationItem
TabNavigation.HEIGHT = TAB_BAR_HEIGHT

/**
 * pill 경계에서 바깥으로 번지는 블러 레이어. spread 가 커질수록 흐림과
 * 불투명도를 함께 낮춰 멀어질수록 존재가 사라지게 한다. 첫 레이어의
 * spread 를 0 으로 두어 pill 경계에 빈 틈이 생기지 않게 한다.
 *
 * 아래쪽이 좌우보다 훨씬 멀리 뻗는다. 위에서 빛을 받아 아래로 드리워진
 * 그림자 모양이 된다. bottomSpread 가 아래 여백(24)을 넘는 레이어는
 * 화면 밖으로 나가 잘리는데, 그래야 바닥에 닿기 전에 감쇠가 끝나지 않고
 * 여백 전체가 그라디언트로 채워진다.
 */
const HALO_LAYERS = [
  { sideSpread: 0, bottomSpread: 0, blurIntensity: 26, opacity: 1 },
  { sideSpread: 3, bottomSpread: 12, blurIntensity: 22, opacity: 0.8 },
  { sideSpread: 6, bottomSpread: 22, blurIntensity: 18, opacity: 0.62 },
  { sideSpread: 9, bottomSpread: 30, blurIntensity: 14, opacity: 0.46 },
  { sideSpread: 12, bottomSpread: 38, blurIntensity: 10, opacity: 0.32 },
  { sideSpread: 14, bottomSpread: 44, blurIntensity: 6, opacity: 0.2 },
  { sideSpread: 16, bottomSpread: 48, blurIntensity: 3, opacity: 0.1 },
] as const

const styles = StyleSheet.create({
  halo: {
    position: 'absolute',
    inset: 0,
  },
  // top 을 pill 상단에 고정한다. 아래로만 자라므로 스크롤 콘텐츠를 덮지 않는다.
  haloLayer: {
    position: 'absolute',
    top: 0,
    overflow: 'hidden',
  },
  container: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  gradient: {
    position: 'absolute',
    inset: 0,
  },
  gradientFill: {
    flex: 1,
  },
  blur: {
    position: 'absolute',
    inset: 0,
  },
})
