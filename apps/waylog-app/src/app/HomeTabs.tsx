import { MaterialIcons } from '@expo/vector-icons'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { StyleSheet } from 'react-native'
import { AuthGuard, useAuth } from '@waylog/domains/clients'
import { palette } from '../shared/config/tokens'
import { RequireAuthRedirect } from '../features/auth/auth-redirect'
import { TripListScreen } from '../features/trip/trip-list/TripListScreen'
import { FeedScreen } from '../features/post/FeedScreen'
import { ExplorerCatalogScreen } from '../features/explorer/ExplorerCatalogScreen'
import { UserProfileScreen } from '../features/user-profile/UserProfileScreen'
import { RouterTabNavigation, TRANSPARENT_SCENE_STYLE, FLOATING_TAB_BAR_RESERVE } from '../shared/components'
import type { HomeTabParamList } from './routes'
import { AppRoute } from './AppRoute'

const Tab = createBottomTabNavigator<HomeTabParamList>()

export function HomeTabs() {
  return (
    <Tab.Navigator
      backBehavior="history"
      tabBar={(props) => (
        <RouterTabNavigation
          {...props}

          visibleNames={['MyTrips', 'Feed', 'Explorer', 'Profile']}
          style={styles.floatingTabBar}
        />
      )}
      screenOptions={{
        headerShown: false,
        sceneStyle: TRANSPARENT_SCENE_STYLE,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.textSecondary,
      }}
    >
      <Tab.Screen
        name="MyTrips"
        options={{ title: '내 여행', tabBarIcon: ({ color, size }) => <MaterialIcons name="luggage" color={color} size={size} /> }}
      >
        {() => (
          <AuthGuard fallback={<RequireAuthRedirect returnTo={{ screen: AppRoute.메인 }} />}>
            <TripListScreen />
          </AuthGuard>
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{ title: '피드', tabBarIcon: ({ color, size }) => <MaterialIcons name="dynamic-feed" color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Explorer"
        options={{ title: '탐색', tabBarIcon: ({ color, size }) => <MaterialIcons name="explore" color={color} size={size} /> }}
      >
        {() => <ExplorerTab />}
      </Tab.Screen>
      <Tab.Screen
        name="Profile"
        options={{ title: '프로필', tabBarIcon: ({ color, size }) => <MaterialIcons name="person-outline" color={color} size={size} /> }}
      >
        {() => (
          <AuthGuard fallback={<RequireAuthRedirect returnTo={{ screen: AppRoute.메인 }} />}>
            <ProfileTab />
          </AuthGuard>
        )}
      </Tab.Screen>
    </Tab.Navigator>
  )
}

// 기존 app/(tabs)/explorer.tsx 가 하던 것 그대로 — 탭바 높이를 콘텐츠 바닥 여백으로 넘긴다.
function ExplorerTab() {
  return <ExplorerCatalogScreen bottomContentInset={FLOATING_TAB_BAR_RESERVE} />
}

// 기존 app/(tabs)/profile.tsx 가 하던 것 그대로.
function ProfileTab() {
  const { data: auth } = useAuth()
  return <UserProfileScreen userId={auth.id} bottomContentInset={FLOATING_TAB_BAR_RESERVE} />
}

const styles = StyleSheet.create({
  // 탭바가 scene 위에 얹혀야 콘텐츠가 바닥까지 이어진다. 가려지는 높이는
  // 각 화면이 FLOATING_TAB_BAR_RESERVE 로 비운다.
  floatingTabBar: { position: 'absolute', left: 0, right: 0, bottom: 0 },
})
