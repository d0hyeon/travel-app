import { MaterialIcons } from '@expo/vector-icons'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { useEffect } from 'react'
import { Pressable, useWindowDimensions, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { palette } from '../config/tokens'
import { Typography } from './mui'

// 하단바에 활성 표시선을 두고 탭 전환 시 좌우로 움직인다.
interface Props extends BottomTabBarProps {
  /** 하단바에 보일 라우트 이름. 순서도 이 배열을 따른다 */
  visibleNames: string[]
}

export function AnimatedTabBar({ state, descriptors, navigation, visibleNames }: Props) {
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()

  // 하단바에 노출할 탭만 소비자가 정한다. 숨김 화면까지 그리지 않는다.
  const routes = state.routes.filter((route) => visibleNames.includes(route.name))
  const tabWidth = width / Math.max(routes.length, 1)
  const activeIndex = routes.findIndex((route) => route.key === state.routes[state.index]?.key)

  const offset = useSharedValue(0)

  useEffect(() => {
    if (activeIndex >= 0) offset.value = withTiming(activeIndex * tabWidth, { duration: 220 })
  }, [activeIndex, tabWidth])

  const indicatorStyle = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }))

  return (
    <View
      style={{
        flexDirection: 'row',
        paddingBottom: insets.bottom,
        backgroundColor: palette.background,
        borderTopWidth: 1,
        borderTopColor: palette.divider,
      }}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            width: tabWidth,
            height: 2,
            backgroundColor: palette.primary,
          },
          indicatorStyle,
        ]}
      />

      {routes.map((route) => {
        const { options } = descriptors[route.key]!
        const isFocused = state.routes[state.index]?.key === route.key
        const color = isFocused ? palette.primary : palette.grey

        return (
          <Pressable
            key={route.key}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              })
              if (!isFocused && !event.defaultPrevented) {
                const currentRoute = state.routes[state.index]
                navigation.navigate(route.name, currentRoute.params)
              }
            }}
            style={{ width: tabWidth, alignItems: 'center', paddingVertical: 8, gap: 2 }}
          >
            {options.tabBarIcon?.({ focused: isFocused, color, size: 22 }) ?? (
              <MaterialIcons name="circle" size={22} color={color} />
            )}
            <Typography sx={{ fontSize: 11, color }}>{options.title ?? route.name}</Typography>
          </Pressable>
        )
      })}
    </View>
  )
}
