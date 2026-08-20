import { Children, isValidElement, useEffect, useState, type ReactNode } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { palette } from '../../config/tokens'
import { Typography } from './Typography'
import type { Sx } from './sx'

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
  sx?: Sx
}

interface TabLayout {
  x: number
  width: number
}

export function Tabs({ value, onChange, children }: TabsProps) {
  const tabs = Children.toArray(children)
    .filter(isValidElement<TabProps>)
    .map((child) => child.props)

  const [layouts, setLayouts] = useState<Record<string, TabLayout>>({})

  const offset = useSharedValue(0)
  const width = useSharedValue(0)

  const active = layouts[value]

  // 선택된 탭 아래로 표시선을 옮긴다.
  useEffect(() => {
    if (active == null) return
    offset.value = withTiming(active.x, { duration: 220 })
    width.value = withTiming(active.width, { duration: 220 })
  }, [active?.x, active?.width])

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
    width: width.value,
  }))

  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: palette.divider }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
        {tabs.map((tab) => {
          const selected = tab.value === value

          return (
            <Pressable
              key={tab.value}
              onPress={() => onChange(null, tab.value)}
              onLayout={(event) => {
                const { x, width: tabWidth } = event.nativeEvent.layout
                setLayouts((curr) =>
                  curr[tab.value]?.x === x && curr[tab.value]?.width === tabWidth
                    ? curr
                    : { ...curr, [tab.value]: { x, width: tabWidth } },
                )
              }}
              style={{ paddingHorizontal: 16, paddingVertical: 12 }}
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
      </ScrollView>

      <Animated.View
        style={[
          { position: 'absolute', bottom: 0, height: 2, backgroundColor: palette.primary },
          indicatorStyle,
        ]}
      />
    </View>
  )
}
