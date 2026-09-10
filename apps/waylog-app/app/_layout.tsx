import 'react-native-url-polyfill/auto'
import '../src/shared/polyfills'

import { QueryClientProvider } from '@tanstack/react-query'
import { AuthErrorBoundary, AuthStateSync } from '@waylog/domains/clients'
import { router, Stack } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Suspense } from 'react'
import { ActivityIndicator, View, StyleSheet } from 'react-native'
import { setupApi } from '../src/api-config'
import { queryClient } from '../src/shared/query-client'
import { OverlayProvider } from '../src/shared/hooks/useOverlay.context'
import { useChatNotificationResponse } from '../src/features/trip/trip-chat/notification/useChatNotification'

// 어떤 도메인 모듈보다 먼저 실행되어야 한다.
setupApi()

function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator />
    </View>
  )
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.fill}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthStateSync />
          <OverlayProvider>
            <Suspense fallback={<Loading />}>
              <ChatNotificationGateway />
              <AuthErrorBoundary onSessionExpired={() => router.replace('/login')}>
                <Stack screenOptions={{ headerShown: false }}>
                  {/* 인증 판정 후 곧바로 리다이렉트되는 진입점이다. 전환 애니메이션이 보이면
                      로그인된 사용자도 매번 화면이 한 번 전환되는 것처럼 보인다. */}
                  <Stack.Screen name="index" options={{ animation: 'none' }} />
                </Stack>
              </AuthErrorBoundary>
            </Suspense>
          </OverlayProvider>
          <StatusBar style="auto" />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

/** 알림을 탭했을 때 채팅방으로 보낸다. 라우터가 필요해 Stack 안쪽에서 건다. */
function ChatNotificationGateway() {
  useChatNotificationResponse()
  return null
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fill: { flex: 1 },
})
