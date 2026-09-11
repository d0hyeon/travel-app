import { MaterialIcons } from '@expo/vector-icons'
import { StyleSheet, ScrollView } from 'react-native'
import { Box, Fab, Stack, Tab, Tabs, Typography } from "~/shared/components/design-system"
import { Suspense } from 'react'
import { ErrorBoundary } from '@waylog/react'
import { useQueryParamState } from '../../../shared/hooks/useQueryParamState'
import { TripChecklist } from '../trip-checklist/TripChecklist'
import { useTripChecklistFormOverlay } from '../trip-checklist/useTripChecklistFormOverlay'
import { TripDeadlineChecklist } from '../trip-checklist/TripDeadlineChecklist'
import { TripMemberSection } from '../trip-member/TripMemberSection'
import { TripPinnedMemos } from '../trip-memo/TripPinnedMemos'
import { RecommendedPlaceListSection } from '../trip-recommend/RecommendedPlaceListSection'
import { CommunityRoutesSection } from '../trip-community-routes/CommunityRoutesSection'
import { TripMemo } from '../trip-memo/TripMemo'
import { TripBaseInfoList } from './TripBaseInfoList'
import { TripDDay } from './TripDDay'
import { TripLeaveButton } from '../components/TripLeaveButton'
import { TripPostCreateCard } from './TripPostCreateCard'
import { FLOATING_TAB_BAR_RESERVE } from '../../../shared/components'

interface Props {
  tripId: string
}

export function TripBasicInfoContent({ tripId }: Props) {
  const [currentTab, setCurrentTab] = useQueryParamState('info-tab', { defaultValue: 'default' })
  const checklistForm = useTripChecklistFormOverlay(tripId)


  return (
    <Stack style={styles.container}>
      <Tabs value={currentTab} onChange={(_, value) => setCurrentTab(value)}>
        <Tab value="default" label="기본정보" />
        <Tab value="checklist" label="체크리스트" />
        <Tab value="memo" label="메모" />
      </Tabs>
      <Box style={styles.content}>
        {currentTab === 'default' && (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Suspense fallback={<TripDDay.Skeleton style={styles.dDay} />}>
              <TripDDay tripId={tripId} style={styles.dDay} />
            </Suspense>

            <Stack gap={3} >
              <ErrorBoundary>
                <Suspense fallback={null}>
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

              <TripPinnedMemos tripId={tripId} hideOnEmpty />

              <Stack gap={1} style={styles.fullWidth}>
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

              <TripLeaveButton tripId={tripId} fullWidth variant="outlined" style={styles.leaveButton} />

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
