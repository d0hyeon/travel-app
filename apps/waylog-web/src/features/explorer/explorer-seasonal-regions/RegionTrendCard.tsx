import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import { Box, Stack, Typography } from '@mui/material'
import { LocationRegion } from '@waylog/domains/location'
import type { RegionTourismTrend } from '~features/tourism-trend/tourismTrend.types'
import { formatKoreanCount } from '~shared/utils/formats'

interface RegionTrendCardProps {
  trend: RegionTourismTrend
  rank: number
}

export function RegionTrendCard({ trend, rank }: RegionTrendCardProps) {
  const isRising = trend.visitorGrowth >= 0
  const trendColor = isRising ? 'primary.main' : 'text.disabled'
  const TrendIcon = isRising ? TrendingUpIcon : TrendingDownIcon
  const growthPercent = Math.round(Math.abs(trend.growthRate) * 100)
  const regionLabel = getRegionLabel(trend.location)

  return (
    <Stack
      p={2}
      height="100%"
      borderRadius={3}
      border={1}
      borderColor="divider"
      sx={{ bgcolor: 'background.paper' }}
    >
      <Stack direction="row" alignItems="center" gap={0.75}>
        <Box
          flexShrink={0}
          width={20}
          height={20}
          borderRadius="50%"
          bgcolor="primary.main"
          color="common.white"
          fontSize={12}
          fontWeight={700}
          lineHeight="20px"
          textAlign="center"
        >
          {rank}
        </Box>
        <Typography variant="subtitle1" fontWeight={700} noWrap>
          {trend.location}
        </Typography>
        {regionLabel && (
          <Typography variant="caption" color="text.secondary" noWrap>
            {regionLabel}
          </Typography>
        )}
      </Stack>

      <Stack direction="row" alignItems="center" gap={0.5} mt={1.5} color={trendColor}>
        <TrendIcon sx={{ fontSize: 20 }} />
        <Typography variant="h6" fontWeight={800} lineHeight={1.2}>
          {isRising ? '+' : '-'}
          {growthPercent}%
        </Typography>
      </Stack>

      <Typography variant="caption" color="text.secondary" noWrap>
        {formatKoreanCount(Math.abs(trend.visitorGrowth))}명{' '}
        {isRising ? '증가' : '감소'}
      </Typography>

      <Typography variant="caption" color="text.disabled" mt="auto" pt={1} noWrap>
        {formatKoreanCount(trend.visitorCount)}명 방문
      </Typography>
    </Stack>
  )
}

// 광역시는 지역명과 상위 지역이 같고(서울/서울), 제주는 포함 관계라 중복이다.
function getRegionLabel(location: RegionTourismTrend['location']) {
  const region = LocationRegion[location]
  if (region === location) return null
  if (region.startsWith(location)) return null
  return region
}
