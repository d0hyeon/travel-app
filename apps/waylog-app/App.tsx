import 'react-native-url-polyfill/auto'

import { AuthStateSync, useAuth } from '@waylog/domains/auth'
import { queryClient } from '@waylog/domains/query'
import { QueryClientProvider } from '@tanstack/react-query'
import { StatusBar } from 'expo-status-bar'
import { Suspense } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { setupApi } from './src/api-config'
import { LoginScreen } from './src/LoginScreen'
import { TripListScreen } from './src/TripListScreen'

// 어떤 도메인 모듈보다 먼저 실행되어야 한다.
setupApi()

function Root() {
  const { data: auth } = useAuth({ required: false })

  return auth == null ? <LoginScreen /> : <TripListScreen />
}

function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator />
    </View>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthStateSync />
      <Suspense fallback={<Loading />}>
        <Root />
      </Suspense>
      <StatusBar style="auto" />
    </QueryClientProvider>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
})
