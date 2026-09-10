import { MaterialIcons } from '@expo/vector-icons'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import type { StyleProp, ViewStyle } from 'react-native'
import { TabNavigation } from './TabNavigation'
import type { TabNavigationVariant } from './TabNavigation.types'

const ICON_SIZE = 22

// 떠 있는 pill 은 뒤로 화면이 비쳐야 한다. React Navigation 의 기본 scene 배경
// (DefaultTheme.colors.background — rgb(242,242,242)) 이 깔려 있으면 pill 여백이
// 회색 판으로 보인다. Tabs 의 sceneStyle 로 넘겨 걷어낸다.
export const TRANSPARENT_SCENE_STYLE = { backgroundColor: 'transparent' } as const

interface RouterTabNavigationProps extends BottomTabBarProps {
  variant: TabNavigationVariant
  /** 탭바가 놓일 자리. 떠 있는 배치는 소비자가 정한다 */
  style?: StyleProp<ViewStyle>
  /** 하단바에 보일 라우트 이름. 순서도 이 배열을 따른다 */
  visibleNames: string[]
  /** 드래그가 새 탭 위를 지날 때마다 불린다. 화면 전환은 손을 뗄 때 일어난다 */
  onTab?: (name: string) => void
}

export function RouterTabNavigation({
  state,
  descriptors,
  navigation,
  variant,
  visibleNames,
  onTab,
  style,
}: RouterTabNavigationProps) {
  const visibleTabs = visibleNames.flatMap((name) => {
    const route = state.routes.find((candidate) => candidate.name === name)
    const descriptor = route && descriptors[route.key]
    if (!route || !descriptor) return []
    return [{ route, options: descriptor.options }]
  })
  const focusedRoute = state.routes[state.index]

  const handleChange = (name: string) => {
    const target = visibleTabs.find((tab) => tab.route.name === name)
    if (!target) return

    const event = navigation.emit({
      type: 'tabPress',
      target: target.route.key,
      canPreventDefault: true,
    })
    if (event.defaultPrevented) return

    navigation.navigate(name, focusedRoute?.params)
  }

  return (
    <TabNavigation
      variant={variant}
      style={style}
      value={focusedRoute?.name ?? ''}
      onChange={handleChange}
      onTab={onTab}
    >
      {visibleTabs.map(({ route, options }) => (
        <TabNavigation.Item
          key={route.key}
          value={route.name}
          label={options.title ?? route.name}
          icon={({ color, focused }) =>
            options.tabBarIcon?.({ color, focused, size: ICON_SIZE }) ?? (
              <MaterialIcons name="circle" size={ICON_SIZE} color={color} />
            )
          }
        />
      ))}
    </TabNavigation>
  )
}
