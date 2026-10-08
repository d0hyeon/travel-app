import { Box, Stack, Typography } from '@mui/material'
import { LocationRegion } from '@waylog/domains/modules/location'
import type { RegionTourismTrend } from '@waylog/domains/modules/tourism-trend'
import { formatKoreanCount } from '@waylog/utility'

export const REGION_TREND_CARD_INNER_DIVIDER = 'rgba(0,0,0,0.06)'

interface RegionTrendCardProps {
  trend: RegionTourismTrend
  rank: number
}

export function RegionTrendCard({ trend, rank }: RegionTrendCardProps) {
  const isRising = trend.visitorGrowth >= 0
  const trendColor = isRising ? 'primary.main' : 'text.secondary'
  const growthPercent = Math.round(Math.abs(trend.growthRate) * 100)
  const regionLabel = getRegionLabel(trend.location)
  const visitors = getCountParts(trend.visitorCount)
  const growth = getCountParts(Math.abs(trend.visitorGrowth))

  return (
    <Stack
      gap="12px"
      p="18px"
      height="100%"
      borderRadius="16px"
      border={1}
      borderColor="divider"
      sx={{ bgcolor: 'background.paper' }}
    >
      <Stack direction="row" alignItems="center" gap={0.75}>
        <Box
          flexShrink={0}
          width={24}
          height={24}
          borderRadius="50%"
          bgcolor="primary.main"
          color="common.white"
          fontSize={13}
          fontWeight={700}
          lineHeight="24px"
          textAlign="center"
        >
          {rank}
        </Box>
        <Typography fontSize={18} fontWeight={700} noWrap>
          {trend.location}
        </Typography>
        {regionLabel && (
          <Typography fontSize={14} color="text.secondary" noWrap>
            {regionLabel}
          </Typography>
        )}
      </Stack>

      <Typography fontSize={22} fontWeight={700} lineHeight={1.2} color={trendColor}>
        {isRising ? '↗ +' : '↘ -'}
        {growthPercent}%
      </Typography>

      <Stack direction="row" pt="12px" borderTop={1} borderColor={REGION_TREND_CARD_INNER_DIVIDER}>
        <Stack flex={1} minWidth={0} gap="2px">
          <Typography fontSize={11} color="text.secondary">
            방문객
          </Typography>
          <Typography fontSize={17} fontWeight={700} noWrap sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {visitors.amount}
            <Typography component="span" fontSize={13} color="text.secondary">
              {visitors.unit}
            </Typography>
          </Typography>
        </Stack>
        <Stack flex={1} minWidth={0} gap="2px" pl="12px" borderLeft={1} borderColor={REGION_TREND_CARD_INNER_DIVIDER}>
          <Typography fontSize={11} color="text.secondary">
            작년 대비
          </Typography>
          <Typography fontSize={17} fontWeight={700} color={trendColor} noWrap sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {isRising ? '+' : '-'}
            {growth.amount}
            <Typography component="span" fontSize={13} color={trendColor}>
              {growth.unit}
            </Typography>
          </Typography>
        </Stack>
      </Stack>
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

function getCountParts(count: number) {
  const formatted = formatKoreanCount(count)
  const hasManUnit = formatted.endsWith('만')
  if (hasManUnit) return { amount: formatted.slice(0, -1), unit: '만명' }
  return { amount: formatted, unit: '명' }
}
