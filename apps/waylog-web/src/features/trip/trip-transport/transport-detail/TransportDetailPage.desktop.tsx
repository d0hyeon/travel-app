import { Box, Typography } from '@mui/material'
import { AsyncBoundary } from '@waylog/react'
import { TopNavigation } from '~shared/components/layout/TopNavigation.desktop'
import { useTripId } from '../../useTripId'
import { TransportDetailContent } from './TransportDetailContent'
import { TransportDetailMenu } from './TransportDetailMenu'
import { useTransportId } from '../useTransportId'

// 시안 규격: 등록 퍼널과 같은 전체 페이지형 셸이다. 헤더 아래 본문을 480px 폭으로 가운데 둔다.
const CONTENT_WIDTH = 480

export function TransportDetailPageDesktop() {
  const tripId = useTripId()
  const transportId = useTransportId()

  return (
    <Box height="100dvh" display="flex" flexDirection="column" bgcolor="background.paper">
      <TopNavigation
        rightElement={
          <AsyncBoundary resetKeys={[tripId, transportId]} pendingFallback={null} rejectedFallback={() => null}>
            <TransportDetailMenu tripId={tripId} transportId={transportId} />
          </AsyncBoundary>
        }
      >
        <Typography variant="h6">탑승권 상세</Typography>
      </TopNavigation>

      <Box flex={1} display="flex" justifyContent="center" pt={2} pb={10}>
        <Box width={CONTENT_WIDTH}>
          <TransportDetailContent tripId={tripId} transportId={transportId} />
        </Box>
      </Box>
    </Box>
  )
}
