import { MaterialIcons } from '@expo/vector-icons'
import { StyleSheet, ScrollView } from 'react-native'
import { Box, Fab, Stack, Tab, Tabs, Typography } from "~shared/components/design-system"
import { Suspense } from 'react'
import { ErrorBoundary } from '@waylog/react'
import { useAppNavigation } from '~shared/hooks/useAppNavigation'
import { AppRoute } from '~app/AppRoute'
import { useQueryParamState } from '~shared/hooks/useQueryParamState'
import { TripChecklist } from '~features/trip/trip-checklist/TripChecklist'
import { useTripChecklistFormOverlay } from '~features/trip/trip-checklist/useTripChecklistFormOverlay'
import { TripDeadlineChecklist } from '~features/trip/trip-checklist/TripDeadlineChecklist'
import { TripTransportList } from '~features/trip/trip-transport/TripTransportList'
import { UpcomingTransportSection } from '~features/trip/trip-transport/UpcomingTransportSection'
import { TripMemberSection } from '~features/trip/trip-member/TripMemberSection'
import { TripPinnedMemos } from '~features/trip/trip-memo/TripPinnedMemos'
import { RecommendedPlaceListSection } from '~features/trip/trip-recommend/RecommendedPlaceListSection'
import { CommunityRoutesSection } from '~features/trip/trip-community-routes/CommunityRoutesSection'
import { TripMemo } from '~features/trip/trip-memo/TripMemo'
import { TripBaseInfoList } from './TripBaseInfoList'
import { TripDDay } from './TripDDay'
import { TripLeaveButton } from '~features/trip/components/TripLeaveButton'
import { TripPostCreateCard } from './TripPostCreateCard'
import { FLOATING_TAB_BAR_RESERVE } from '~shared/components'

interface Props {
  tripId: string
}

export function TripBasicInfoContent({ tripId }: Props) {
  const [currentTab, setCurrentTab] = useQueryParamState('info-tab', { defaultValue: 'default' })
  const checklistForm = useTripChecklistFormOverlay(tripId)
  const navigation = useAppNavigation()


  return (
    <Stack style={styles.container}>
      <Tabs value={currentTab} onChange={(_, value) => setCurrentTab(value)}>
        <Tab value="default" label="기본정보" />
        <Tab value="checklist" label="체크리스트" />
        <Tab value="memo" label="메모" />
        <Tab value="transport" label="탑승권" />
      </Tabs>
      <Box style={styles.content}>
        {currentTab === 'default' && (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Suspense fallback={<TripDDay.Skeleton style={styles.dDay} />}>
              <TripDDay tripId={tripId} style={styles.dDay} />
            </Suspense>

            <Stack gap={4}>
              <ErrorBoundary>
                <Suspense fallback={<TripPostCreateCard.Skeleton />}>
                  <TripPostCreateCard tripId={tripId} />
                </Suspense>
              </ErrorBoundary>

              {/* 여행 정보 */}
              <TripBaseInfoList
                tripId={tripId}
                direction="horizontal"
                size="s"
                gap={1}
                style={styles.baseInfo}
              />

              <TripDeadlineChecklist tripId={tripId} gap={1} hideOnEmpty />

              <ErrorBoundary>
                <Suspense fallback={<UpcomingTransportSection.Skeleton />}>
                  <UpcomingTransportSection tripId={tripId} />
                </Suspense>
              </ErrorBoundary>

              <TripPinnedMemos tripId={tripId} hideOnEmpty />

              <RecommendedPlaceListSection
                tripId={tripId}
                header={
                  <Typography variant="subtitle2" >
                    사람들이 많이 찾는 곳이에요
                  </Typography>
                }
              />

              <ErrorBoundary>
                <CommunityRoutesSection tripId={tripId} />
              </ErrorBoundary>
              <TripMemberSection tripId={tripId} />

              <Suspense fallback={null}>
                <TripLeaveButton tripId={tripId} fullWidth variant="outlined" style={styles.leaveButton} />
              </Suspense>

            </Stack>
          </ScrollView>
        )}

        {currentTab === 'checklist' && (
          <>
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <TripChecklist tripId={tripId} />
            </ScrollView>
            <Fab
              color="primary"
              size="medium"
              onPress={() => void checklistForm.open()}
              style={styles.addButton}
            >
              <MaterialIcons name="add" size={24} color="#fff" />
            </Fab>
          </>
        )}

        {currentTab === 'memo' && (
          <TripMemo tripId={tripId} />
        )}

        {currentTab === 'transport' && (
          <>
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <Suspense fallback={<TripTransportList.Skeleton />}>
                <TripTransportList
                  tripId={tripId}
                  onTransportPress={(transportId) => navigation.navigate(AppRoute.여행_교통편_상세, { tripId, transportId })}
                />
              </Suspense>
            </ScrollView>
            <Fab
              color="primary"
              size="medium"
              onPress={() => navigation.navigate(AppRoute.여행_교통편_추가, { tripId })}
              style={styles.addButton}
            >
              <MaterialIcons name="add" size={24} color="#fff" />
            </Fab>
          </>
        )}

      </Box>
    </Stack>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 0 },
  content: { flex: 1, width: '100%' },
  scrollContent: { padding: 16, paddingBottom: 16 + FLOATING_TAB_BAR_RESERVE },
  dDay: { marginBottom: 16 },
  baseInfo: { borderWidth: 1, borderColor: '#ddd', padding: 16, borderRadius: 16, width: '100%' },
  fullWidth: { width: '100%' },
  addButton: { position: 'absolute', bottom: 16 + FLOATING_TAB_BAR_RESERVE, right: 16 },
  leaveButton: { marginTop: 48, },
})
