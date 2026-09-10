import { MaterialIcons } from '@expo/vector-icons'
import { useAuth, signOut } from '@waylog/domains/clients'
import { useEffect, useRef, useState } from 'react'
import { StyleSheet, Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQueryParamState } from '../../shared/hooks/useQueryParamState'
import { Tabs, Tab } from '~/shared/components/design-system'
import { palette } from '../../shared/config/tokens'
import { ProfileFeedTab } from './ProfileFeedTab'
import { ProfileHeader } from './ProfileHeader'
import { ProfileRecordsTab } from './ProfileRecordsTab'
import { ProfileStatStrip } from './ProfileStatStrip'

type ProfileTab = 'feed' | 'records'

interface Props {
  userId: string
  bottomContentInset?: number
}

export function UserProfileScreen({ userId, bottomContentInset = 0 }: Props) {
  const { data: auth } = useAuth()
  const [currentTab, selectTab] = useQueryParamState<ProfileTab>('tab', { defaultValue: 'feed', parse: parseProfileTab })
  const [isSigningOut, setIsSigningOut] = useState(false)
  // 지도를 만지는 동안 세로 스크롤을 멈춘다. 두 제스처가 겹치면 지도가 끊긴다.
  const [isMapInteracting, setIsMapInteracting] = useState(false)
  // 안전 영역을 뺀 실제 높이. 기록 탭 지도가 이 높이를 채운다.
  const [viewportHeight, setViewportHeight] = useState(0)
  const profileScrollRef = useRef<ScrollView>(null)
  const tabBarOffset = useRef<number | null>(null)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
    } finally {
      setIsSigningOut(false)
    }
  }

  // 기록 탭을 연 순간에만 옮긴다. 웹처럼 탭바가 화면 맨 위에 붙어 남도록
  // 탭 아래 내용이 아니라 탭바 자리로 스크롤한다.
  // onLayout 에서 매번 스크롤하면 바텀시트가 열릴 때마다 화면이 다시 튕긴다.
  useEffect(() => {
    if (currentTab !== 'records') return

    let frame = requestAnimationFrame(function scrollWhenMeasured() {
      const targetOffset = tabBarOffset.current
      if (targetOffset == null) {
        frame = requestAnimationFrame(scrollWhenMeasured)
        return
      }
      profileScrollRef.current?.scrollTo({ y: targetOffset, animated: true })
    })

    return () => cancelAnimationFrame(frame)
  }, [currentTab])

  return (
    <SafeAreaView
      edges={SCREEN_SAFE_AREA_EDGES}
      style={styles.screen}
      onLayout={(event) => setViewportHeight(event.nativeEvent.layout.height)}
    >
      <ScrollView
        ref={profileScrollRef}
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bottomContentInset + CONTENT_BOTTOM_SPACING }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isMapInteracting}
        // 웹의 position: sticky 와 같다. 탭바가 위에 붙어 남는다.
        stickyHeaderIndices={[TAB_BAR_CHILD_INDEX]}
      >
        <View style={styles.header}>
          <ProfileHeader userId={userId} />
          {auth.id === userId && <Pressable disabled={isSigningOut} onPress={handleSignOut} style={styles.signOutButton}><MaterialIcons name="logout" size={22} color="#d32f2f" /></Pressable>}
        </View>
        <ProfileStatStrip userId={userId} />
        <View
          style={styles.tabs}
          onLayout={(event) => {
            const offset = event?.nativeEvent?.layout?.y
            if (typeof offset !== 'number') return
            tabBarOffset.current = offset
          }}
        >
          <Tabs fullWidth value={currentTab} onChange={(_, next) => { if (next === 'feed' || next === 'records') selectTab(next) }}>
            <Tab value="feed" label="피드" />
            <Tab value="records" label="기록" />
          </Tabs>
        </View>
        {currentTab === 'feed' ? (
          <ProfileFeedTab userId={userId} />
        ) : (
          <ProfileRecordsTab userId={userId} viewportHeight={viewportHeight} onMapInteractionChange={setIsMapInteracting} />
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

// ScrollView 자식 순서: 헤더, 통계, 탭바
const TAB_BAR_CHILD_INDEX = 2

function parseProfileTab(value: string): ProfileTab {
  return value === 'records' ? 'records' : 'feed'
}

const SCREEN_SAFE_AREA_EDGES = ['top', 'left', 'right'] as const

const CONTENT_BOTTOM_SPACING = 24

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  scroll: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  signOutButton: { padding: 16 },
  tabs: { backgroundColor: palette.background },
})
