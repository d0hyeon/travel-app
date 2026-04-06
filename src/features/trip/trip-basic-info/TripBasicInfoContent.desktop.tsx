import { Box, Card, CardContent, CardHeader, Stack, Typography } from "@mui/material"
import { Suspense } from 'react'
import { TripChecklist } from '../trip-checklist/TripChecklist'
import { TripChecklistAddButton } from '../trip-checklist/TripChecklistAddButton'
import { TripMemberSection } from '../trip-member/TripMemberSection.desktop'
import { TripMemo } from '../trip-memo/TripMemo'
import { TripMemoAddButton } from '../trip-memo/TripMemoAddButton'
import { TripBaseInfoList } from './TripBaseInfoList'
import { TripDDay } from './TripDDay'

interface Props {
  tripId: string
}

export function TripBasicInfoContent({ tripId }: Props) {

  return (
    <Box>
      <Stack direction="row" gap={3} height="100%" sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        <Stack flex="1" spacing={3} >
          {/* D-Day */}
          <Suspense fallback={<TripDDay.Skeleton />}>
            <TripDDay tripId={tripId} />
          </Suspense>

          {/* 여행 정보 */}
          <Card variant="outlined">
            <CardHeader title="여행 정보" />
            <CardContent>
              <TripBaseInfoList tripId={tripId} />
            </CardContent>
          </Card>

          {/* 고정된 메모 */}
          <Card variant="outlined">
            <Stack direction="row" paddingY={1} marginTop={0.5} paddingX={2} alignItems="center" justifyContent="space-between">
              <Typography variant="h6">메모</Typography>
              <TripMemoAddButton tripId={tripId} size="small" />
            </Stack>

            <CardContent>
              <Suspense fallback={<TripMemo.Skeleton />}>
                <TripMemo tripId={tripId} />
              </Suspense>
            </CardContent>
          </Card>

          <TripMemberSection tripId={tripId} />
        </Stack>
        <Stack flex="0 0 500px" spacing={3} sx={{ position: 'relative' }}>
          <Card
            variant="outlined"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              position: 'fixed',
              top: 160,
              bottom: 24,
              right: 24,
              width: 500,
            }}
          >
            <Stack flex="0 0 auto" direction="row" paddingY={1} marginTop={0.5} paddingX={2} alignItems="center" justifyContent="space-between">
              <Typography variant="h6">체크리스트</Typography>
              <TripChecklistAddButton tripId={tripId} size="small" />
            </Stack>

            <Suspense>
              <CardContent sx={{ flex: '1 1 auto', overflowY: 'auto' }}>
                <TripChecklist tripId={tripId} />
              </CardContent>
            </Suspense>
          </Card>


        </Stack>
      </Stack>
    </Box>
  )
}
