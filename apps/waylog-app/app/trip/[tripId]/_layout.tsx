import { MaterialIcons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import { RouterTabNavigation, TRANSPARENT_SCENE_STYLE } from '../../../src/shared/components'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { palette } from '../../../src/shared/config/tokens'
import { ErrorBoundary } from '@waylog/react'
import { Button, Stack, Typography } from '~/shared/components/design-system'
import { View, StyleSheet } from 'react-native'
import { TripDetailHeader } from '../../../src/features/trip/components/TripDetailHeader'

// 웹 TripDetailPage.mobile 의 BottomNavigation 구성을 그대로 승계한다.
// 정보 · 장소 · 계획 · 정산 · 사진
export default function TripDetailLayout() {
  const insets = useSafeAreaInsets()

  return (
    <View style={styles.screen}>
      <ErrorBoundary
        fallback={({ resetError }) => (
          <Stack style={styles.error}>
            <Typography color="text.secondary">여행 정보를 불러오지 못했어요</Typography>
            <Button variant="contained" onPress={resetError} style={styles.retryButton}>다시 시도</Button>
          </Stack>
        )}
      >
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TripDetailHeader />
        </View>
        <View style={styles.fill}>
          <Tabs
            // 탭은 replace 로 동작한다. 뒤로가기는 직전 탭이 아니라 여행 화면을 벗어난다.
            backBehavior="none"
            tabBar={(props) => (
              <RouterTabNavigation
                {...props}
                variant="apple"
                visibleNames={['index', 'place', 'route', 'expense', 'photo']}
                style={styles.floatingTabBar}
              />
            )}
            screenOptions={{
              headerShown: false,
              sceneStyle: TRANSPARENT_SCENE_STYLE,
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
        </View>
      </ErrorBoundary>
    </View>
  )
}

const styles = StyleSheet.create({
  error: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  fill: { flex: 1 },
  // scene 을 투명하게 비웠으므로 화면 배경은 셸이 채운다.
  screen: { flex: 1, backgroundColor: palette.background },
  retryButton: { marginTop: 12 },
  header: { backgroundColor: palette.background },
  // 탭바가 scene 위에 얹혀야 콘텐츠가 바닥까지 이어진다. 가려지는 높이는
  // 각 화면이 FLOATING_TAB_BAR_RESERVE 로 비운다.
  floatingTabBar: { position: 'absolute', left: 0, right: 0, bottom: 0 },
})
