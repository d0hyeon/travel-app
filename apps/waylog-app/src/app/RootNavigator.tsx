import 'react-native-url-polyfill/auto'
import '../shared/polyfills'

import { NavigationContainer, type LinkingOptions } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthErrorBoundary, AuthStateSync } from '@waylog/domains/clients'
import { getActivedChatTripId } from '@waylog/domains/modules/trip-chat'
import { isTripChatPushData } from '@waylog/domains/modules/trip-chat/tripChatPush'
import { ExceptionError } from '@waylog/utility'
import * as Notifications from 'expo-notifications'
import { StatusBar } from 'expo-status-bar'
import { Suspense, type PropsWithChildren } from 'react'
import { ActivityIndicator, LogBox, StyleSheet, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { TamaguiProvider } from 'tamagui'
import { setupApi } from '../api-config'
import { LoginRoute } from '../features/auth/LoginRoute'
import { useLoginRedirect } from '../features/auth/auth-redirect'
import { useChatNotificationResponse } from '../features/trip/trip-chat/notification/useChatNotification'
import { useFlightStatusNotificationResponse } from '../features/trip/trip-transport/notification/useFlightStatusNotification'
import { OverlayProvider } from '../shared/hooks/useOverlay.context'
import { queryClient } from '../shared/query-client'
import { tamaguiConfig } from '../../tamagui.config'
import type { RootStackParamList } from './routes'
import { HomeTabs } from './HomeTabs'
import { TripDetailScreen } from '../features/trip/TripDetailScreen'
import { TripDetailChecklistScreen } from '../features/trip/trip-checklist/TripDetailChecklistScreen'
import { TripMemoDetailScreen } from '../features/trip/trip-memo/TripMemoDetailScreen'
import { TripMemoEditScreen } from '../features/trip/trip-memo/TripMemoEditScreen'
import { TripCreateScreen } from '../features/trip/trip-create/TripCreateScreen'
import { TripInviteScreen } from '../features/trip/trip-invite/TripInviteScreen'
import { PlaceDetailScreen } from '../features/explorer/PlaceDetailScreen'
import { TopVisitedScreen } from '../features/explorer/explorer-ranking/TopVisitedScreen'
import { RecentHotScreen } from '../features/explorer/explorer-recent/RecentHotScreen'
import { MostSavedScreen } from '../features/explorer/explorer-saved/MostSavedScreen'
import { PostCreationScreen } from '../features/post/PostCreationScreen'
import { PostDetailScreen } from '../features/post/PostDetailScreen'
import { UserProfileDetailScreen } from '../features/user-profile/UserProfileDetailScreen'
import { TransportCreationScreen } from '../features/trip/trip-transport/TransportCreationScreen'
import { TransportDetailScreen } from '../features/trip/trip-transport/transport-detail/TransportDetailScreen'

setupApi()
LogBox.ignoreLogs([ExceptionError.name])
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const tripMessage = notification.request.content.data
    const isActiveTripMessage = isTripChatPushData(tripMessage)
      && tripMessage.tripId === getActivedChatTripId()
    const shouldPresent = !isActiveTripMessage

    return {
      shouldShowBanner: shouldPresent,
      shouldShowList: shouldPresent,
      shouldPlaySound: shouldPresent,
      shouldSetBadge: false,
    }
  },
})

const RootStack = createNativeStackNavigator<RootStackParamList>()

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['waylog://', 'https://waylog.me', 'https://www.waylog.me'],
  config: {
    // 콜드 스타트로 딥링크가 열려도 스택 맨 아래에 Home을 깔아둔다. 없으면 스택이
    // TripInvite 하나뿐이라 뒤로가기·초대 참여 후 replace가 갈 곳을 잃는다.
    initialRouteName: 'Home',
    screens: {
      Home: '',
      TripInvite: 'trip/invite/:shareLink',
    },
  },
}

function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator />
    </View>
  )
}

export function RootNavigator() {
  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <GestureHandlerRootView style={styles.fill}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <AuthStateSync />
            <OverlayProvider>
              <Suspense fallback={<Loading />}>
                <NavigationContainer linking={linking}>
                  <NotificationGateway />
                  <AuthGateway>
                    <RootStack.Navigator screenOptions={{ headerShown: false }}>
                      <RootStack.Screen name="Home" component={HomeTabs} options={{ animation: 'none' }} />
                      <RootStack.Screen name="Login" component={LoginRoute} />
                      <RootStack.Screen
                        name="TripDetail"
                        component={TripDetailScreen}
                        // tripId 가 다르면 같은 이름의 라우트를 재사용하지 않고 새로 만든다.
                        // 재사용되면 이미 마운트된 탭들이 이전 tripId의 initialParams를 그대로
                        // 들고 있어, 헤더는 새 여행을 보여줘도 탭은 이전 여행에 머문다.
                        getId={({ params }) => params.tripId}
                      />
                      <RootStack.Screen name="TripDetailChecklist" component={TripDetailChecklistScreen} />
                      <RootStack.Screen name="TripMemoDetail" component={TripMemoDetailScreen} />
                      <RootStack.Screen name="TripMemoEdit" component={TripMemoEditScreen} />
                      <RootStack.Screen name="TripCreate" component={TripCreateScreen} />
                      <RootStack.Screen name="TripInvite" component={TripInviteScreen} />
                      <RootStack.Screen name="ExplorerDetail" component={PlaceDetailScreen} />
                      <RootStack.Screen name="ExplorerTopVisited" component={TopVisitedScreen} />
                      <RootStack.Screen name="ExplorerRecentHot" component={RecentHotScreen} />
                      <RootStack.Screen name="ExplorerMostSaved" component={MostSavedScreen} />
                      <RootStack.Screen name="PostNew" component={PostCreationScreen} />
                      <RootStack.Screen name="PostDetail" component={PostDetailScreen} />
                      <RootStack.Screen name="UserProfile" component={UserProfileDetailScreen} />
                      <RootStack.Screen name="TransportNew" component={TransportCreationScreen} />
                      <RootStack.Screen name="TransportDetail" component={TransportDetailScreen} />
                    </RootStack.Navigator>
                  </AuthGateway>
                </NavigationContainer>
              </Suspense>
            </OverlayProvider>
            <StatusBar style="auto" />
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </TamaguiProvider>
  )
}

/** 세션이 만료되면 돌아올 자리를 들고 로그인으로 보낸다. */
function AuthGateway({ children }: PropsWithChildren) {
  const redirectToLogin = useLoginRedirect()

  return <AuthErrorBoundary onSessionExpired={redirectToLogin}>{children}</AuthErrorBoundary>
}

/** 알림 도메인별 응답 처리를 루트에서 함께 등록한다. */
function NotificationGateway() {
  useChatNotificationResponse()
  useFlightStatusNotificationResponse()
  return null
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fill: { flex: 1 },
})
