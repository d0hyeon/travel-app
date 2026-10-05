import HelpIcon from '@mui/icons-material/Help'
import { Box, ButtonBase, Skeleton, Stack, Tooltip, Typography } from '@mui/material'
import { useMemo } from 'react'
import { SeasonLabel } from '@waylog/domains/modules/tourism-trend'
import { useRegionTourismTrends } from '@waylog/domains/modules/tourism-trend'
import { Scrollable } from '~shared/components/Scrollable'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { useExplorerFilterParams } from '../explorer-filters/useExplorerFilterParams'
import { RegionTrendCard } from './RegionTrendCard'
import { toast } from 'sonner'

const SECTION_LIMIT = 20

export function SeasonalRegionsSummarySection() {
  const { data: trends, season, referenceYear } = useRegionTourismTrends()
  const topTrends = useMemo(() => trends.slice(0, SECTION_LIMIT), [trends])

  const isMobile = useIsMobile()
  const { setLocation } = useExplorerFilterParams()

  return (
    <Box mb={3}>
      <Stack
        direction="row"
        alignItems="baseline"
        justifyContent="space-between"
        px={2}
        mb={1.5}
        gap={1}
      >
        <Typography variant="subtitle1">
          이번 {SeasonLabel[season]} 국내 인기 여행지
        </Typography>
        <Stack direction="row" gap={0.5} alignItems="center">
          <Typography variant="caption" color="text.secondary" flexShrink={0}>
            {referenceYear}년 {SeasonLabel[season]} 기준
          </Typography>
          <Tooltip title="출처: 공공 데이터 포털">
            <HelpIcon fontSize="small" />
          </Tooltip>
        </Stack>
      </Stack>

      {topTrends.length === 0 ? (
        <Typography
          variant="body2"
          color="text.secondary"
          px={2}
          py={4}
          textAlign="center"
        >
          자료를 찾을 수 없어요
        </Typography>
      ) : (
        <Scrollable.Horizontal
          width="100%"
          gap={isMobile ? 1 : 2}
          px={2}
          pb={0.5}
          sx={{ '&::-webkit-scrollbar': { display: 'none' } }}
          restorable={`seasonal-regions-section:${season}:${referenceYear}`}
        >
          {topTrends.map((trend, index) => (
            <ButtonBase
              key={trend.location}
              onClick={() => {
                setLocation(trend.location)
                toast.success('지역 필터가 적용되었어요')
              }}
              sx={{
                width: isMobile ? 150 : 200,
                flexShrink: 0,
                textAlign: 'left',
                borderRadius: 3,
                display: 'block',
              }}
            >
              <RegionTrendCard trend={trend} rank={index + 1} />
            </ButtonBase>
          ))}
        </Scrollable.Horizontal>
      )}
    </Box>
  )
}
SeasonalRegionsSummarySection.Skeleton = SeasonalRegionsSectionSkeleton

function SeasonalRegionsSectionSkeleton() {
  const isMobile = useIsMobile()

  return (
    <Box mb={3}>
      <Skeleton variant="text" width={200} height={28} sx={{ mx: 2, mb: 1.5 }} />
      <Stack direction="row" gap={isMobile ? 1 : 2} px={2}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Box
            key={index}
            sx={{
              width: isMobile ? 150 : 200,
              flexShrink: 0,
              borderRadius: 3,
              border: 1,
              borderColor: 'divider',
              p: 2,
            }}
          >
            <Stack direction="row" alignItems="center" gap={0.75}>
              <Skeleton variant="circular" width={20} height={20} />
              <Skeleton variant="text" width="55%" height={24} />
            </Stack>
            <Skeleton variant="text" width="45%" height={32} sx={{ mt: 1.5 }} />
            <Skeleton variant="text" width="60%" height={16} />
            <Skeleton variant="text" width="55%" height={16} sx={{ mt: 1 }} />
          </Box>
        ))}
      </Stack>
    </Box>
  )
}
