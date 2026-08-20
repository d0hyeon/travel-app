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
      {/* 웹 하단 네비게이션은 5개다. 준비·메모는 정보 탭에서 들어간다 */}
      <Tabs.Screen name="checklist" options={{ href: null }} />
      <Tabs.Screen name="memo" options={{ href: null }} />
    </Tabs>
  )
}
