import { Tabs } from 'expo-router'
import { palette } from '../../../src/shared/config/tokens'

// 웹 TripDetailPage.mobile 의 BottomNavigation 구성을 그대로 승계한다.
// 정보 · 장소 · 계획 · 정산 · 사진
export default function TripDetailLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.grey,
      }}
    >
      <Tabs.Screen name="index" options={{ title: '정보' }} />
      <Tabs.Screen name="place" options={{ title: '장소' }} />
      <Tabs.Screen name="route" options={{ title: '계획' }} />
      <Tabs.Screen name="expense" options={{ title: '정산' }} />
      <Tabs.Screen name="photo" options={{ title: '사진' }} />
      {/* 탭이 아니라 장소 탭에서 들어가는 화면이다 */}
      <Tabs.Screen name="place-search" options={{ href: null }} />
    </Tabs>
  )
}
