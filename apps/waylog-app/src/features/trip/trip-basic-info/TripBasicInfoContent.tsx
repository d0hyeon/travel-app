import { ScrollView } from 'react-native'
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
import { TripMemo } from '../trip-memo/TripMemo'
import { TripBaseInfoList } from './TripBaseInfoList'
import { TripDDay } from './TripDDay'

interface Props {
  tripId: string
}

export function TripBasicInfoContent({ tripId }: Props) {
  const [currentTab, setCurrentTab] = useQueryParamState('info-tab', { defaultValue: 'default' })


  return (
    <Stack sx={{ height: '100%' }}>
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
                <Stack gap={1} sx={{ width: '100%' }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    해야할 일
                  </Typography>
                  <TripDeadlineChecklist tripId={tripId} gap={1} throwOnEmpty />
                </Stack>
              </ErrorBoundary>

              <ErrorBoundary>
                <TripPinnedMemos tripId={tripId} throwOnEmpty />
              </ErrorBoundary>

              <TripMemberSection tripId={tripId} />

            </Stack>
          </ScrollView>
        )}

        {currentTab === 'checklist' && (
          <>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <TripChecklist tripId={tripId} />
            </ScrollView>
            <BottomArea>
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
