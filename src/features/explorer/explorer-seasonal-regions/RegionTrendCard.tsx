import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp'
import { Box, Stack, Typography } from '@mui/material'
import { LocationRegion } from '~features/location/location.model'
import type { RegionTourismTrend } from '~features/tourism-trend/tourismTrend.types'
import { formatKoreanCount } from '~shared/utils/formats'

interface RegionTrendCardProps {
  trend: RegionTourismTrend
  rank: number
}

export function RegionTrendCard({ trend, rank }: RegionTrendCardProps) {
  const isRising = trend.visitorGrowth >= 0
  const growthColor = isRising ? 'success.main' : 'text.secondary'
  const GrowthIcon = isRising ? ArrowDropUpIcon : ArrowDropDownIcon
  const growthPercent = Math.round(Math.abs(trend.growthRate) * 100)

  return (
    <Stack
      gap={0.5}
      p={2}
      height="100%"
      borderRadius={3}
      border={1}
      borderColor="divider"
      sx={{ bgcolor: 'background.paper' }}
    >
      <Typography variant="caption" color="text.secondary" fontWeight={700}>
        {rank}
      </Typography>

      <Box>
        <Typography variant="subtitle1" fontWeight={600} noWrap>
          {trend.location}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {LocationRegion[trend.location]}
        </Typography>
      </Box>

      <Box mt={0.5}>
        <Typography variant="body2" color="text.secondary" noWrap>
          {formatKoreanCount(trend.visitorCount)}명 방문
        </Typography>
        <Stack direction="row" alignItems="center" color={growthColor}>
          <GrowthIcon sx={{ fontSize: 18 }} />
          <Typography variant="body2" fontWeight={600} noWrap>
            {formatKoreanCount(Math.abs(trend.visitorGrowth))} ({growthPercent}%)
          </Typography>
        </Stack>
      </Box>
    </Stack>
  )
}
