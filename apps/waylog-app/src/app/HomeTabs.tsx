import { MaterialIcons } from '@expo/vector-icons'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import { PropsWithChildren, Suspense } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { AuthGuard, useAuth } from '@waylog/domains/clients'
import { LoginScreen } from '../features/auth/LoginScreen'
import { TripListScreen } from '../features/trip/trip-list/TripListScreen'
import { GuestTripsScreen } from '../features/trip/trip-list/GuestTripsScreen'
import { FeedScreen } from '../features/post/FeedScreen'
import { ExplorerCatalogScreen } from '../features/explorer/ExplorerCatalogScreen'
import { UserProfileScreen } from '../features/user-profile/UserProfileScreen'
import { RouterTabNavigation, TRANSPARENT_SCENE_STYLE, FLOATING_TAB_BAR_RESERVE, TabNavigation } from '../shared/components'
import type { HomeTabParamList } from './routes'
import { palette } from '~shared/config/tokens'

const Tab = createMaterialTopTabNavigator<HomeTabParamList>()

export function HomeTabs() {
  const { data: auth } = useAuth({ required: false })
  const isSignedIn = auth != null

  return (
    <Tab.Navigator
      backBehavior="history"
      tabBarPosition="bottom"
      tabBar={(props) => (
        <RouterTabNavigation
          {...props}
          visibleNames={['MyTrips', 'Feed', 'Explorer', 'Profile']}
          style={styles.floatingTabBar}
        />
      )}
      screenOptions={{
        lazy: true,
        sceneStyle: TRANSPARENT_SCENE_STYLE,
      }}
    >
      <Tab.Screen
        name="MyTrips"
        options={{ title: '내 여행', tabBarIcon: ({ color }) => <MaterialIcons name="luggage" color={color} size={22} /> }}
      >
        {() => (
          <ScreenLayout>
            <TabSuspense>
              <AuthGuard fallback={<GuestTripsScreen />}>
                <TripListScreen />
              </AuthGuard>
            </TabSuspense>
          </ScreenLayout>
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Feed"
        component={() => (
          <ScreenLayout>
            <FeedScreen />
          </ScreenLayout>
        )}
        options={{ title: '피드', tabBarIcon: ({ color }) => <MaterialIcons name="dynamic-feed" color={color} size={22} /> }}
      />
      <Tab.Screen
        name="Explorer"
        options={{ title: '탐색', tabBarIcon: ({ color }) => <MaterialIcons name="explore" color={color} size={22} /> }}
      >
        {() => (
          <ScreenLayout>
            <TabSuspense>
              <ExplorerTab />
            </TabSuspense>
          </ScreenLayout>
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Profile"
        options={{
          title: isSignedIn ? '프로필' : '로그인',
          tabBarIcon: ({ color }) => <MaterialIcons name={isSignedIn ? 'person-outline' : 'login'} color={color} size={22} />,
        }}
      >
        {() => (
          <ScreenLayout>
            <TabSuspense>
              <AuthGuard fallback={<LoginScreen bottomContentInset={0} />}>
                <ProfileTab />
              </AuthGuard>
            </TabSuspense>
          </ScreenLayout>
        )}
      </Tab.Screen>
    </Tab.Navigator>
  )
}

function TabSuspense({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <View style={styles.loading}>
          <ActivityIndicator />
        </View>
      }
    >
      {children}
    </Suspense>
  )
}

function ScreenLayout({ children }: PropsWithChildren) {
  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      {children}
    </SafeAreaView>
  )
}

function ExplorerTab() {
  return <ExplorerCatalogScreen />
}

function ProfileTab() {
  const { data: auth } = useAuth({ required: true })
  return <UserProfileScreen userId={auth.id} />
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingBottom: TabNavigation.HEIGHT.default, backgroundColor: palette.background },
  floatingTabBar: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
})

