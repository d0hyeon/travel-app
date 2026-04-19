import { Box, Stack, Tab, Tabs, Typography } from "@mui/material"
import { Suspense } from 'react'
import { BottomArea } from '~shared/components/BottomArea'
import { BottomNavigation } from '~shared/components/BottomNavigation'
import { ErrorBoundary } from "~shared/components/ErrorBoundary"
import { useQueryParamState } from '~shared/hooks/urls/useQueryParamState'
import { TripChecklist } from '../trip-checklist/TripChecklist'
import { TripChecklistAddButton } from '../trip-checklist/TripChecklistAddButton'
import { TripDeadlineChecklist } from '../trip-checklist/TripDeadlineChecklist'
import { TripMemberSection } from '../trip-member/TripMemberSection.mobile'
import { TripMemoMobile } from '../trip-memo/TripMemoMobile'
import { TripPinnedMemos } from '../trip-memo/TripPinnedMemos'
import { TripBaseInfoList } from './TripBaseInfoList'
import { TripDDay } from './TripDDay'
import { RecommendedPlacesSection } from './RecommendedPlacesSection'

interface Props {
  tripId: string
}

export function TripBasicInfoContent({ tripId }: Props) {
  const [currentTab, setCurrentTab] = useQueryParamState('info-tab', { defaultValue: 'default' })


  return (
    <Stack height="100%">
      <Tabs value={currentTab} onChange={(_, value) => setCurrentTab(value)}>
        <Tab value="default" label="기본정보" />
        <Tab value="checklist" label="체크리스트" />
        <Tab value="memo" label="메모" />
      </Tabs>
      <Box
        position="relative"
        width="100%"
        sx={{ flex: 1, overflow: currentTab === 'memo' ? 'hidden' : 'auto', p: currentTab === 'memo' ? 0 : 2 }}>
        {currentTab === 'default' && (
          <>
            <Suspense fallback={<TripDDay.Skeleton marginBottom={2} />}>
              <TripDDay tripId={tripId} marginBottom={2} />
            </Suspense>

            <Stack gap={3} alignItems="start">
              {/* D-Day */}

              {/* 여행 정보 */}
              <TripBaseInfoList
                tripId={tripId}
                direction="horizontal"
                size="s"
                spacing={1}
                border="1px solid #ddd"
                padding={2}
                borderRadius={4}
                width="100%"
              />
              <RecommendedPlacesSection tripId={tripId} />

              <ErrorBoundary>
                <Stack gap={1} width="100%">
                  <Typography variant='subtitle2' color="text.secondary">
                    해야할 일
                  </Typography>
                  <TripDeadlineChecklist
                    tripId={tripId}
                    gap={1}
                    throwOnEmpty
                  />
                </Stack>
              </ErrorBoundary>

              {/* 고정된 메모 */}
              <ErrorBoundary>
                <TripPinnedMemos tripId={tripId} throwOnEmpty />
              </ErrorBoundary>

              {/* 인원 관리 */}
              <TripMemberSection tripId={tripId} />
            </Stack>
          </>
        )}

        {currentTab === 'checklist' && (
          <>
            <TripChecklist tripId={tripId} paddingBottom={`${BottomNavigation.HEIGHT}px`} />
            <BottomArea bottom={BottomNavigation.HEIGHT} left={0}>
              <TripChecklistAddButton tripId={tripId} size="large" fullWidth />
            </BottomArea>
          </>
        )}

        {currentTab === 'memo' && (
          <TripMemoMobile tripId={tripId} />
        )}

      </Box>
    </Stack>
  )
}
