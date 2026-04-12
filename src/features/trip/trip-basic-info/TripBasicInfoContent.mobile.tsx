import { Box, Button, Stack, Tab, Tabs, Typography } from "@mui/material"
import { Suspense } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '~features/auth/useAuth'
import { BottomArea } from '~shared/components/BottomArea'
import { BottomNavigation } from '~shared/components/BottomNavigation'
import { useConfirmDialog } from '~shared/components/confirm-dialog/useConfirmDialog'
import { useQueryParamState } from '~shared/hooks/useQueryParamState'
import { TripChecklist } from '../trip-checklist/TripChecklist'
import { TripChecklistAddButton } from '../trip-checklist/TripChecklistAddButton'
import { TripDeadlineChecklist } from '../trip-checklist/TripDeadlineChecklist'
import { TripMemberSection } from '../trip-member/TripMemberSection.mobile'
import { TripMemoMobile } from '../trip-memo/TripMemoMobile'
import { TripPinnedMemos } from '../trip-memo/TripPinnedMemos'
import { useTrip } from '../useTrip'
import { TripBaseInfoList } from './TripBaseInfoList'
import { TripDDay } from './TripDDay'
import { ErrorBoundary } from "~shared/components/ErrorBoundary"

interface Props {
  tripId: string
}

export function TripBasicInfoContent({ tripId }: Props) {
  const { data: trip, remove, leave } = useTrip(tripId)
  const { data: currentUser } = useAuth()
  const navigate = useNavigate()
  const confirm = useConfirmDialog()
  const [currentTab, setCurrentTab] = useQueryParamState('info-tab', { defaultValue: 'default' })

  const isOwner = trip.userId === currentUser?.id

  const handleDelete = async () => {
    if (await confirm(`"${trip.name}" 여행을 삭제하시겠습니까?`)) {
      await remove.mutateAsync()
      navigate('/', { replace: true })
    }
  }

  const handleLeave = async () => {
    if (await confirm(`"${trip.name}" 여행에서 나가시겠습니까?`)) {
      await leave.mutateAsync()
      navigate('/', { replace: true })
    }
  }

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

              {isOwner ? (
                <Button variant="outlined" color="error" onClick={handleDelete} fullWidth>
                  여행 삭제
                </Button>
              ) : (
                <Button variant="outlined" color="warning" onClick={handleLeave} fullWidth>
                  여행 나가기
                </Button>
              )}
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
