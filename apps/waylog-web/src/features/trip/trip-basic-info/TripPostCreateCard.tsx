import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Box, Stack, Typography } from '@mui/material'
import { Link } from 'react-router'
import { AppRoute } from '~app/routes'
import { useTrip } from '@waylog/domains/modules/trip'

interface Props {
  tripId: string
}

/**
 * 여행 기간이 지난 trip의 기본 정보 탭에 노출되는 회고 포스트 작성 진입 카드.
 * 종료 전이면 노출하지 않는다.
 */
export function TripPostCreateCard({ tripId }: Props) {
  const { data: trip } = useTrip(tripId)
  if (!isTripOver(trip.endDate)) return null

  return (
    <Box
      component={Link}
      to={`${AppRoute.포스트_생성}?tripId=${tripId}`}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        width: '100%',
        py: '14px',
        pl: '14px',
        pr: '12px',
        borderRadius: '14px',
        textDecoration: 'none',
        bgcolor: '#EEF2FF',
        border: '1.5px solid rgba(74,122,255,0.25)',
        transition: 'all .15s',
        '&:hover': { bgcolor: '#E4EAFF' },
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: '10px',
          bgcolor: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <SparkleIcon />
      </Box>
      <Stack flex={1} minWidth={0}>
        <Typography sx={{ fontSize: 14.5, fontWeight: 700, letterSpacing: '-0.3px', color: '#111' }}>
          여행을 회고하는 포스트 만들기
        </Typography>
        <Typography sx={{ fontSize: 12.5, fontWeight: 500, color: '#6b6b73', mt: '3px' }}>
          이 여행의 사진과 장소로 피드에 올려보세요
        </Typography>
      </Stack>
      <ChevronRightIcon sx={{ color: 'primary.main' }} />
    </Box>
  )
}

function isTripOver(endDate: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(endDate).getTime() < today.getTime()
}

function SparkleIcon() {
  return (
    <Box
      component="svg"
      viewBox="0 0 24 24"
      sx={{ width: 22, height: 22, stroke: '#4A7AFF', strokeWidth: 1.6, fill: 'none', strokeLinecap: 'round' }}
    >
      <circle cx="12" cy="12" r="2" />
      <line x1="12" y1="3" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="21" />
      <line x1="3" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="21" y2="12" />
      <line x1="5.6" y1="5.6" x2="7.7" y2="7.7" />
      <line x1="16.3" y1="16.3" x2="18.4" y2="18.4" />
    </Box>
  )
}
