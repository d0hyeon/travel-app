import { MaterialIcons } from '@expo/vector-icons'
import { createBottomTabNavigator, useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { StyleSheet } from 'react-native'
import { AuthGuard, useAuth } from '@waylog/domains/clients'
import { palette } from '../shared/config/tokens'
import { RequireAuthRedirect } from '../features/auth/auth-redirect'
import { TripListScreen } from '../features/trip/trip-list/TripListScreen'
import { FeedScreen } from '../features/post/FeedScreen'
import { ExplorerCatalogScreen } from '../features/explorer/ExplorerCatalogScreen'
import { UserProfileScreen } from '../features/user-profile/UserProfileScreen'
import type { HomeTabParamList } from './routes'

const Tab = createBottomTabNavigator<HomeTabParamList>()

export function HomeTabs() {
  return (
    <Tab.Navigator
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.textSecondary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="MyTrips"
        options={{ title: '내 여행', tabBarIcon: ({ color, size }) => <MaterialIcons name="luggage" color={color} size={size} /> }}
      >
        {() => (
          <AuthGuard fallback={<RequireAuthRedirect />}>
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
          <AuthGuard fallback={<RequireAuthRedirect />}>
            <ProfileTab />
          </AuthGuard>
        )}
      </Tab.Screen>
    </Tab.Navigator>
  )
}

// 기존 app/(tabs)/explorer.tsx 가 하던 것 그대로 — 탭바 높이를 콘텐츠 바닥 여백으로 넘긴다.
function ExplorerTab() {
  const bottomTabBarHeight = useBottomTabBarHeight()
  return <ExplorerCatalogScreen bottomContentInset={bottomTabBarHeight} />
}

// 기존 app/(tabs)/profile.tsx 가 하던 것 그대로.
function ProfileTab() {
  const { data: auth } = useAuth()
  const bottomTabBarHeight = useBottomTabBarHeight()
  return <UserProfileScreen userId={auth.id} bottomContentInset={bottomTabBarHeight} />
}

const styles = StyleSheet.create({
  tabBar: { height: 84, paddingTop: 8, paddingBottom: 24 },
  tabLabel: { fontSize: 11, fontWeight: '700' },
})
