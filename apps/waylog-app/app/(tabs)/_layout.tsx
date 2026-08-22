import { MaterialIcons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import { palette } from '../../src/shared/config/tokens'

export default function HomeTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.textSecondary,
        tabBarStyle: { height: 84, paddingTop: 8, paddingBottom: 24 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: '내 여행', tabBarIcon: ({ color, size }) => <MaterialIcons name="luggage" color={color} size={size} /> }} />
      <Tabs.Screen name="feed" options={{ title: '피드', tabBarIcon: ({ color, size }) => <MaterialIcons name="dynamic-feed" color={color} size={size} /> }} />
      <Tabs.Screen name="explorer" options={{ title: '탐색', tabBarIcon: ({ color, size }) => <MaterialIcons name="explore" color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: '프로필', tabBarIcon: ({ color, size }) => <MaterialIcons name="person-outline" color={color} size={size} /> }} />
    </Tabs>
  )
}
