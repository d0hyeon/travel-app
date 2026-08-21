import { MaterialIcons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import { AnimatedTabBar } from '../../../src/shared/components/AnimatedTabBar'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { palette } from '../../../src/shared/config/tokens'
import { ErrorBoundary } from '../../../src/shared/components/ErrorBoundary'
import { Button, Stack, Typography } from '../../../src/shared/components/mui'
import { View } from 'react-native'

// 웹 TripDetailPage.mobile 의 BottomNavigation 구성을 그대로 승계한다.
// 정보 · 장소 · 계획 · 정산 · 사진
export default function TripDetailLayout() {
  const insets = useSafeAreaInsets()

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <ErrorBoundary
          fallback={(retry) => (
            <Stack sx={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
              <Typography color="text.secondary">여행 정보를 불러오지 못했어요</Typography>
              <Button variant="contained" onClick={retry} sx={{ marginTop: 12 }}>다시 시도</Button>
            </Stack>
          )}
        >
          <Tabs
            tabBar={(props) => (
              <AnimatedTabBar
                {...props}
                visibleNames={['index', 'place', 'route', 'expense', 'photo']}
              />
            )}
            screenOptions={{
              headerShown: false,
              sceneStyle: { paddingTop: insets.top },
              tabBarActiveTintColor: palette.primary,
              tabBarInactiveTintColor: palette.grey,
            }}
          >
            <Tabs.Screen name="index" options={{ tabBarIcon: ({ color }) => <MaterialIcons name="info" size={22} color={color} />, title: '정보' }} />
            <Tabs.Screen name="place" options={{ tabBarIcon: ({ color }) => <MaterialIcons name="pin-drop" size={22} color={color} />, title: '장소' }} />
            <Tabs.Screen name="route" options={{ tabBarIcon: ({ color }) => <MaterialIcons name="near-me" size={22} color={color} />, title: '계획' }} />
            <Tabs.Screen name="expense" options={{ tabBarIcon: ({ color }) => <MaterialIcons name="receipt" size={22} color={color} />, title: '정산' }} />
            <Tabs.Screen name="photo" options={{ tabBarIcon: ({ color }) => <MaterialIcons name="photo" size={22} color={color} />, title: '사진' }} />
            {/* 웹 하단 네비게이션은 5개다. 준비·메모는 정보 탭에서 들어간다 */}
            <Tabs.Screen name="checklist" options={{ href: null }} />
            <Tabs.Screen name="memo" options={{ href: null }} />
          </Tabs>
        </ErrorBoundary>
      </View>
    </View>
  )
}
