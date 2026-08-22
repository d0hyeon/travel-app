import 'react-native-url-polyfill/auto'
import '../src/shared/polyfills'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthStateSync } from '@waylog/domains/clients'
import { Stack } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Suspense } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { setupApi } from '../src/api-config'
import { OverlayProvider } from '../src/shared/hooks/useOverlay.context'
import { useChatNotificationResponse } from '../src/features/trip/trip-chat/notification/useChatNotification'

// 어떤 도메인 모듈보다 먼저 실행되어야 한다.
setupApi()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // RN 에는 window focus 개념이 없다.
      refetchOnWindowFocus: false,
      throwOnError: true,
    },
  },
})

function Loading() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator />
    </View>
  )
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthStateSync />
          <OverlayProvider>
            <Suspense fallback={<Loading />}>
              <ChatNotificationGateway />
              <Stack screenOptions={{ headerShown: false }} />
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
