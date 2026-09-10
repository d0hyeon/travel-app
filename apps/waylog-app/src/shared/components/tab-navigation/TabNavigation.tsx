import { StyleSheet } from 'react-native'
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
import { TAB_BAR_HEIGHT, useTabBarAppearance } from './useTabBarAppearance'
import type { TabNavigationItemLayout, TabNavigationProps } from './TabNavigation.types'

export function TabNavigation({
  variant,
  value,
  defaultValue,
  onChange,
  onTab,
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
      <Animated.View style={[isApple && styles.floating, shadowStyle]}>
        <TabCapsuleDragArea onFinish={commitSelection} onMove={onTab}>
          <Animated.View style={[styles.container, containerStyle]}>
            <Animated.View style={[styles.gradient, defaultGradientStyle]}>
              <LinearGradient
                colors={[palette.background, '#f4f5f7']}
                style={styles.gradientFill}
              />
            </Animated.View>
            {isApple && <BlurView intensity={80} tint="light" style={styles.blur} />}
            <TabCapsule />
            {children}
            <TabCapsuleBurst />
          </Animated.View>
        </TabCapsuleDragArea>
      </Animated.View>
    </TabNavigationContext.Provider>
  )
}

TabNavigation.Item = TabNavigationItem
TabNavigation.HEIGHT = TAB_BAR_HEIGHT

const styles = StyleSheet.create({
  // 떠 있는 pill 은 scene 위에 얹힌다. 레이아웃 높이를 잡지 않아야
  // 그 아래로 지도·리스트가 바닥까지 이어진다.
  floating: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
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
