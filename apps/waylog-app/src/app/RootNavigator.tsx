import 'react-native-url-polyfill/auto'
import '~shared/polyfills'

import { NavigationContainer, type LinkingOptions } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthErrorBoundary, AuthStateSync, SignUpGate } from '@waylog/domains/clients'
import { getActivedChatTripId } from '@waylog/domains/modules/trip-chat'
import { isTripChatPushData } from '@waylog/domains/modules/trip-chat/tripChatPush'
import { AppRoute as BaseAppRoute } from '@waylog/routes'
import { ExceptionError } from '@waylog/utility'
import * as Notifications from 'expo-notifications'
import { StatusBar } from 'expo-status-bar'
import { Suspense, type PropsWithChildren } from 'react'
import { ActivityIndicator, LogBox, StyleSheet, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { TamaguiProvider } from 'tamagui'
import { tamaguiConfig } from '../../tamagui.config'
import { setupApi } from '~api-config'
import { LoginRoute } from '~features/auth/LoginRoute'
import { SignUpConsentScreen } from '~features/auth/SignUpConsentScreen'
import { useLoginRedirect, type ReturnTo } from '~features/auth/auth-redirect'
import { PlaceDetailScreen } from '~features/explorer/PlaceDetailScreen'
import { TopVisitedScreen } from '~features/explorer/explorer-ranking/TopVisitedScreen'
import { RecentHotScreen } from '~features/explorer/explorer-recent/RecentHotScreen'
import { MostSavedScreen } from '~features/explorer/explorer-saved/MostSavedScreen'
import { PostCreationScreen } from '~features/post/PostCreationScreen'
import { PostDetailScreen } from '~features/post/PostDetailScreen'
import { SettingsScreen } from '~features/settings/SettingsScreen'
import { TripDetailScreen } from '~features/trip/TripDetailScreen'
import { useChatNotificationResponse } from '~features/trip/trip-chat/notification/useChatNotification'
import { TripCreateScreen } from '~features/trip/trip-create/TripCreateScreen'
import { TripInviteScreen } from '~features/trip/trip-invite/TripInviteScreen'
import { TripMemoDetailScreen } from '~features/trip/trip-memo/TripMemoDetailScreen'
import { TripMemoEditScreen } from '~features/trip/trip-memo/TripMemoEditScreen'
import { TransportCreationScreen } from '~features/trip/trip-transport/TransportCreationScreen'
import { useFlightStatusNotificationResponse } from '~features/trip/trip-transport/notification/useFlightStatusNotification'
import { TransportDetailScreen } from '~features/trip/trip-transport/transport-detail/TransportDetailScreen'
import { UserProfileDetailScreen } from '~features/user-profile/UserProfileDetailScreen'
import { ToastRenderer } from '~shared/components/toast/ToastRenderer'
import { OverlayProvider } from '~shared/hooks/useOverlay.context'
import { queryClient } from '~shared/query-client'
import { AppRoute } from './AppRoute'
import { HomeTabs } from './HomeTabs'
import { AppBootstrap } from './bootstrap/AppBootstrap'
import { registerLinkingScreens } from './registerLinkingScreens'
import type { RootStackParamList } from './routes'
import { AccountSettingScreen } from '~features/settings/AccountSettingScreen';
import { BlockedUsersScreen } from '~features/settings/BlockedUsersScreen'

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

declare module '~app/routes' {
  interface RouteParamsRegistry {
    [AppRoute.메인]: undefined
    [AppRoute.로그인]: { returnTo?: ReturnTo }
    [AppRoute.설정]: undefined
  }
}

const RootStack = createNativeStackNavigator<RootStackParamList>()

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['waylog://', 'https://waylog.me', 'https://www.waylog.me'],
  config: {
    initialRouteName: AppRoute.메인,
    screens: registerLinkingScreens([BaseAppRoute.메인, BaseAppRoute.여행_초대]),
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
          <AppBootstrap>
            <QueryClientProvider client={queryClient}>
              <AuthStateSync />
              <OverlayProvider>
                <Suspense fallback={<Loading />}>
                  <NavigationContainer linking={linking}>
                    <NotificationGateway />
                    <SignUpGate fallback={<SignUpConsentScreen />}>
                    <AuthGuard>
                      <RootStack.Navigator screenOptions={{ headerShown: false }}>
                        <RootStack.Screen name={AppRoute.메인} component={HomeTabs} options={{ animation: 'none' }} />
                        <RootStack.Screen name={AppRoute.로그인} component={LoginRoute} />
                        <RootStack.Screen
                          name={AppRoute.여행_상세}
                          component={TripDetailScreen}
                          getId={({ params }) => params.tripId}
                        />
                        <RootStack.Screen name={AppRoute.여행_메모_상세} component={TripMemoDetailScreen} />
                        <RootStack.Screen name={AppRoute.여행_메모_편집} component={TripMemoEditScreen} />
                        <RootStack.Screen name={AppRoute.여행_생성} component={TripCreateScreen} />
                        <RootStack.Screen name={AppRoute.여행_초대} component={TripInviteScreen} />
                        <RootStack.Screen name={AppRoute.장소_상세} component={PlaceDetailScreen} />
                        <RootStack.Screen name={AppRoute.장소_최다방문순} component={TopVisitedScreen} />
                        <RootStack.Screen name={AppRoute.장소_급상승} component={RecentHotScreen} />
                        <RootStack.Screen name={AppRoute.장소_저장순} component={MostSavedScreen} />
                        <RootStack.Screen name={AppRoute.포스트_생성} component={PostCreationScreen} />
                        <RootStack.Screen name={AppRoute.포스트_상세} component={PostDetailScreen} />
                        <RootStack.Screen name={AppRoute.유저_프로필} component={UserProfileDetailScreen} />
                        <RootStack.Screen name={AppRoute.설정} component={SettingsScreen} />
                        <RootStack.Screen name={AppRoute.계정_설정} component={AccountSettingScreen} />
                        <RootStack.Screen name={AppRoute.차단_목록} component={BlockedUsersScreen} />
                        <RootStack.Screen name={AppRoute.여행_교통편_추가} component={TransportCreationScreen} />
                        <RootStack.Screen name={AppRoute.여행_교통편_상세} component={TransportDetailScreen} />
                      </RootStack.Navigator>
                    </AuthGuard>
                    </SignUpGate>
                  </NavigationContainer>
                </Suspense>
              </OverlayProvider>
              <ToastRenderer />
              <StatusBar style="auto" />
            </QueryClientProvider>
          </AppBootstrap>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </TamaguiProvider>
  )
}

/** 세션이 만료되면 돌아올 자리를 들고 로그인으로 보낸다. */
function AuthGuard({ children }: PropsWithChildren) {
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
