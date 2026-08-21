import { Children, isValidElement, useEffect, useState, type ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { css } from '@emotion/native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { palette } from '../../config/tokens'
import { Typography } from './Typography'
import { sxToStyle, type Sx } from './sx'

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

export function Tabs({ value, onChange, sx, children }: TabsProps) {
  const tabs = Children.toArray(children)
    .filter(isValidElement<TabProps>)
    .map((child) => child.props)

  const [tabLayouts, setTabLayouts] = useState<Record<string, { x: number; width: number }>>({})
  const indicatorX = useSharedValue(0)
  const indicatorWidth = useSharedValue(0)
  const selectedLayout = tabLayouts[value]

  useEffect(() => {
    if (selectedLayout == null) return
    indicatorX.value = withTiming(selectedLayout.x, { duration: 220 })
    indicatorWidth.value = withTiming(selectedLayout.width, { duration: 220 })
  }, [indicatorWidth, indicatorX, selectedLayout])

  const indicatorStyle = useAnimatedStyle(() => ({
    width: indicatorWidth.value,
    transform: [{ translateX: indicatorX.value }],
  }))

  return (
    <View style={{ width: '100%', borderBottomWidth: 1, borderBottomColor: palette.divider, ...sxToStyle(sx) }}>
      <View style={{ flexDirection: 'row' }}>
        {tabs.map((tab) => {
          const selected = tab.value === value

          return (
            <Pressable
              key={tab.value}
              onPress={() => onChange(null, tab.value)}
              onLayout={(event) => {
                const { x, width } = event.nativeEvent.layout
                setTabLayouts((current) => current[tab.value]?.x === x && current[tab.value]?.width === width ? current : { ...current, [tab.value]: { x, width } })
              }}
              style={{
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 12,
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
    </View>
  )
}
