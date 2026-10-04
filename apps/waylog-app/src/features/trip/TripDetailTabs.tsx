import { MaterialIcons } from '@expo/vector-icons'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { RouterTabNavigation, TRANSPARENT_SCENE_STYLE } from '~shared/components'
import { palette } from '~shared/config/tokens'
import { TripInfoTabScreen } from './trip-basic-info/TripInfoTabScreen'
import { TripPlaceTabScreen } from './trip-place/TripPlaceTabScreen'
import { TripRouteTabScreen } from './trip-route/TripRouteTabScreen'
import { TripExpenseTabScreen } from './trip-expense/TripExpenseTabScreen'
import { TripPhotoTabScreen } from './trip-photo/TripPhotoTabScreen'
import { StyleSheet } from 'react-native'
import type { TripDetailTabParamList } from '~app/routes'

const Tab = createBottomTabNavigator<TripDetailTabParamList>()

interface Props {
  tripId: string
}

export function TripDetailTabs({ tripId }: Props) {
  return (
    <Tab.Navigator
      // 탭은 replace 로 동작한다. 뒤로가기는 직전 탭이 아니라 여행 화면을 벗어난다.
      backBehavior="none"
      tabBar={(props) => (
        <RouterTabNavigation
          {...props}
          variant="apple"
          visibleNames={['TripInfo', 'TripPlace', 'TripRoute', 'TripExpense', 'TripPhoto']}
          style={styles.floatingTabBar}
        />
      )}
      screenOptions={{
        headerShown: false,
        sceneStyle: TRANSPARENT_SCENE_STYLE,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.grey,
      }}
    >
      <Tab.Screen name="TripInfo" component={TripInfoTabScreen} initialParams={{ tripId }} options={{ tabBarIcon: ({ color }) => <MaterialIcons name="info" size={22} color={color} />, title: '정보' }} />
      <Tab.Screen name="TripPlace" component={TripPlaceTabScreen} initialParams={{ tripId }} options={{ tabBarIcon: ({ color }) => <MaterialIcons name="pin-drop" size={22} color={color} />, title: '장소' }} />
      <Tab.Screen name="TripRoute" component={TripRouteTabScreen} initialParams={{ tripId }} options={{ tabBarIcon: ({ color }) => <MaterialIcons name="near-me" size={22} color={color} />, title: '계획' }} />
      <Tab.Screen name="TripExpense" component={TripExpenseTabScreen} initialParams={{ tripId }} options={{ tabBarIcon: ({ color }) => <MaterialIcons name="receipt" size={22} color={color} />, title: '정산' }} />
      <Tab.Screen name="TripPhoto" component={TripPhotoTabScreen} initialParams={{ tripId }} options={{ tabBarIcon: ({ color }) => <MaterialIcons name="photo" size={22} color={color} />, title: '사진' }} />
    </Tab.Navigator>
  )
}

const styles = StyleSheet.create({
  // 탭바가 scene 위에 얹혀야 콘텐츠가 바닥까지 이어진다. 가려지는 높이는
  // 각 화면이 FLOATING_TAB_BAR_RESERVE 로 비운다.
  floatingTabBar: { position: 'absolute', left: 0, right: 0, bottom: 0 },
})
