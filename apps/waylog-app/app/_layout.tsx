import 'react-native-url-polyfill/auto'
import '../src/shared/polyfills'

import { QueryClientProvider } from '@tanstack/react-query'
import { AuthErrorBoundary, AuthStateSync } from '@waylog/domains/clients'
import { getActivedChatTripId } from '@waylog/domains/modules/trip-chat'
import { ExceptionError } from '@waylog/utility'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Suspense, type PropsWithChildren } from 'react'
import { ActivityIndicator, LogBox, StyleSheet, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { TamaguiProvider } from 'tamagui'
import { setupApi } from '../src/api-config'
import { useLoginRedirect } from '../src/features/auth/auth-redirect'
import { isTripChatPushData } from '@waylog/domains/modules/trip-chat/tripChatPush'
import { useChatNotificationResponse } from '../src/features/trip/trip-chat/notification/useChatNotification'
import { useFlightStatusNotificationResponse } from '../src/features/trip/trip-transport/notification/useFlightStatusNotification'
import { OverlayProvider } from '../src/shared/hooks/useOverlay.context'
import { queryClient } from '../src/shared/query-client'
import { tamaguiConfig } from '../tamagui.config'
import * as Notifications from 'expo-notifications'



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

function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator />
    </View>
  )
}

export default function RootLayout() {
  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <GestureHandlerRootView style={styles.fill}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <AuthStateSync />
            <OverlayProvider>
              <Suspense fallback={<Loading />}>
                <NotificationGateway />
                <AuthGateway>
                  <Stack screenOptions={{ headerShown: false }}>
                    {/* 인증 판정 후 곧바로 리다이렉트되는 진입점이다. 전환 애니메이션이 보이면
                          로그인된 사용자도 매번 화면이 한 번 전환되는 것처럼 보인다. */}
                    <Stack.Screen name="index" options={{ animation: 'none' }} />
                  </Stack>
                </AuthGateway>
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
