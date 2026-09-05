import { Children, isValidElement, useCallback, useRef, type ReactNode } from 'react'
import { Pressable, useWindowDimensions, View } from 'react-native'
import { css } from '@emotion/native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { palette } from '../../config/tokens'
import { Typography } from './Typography'
import { sxToStyle, type Sx } from './sx'
import { ScrollView } from 'react-native-gesture-handler'

export interface TabProps {
  value: string
  label: string
}

// 실제 렌더는 Tabs 가 한다. MUI 처럼 선언만 받는다.
export function Tab(_props: TabProps) {
  return null
}

export interface TabsProps {
  value: string
  onChange: (event: unknown, value: string) => void
  children?: ReactNode
  scrollable?: boolean;
  /** MUI variant="fullWidth" 와 같다. 탭이 폭을 균등하게 나눠 가진다 */
  fullWidth?: boolean
  sx?: Sx
}

export function Tabs({
  value,
  onChange,
  scrollable = false,
  fullWidth = false,
  sx,
  children
}: TabsProps) {
  const { width: viewportWidth } = useWindowDimensions()
  const tabs = Children.toArray(children)
    .filter(isValidElement<TabProps>)
    .map((child) => child.props)

  // 탭 위치는 인디케이터를 움직일 때만 쓰고 화면에 그리지 않는다.
  // 상태로 두면 ScrollView 가 자식을 붙이기 전에 온 onLayout 이
  // 아직 마운트되지 않은 컴포넌트를 갱신하려 해 경고가 난다.
  const tabLayouts = useRef<Record<string, { x: number; width: number }>>({})
  const indicatorX = useSharedValue(0)
  const indicatorWidth = useSharedValue(0)

  const moveIndicator = useCallback(
    (tabValue: string) => {
      const layout = tabLayouts.current[tabValue]
      if (layout == null) return
      indicatorX.set(withTiming(layout.x, { duration: 220 }))
      indicatorWidth.set(withTiming(layout.width, { duration: 220 }))
    },
    [indicatorWidth, indicatorX],
  )

  const indicatorStyle = useAnimatedStyle(() => ({
    width: indicatorWidth.value,
    transform: [{ translateX: indicatorX.value }],
  }))

  return (
    <ScrollView
      style={{
        flexGrow: 0, borderBottomWidth: 1, borderBottomColor: palette.divider, ...sxToStyle(sx)
      }}
      horizontal
      showsHorizontalScrollIndicator={false}
      scrollEnabled={scrollable}
      contentContainerStyle={fullWidth ? { flexGrow: 1, minWidth: viewportWidth } : undefined}
    >
      <View style={{ flexDirection: 'row', ...(fullWidth && { flex: 1, minWidth: viewportWidth }) }}>
        {tabs.map((tab) => {
          const selected = tab.value === value

          return (
            <Pressable
              key={tab.value}
              onPress={() => {
                moveIndicator(tab.value)
                onChange(null, tab.value)
              }}
              onLayout={(event) => {
                const { x, width } = event.nativeEvent.layout
                tabLayouts.current[tab.value] = { x, width }
                // 첫 측정 때는 선택된 탭이 아직 자리를 모른다. 측정된 김에 붙인다.
                if (selected) moveIndicator(tab.value)
              }}
              style={{
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 12,
                ...(fullWidth && { flex: 1 }),
              }}
            >
              <Typography
                variant="body2"
                sx={{ color: selected ? palette.primary : palette.textSecondary }}
              >
                {tab.label}
              </Typography>
            </Pressable>
          )
        })}
      </View>
      <Animated.View style={[{ position: 'absolute', bottom: -1, left: 0, height: 3, backgroundColor: palette.primary }, indicatorStyle]} />
    </ScrollView>
  )
}
