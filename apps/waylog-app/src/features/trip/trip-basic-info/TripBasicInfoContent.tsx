import { Alert, Pressable, ScrollView } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { Box, Stack, Tab, Tabs, Typography } from "../../../shared/components/mui"
import { Suspense } from 'react'
import { BottomArea } from "../../../shared/components/BottomArea"
import { ErrorBoundary } from "../../../shared/components/ErrorBoundary"
import { useQueryParamState } from '../../../shared/hooks/useQueryParamState'
import { TripChecklist } from '../trip-checklist/TripChecklist'
import { TripChecklistAddButton } from '../trip-checklist/TripChecklistAddButton'
import { TripDeadlineChecklist } from '../trip-checklist/TripDeadlineChecklist'
import { TripMemberSection } from '../trip-member/TripMemberSection'
import { TripPinnedMemos } from '../trip-memo/TripPinnedMemos'
import { RecommendedPlaceListSection } from '../trip-recommend/RecommendedPlaceListSection'
import { CommunityRoutesSection } from '../trip-community-routes/CommunityRoutesSection'
import { TripMemo } from '../trip-memo/TripMemo'
import { TripBaseInfoList } from './TripBaseInfoList'
import { TripDDay } from './TripDDay'
import { TripLeaveButton } from '../components/TripLeaveButton'
import { TripDetailHeader } from '../components/TripDetailHeader'

interface Props {
  tripId: string
}

export function TripBasicInfoContent({ tripId }: Props) {
  const [currentTab, setCurrentTab] = useQueryParamState('info-tab', { defaultValue: 'default' })


  return (
    <Stack sx={{ flex: 1, minHeight: 0 }}>
      <TripDetailHeader />
      <Tabs value={currentTab} onChange={(_, value) => setCurrentTab(value)}>
        <Tab value="default" label="기본정보" />
        <Tab value="checklist" label="체크리스트" />
        <Tab value="memo" label="메모" />
      </Tabs>
      <Box sx={{ flex: 1, width: '100%' }}>
        {currentTab === 'default' && (
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <Suspense fallback={<TripDDay.Skeleton sx={{ marginBottom: 16 }} />}>
              <TripDDay tripId={tripId} sx={{ marginBottom: 16 }} />
            </Suspense>

            <Pressable
              accessibilityLabel="여행을 회고하는 포스트 만들기"
              onPress={() => Alert.alert('준비 중인 기능', '여행 회고 포스트는 다음 단계에서 제공될 예정이에요.')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                marginBottom: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: '#cbd5ff',
                borderRadius: 16,
                backgroundColor: '#f4f6ff',
              }}
            >
              <Stack sx={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#fff' }}>
                <MaterialIcons name="auto-awesome" size={22} color="#587cf5" />
              </Stack>
              <Stack sx={{ flex: 1 }} gap={0.5}>
                <Typography variant="subtitle2" sx={{ fontWeight: '800' }}>여행을 회고하는 포스트 만들기</Typography>
                <Typography variant="body2" color="text.secondary">이 여행의 사진과 장소로 피드에 올려보세요</Typography>
              </Stack>
              <MaterialIcons name="chevron-right" size={24} color="#587cf5" />
            </Pressable>

            <Stack gap={3} alignItems="flex-start">
                {/* 여행 정보 */}
              <TripBaseInfoList
                tripId={tripId}
                direction="horizontal"
                size="s"
                gap={1}
                sx={{
                  borderWidth: 1,
                  borderColor: '#ddd',
                  padding: 16,
                  borderRadius: 16,
                  width: '100%',
                }}
              />

              <ErrorBoundary>
                <TripDeadlineChecklist tripId={tripId} gap={1} throwOnEmpty />
              </ErrorBoundary>

              <ErrorBoundary>
                <TripPinnedMemos tripId={tripId} throwOnEmpty />
              </ErrorBoundary>

              <Stack gap={1} sx={{ width: '100%' }}>
                <RecommendedPlaceListSection
                  tripId={tripId}
                  header={
                    <Typography variant="subtitle2" color="text.secondary">
                      사람들이 많이 찾는 곳이에요
                    </Typography>
                  }
                />
              </Stack>

              <ErrorBoundary>
                <CommunityRoutesSection tripId={tripId} />
              </ErrorBoundary>

              <TripMemberSection tripId={tripId} />

              <TripLeaveButton tripId={tripId} fullWidth variant="outlined" sx={{ marginTop: 48 }} />

            </Stack>
          </ScrollView>
        )}

        {currentTab === 'checklist' && (
          <>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <TripChecklist tripId={tripId} />
            </ScrollView>
            <BottomArea position="static" bottom={8}>
              <TripChecklistAddButton tripId={tripId} size="large" fullWidth />
            </BottomArea>
          </>
        )}

        {currentTab === 'memo' && (
          <TripMemo tripId={tripId} />
        )}

      </Box>
    </Stack>
  )
}
