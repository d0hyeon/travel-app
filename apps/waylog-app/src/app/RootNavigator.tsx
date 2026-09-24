import 'react-native-url-polyfill/auto'
import '../shared/polyfills'

import { NavigationContainer } from '@react-navigation/native'
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
import { NotYetMigratedScreen } from './NotYetMigratedScreen'

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
                <NotificationGateway />
                <NavigationContainer>
                  <AuthGateway>
                    <RootStack.Navigator screenOptions={{ headerShown: false }}>
                      <RootStack.Screen name="Home" component={HomeTabs} options={{ animation: 'none' }} />
                      <RootStack.Screen name="Login" component={LoginRoute} />
                      {/* Task 5, 6에서 하나씩 실제 스크린으로 교체되며 이 배열에서 빠진다. */}
                      <RootStack.Screen name="TripDetail" component={NotYetMigratedScreen} />
                      <RootStack.Screen name="TripDetailChecklist" component={NotYetMigratedScreen} />
                      <RootStack.Screen name="TripMemoDetail" component={NotYetMigratedScreen} />
                      <RootStack.Screen name="TripMemoEdit" component={NotYetMigratedScreen} />
                      <RootStack.Screen name="TripCreate" component={NotYetMigratedScreen} />
                      <RootStack.Screen name="TripInvite" component={NotYetMigratedScreen} />
                      <RootStack.Screen name="ExplorerDetail" component={NotYetMigratedScreen} />
                      <RootStack.Screen name="ExplorerTopVisited" component={NotYetMigratedScreen} />
                      <RootStack.Screen name="ExplorerRecentHot" component={NotYetMigratedScreen} />
                      <RootStack.Screen name="ExplorerMostSaved" component={NotYetMigratedScreen} />
                      <RootStack.Screen name="PostNew" component={NotYetMigratedScreen} />
                      <RootStack.Screen name="PostDetail" component={NotYetMigratedScreen} />
                      <RootStack.Screen name="UserProfile" component={NotYetMigratedScreen} />
                      <RootStack.Screen name="TransportNew" component={NotYetMigratedScreen} />
                      <RootStack.Screen name="TransportDetail" component={NotYetMigratedScreen} />
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
