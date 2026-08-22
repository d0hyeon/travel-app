import { MaterialIcons } from '@expo/vector-icons'
import { useAuth, signOut } from '@waylog/domains/clients'
import { useEffect, useRef, useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useQueryParamState } from '../../shared/hooks/useQueryParamState'
import { Tabs, Tab } from '../../shared/components/mui'
import { palette } from '../../shared/config/tokens'
import { ProfileFeedTab } from './ProfileFeedTab'
import { ProfileHeader } from './ProfileHeader'
import { ProfileRecordsTab } from './ProfileRecordsTab'
import { ProfileStatStrip } from './ProfileStatStrip'

type ProfileTab = 'feed' | 'records'

export function UserProfileScreen({ userId }: { userId: string }) {
  const { data: auth } = useAuth()
  const insets = useSafeAreaInsets()
  const [currentTab, selectTab] = useQueryParamState<ProfileTab>('tab', { defaultValue: 'feed', parse: parseProfileTab })
  const [isSigningOut, setIsSigningOut] = useState(false)
  const profileScrollRef = useRef<ScrollView>(null)
  const recordsContentOffset = useRef<number | null>(null)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
    } finally {
      setIsSigningOut(false)
    }
  }

  useEffect(() => {
    if (currentTab !== 'records') return

    const scrollToRecords = () => {
      const targetOffset = recordsContentOffset.current
      if (targetOffset == null) return
      profileScrollRef.current?.scrollTo({ y: targetOffset, animated: true })
    }

    const frame = requestAnimationFrame(scrollToRecords)
    return () => cancelAnimationFrame(frame)
  }, [currentTab])

  return (
    <ScrollView
      ref={profileScrollRef}
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 24 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <ProfileHeader userId={userId} />
        {auth.id === userId && <Pressable disabled={isSigningOut} onPress={handleSignOut} style={{ padding: 16 }}><MaterialIcons name="logout" size={22} color="#d32f2f" /></Pressable>}
      </View>
      <ProfileStatStrip userId={userId} />
      <Tabs value={currentTab} onChange={(_, next) => { if (next === 'feed' || next === 'records') selectTab(next) }}>
        <Tab value="feed" label="피드" />
        <Tab value="records" label="기록" />
      </Tabs>
      {currentTab === 'feed' ? (
        <ProfileFeedTab userId={userId} />
      ) : (
        <View onLayout={(event) => {
          const recordsOffset = event?.nativeEvent?.layout?.y
          if (typeof recordsOffset !== 'number') return
          recordsContentOffset.current = recordsOffset
          requestAnimationFrame(() => profileScrollRef.current?.scrollTo({ y: recordsOffset, animated: true }))
        }}>
          <ProfileRecordsTab userId={userId} />
        </View>
      )}
    </ScrollView>
  )
}

function parseProfileTab(value: string): ProfileTab {
  return value === 'records' ? 'records' : 'feed'
}
