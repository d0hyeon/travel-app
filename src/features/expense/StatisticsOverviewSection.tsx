import { Box, Chip, Stack } from '@mui/material'
import { formatCurrency } from './expense.utils'
import { StatisticsBarChart } from './StatisticsBarChart'
import { StatisticsHeroPanel } from './StatisticsHeroPanel'
import { StatisticsSectionCard } from './StatisticsSectionCard'
import { StatisticsSummaryCard } from './StatisticsSummaryCard'
import type { AllExpenseSummary } from './useAllExpenseSummary'

interface StatisticsOverviewSectionProps {
  summary: AllExpenseSummary
}

export function StatisticsOverviewSection({ summary }: StatisticsOverviewSectionProps) {
  const {
    totalAmountInKRW,
    totalTripsCount,
    totalPlacesCount,
    averageTripAmountInKRW,
    topRegion,
    travelSummaries,
    currencySummaries,
    activityTripSummaries,
  } = summary

  const topTravelAmount = travelSummaries[0]?.totalAmountInKRW ?? 0
  const topActivityPlaceCount = activityTripSummaries[0]?.placeCount ?? 0

  return (
    <Stack gap={2}>
      <StatisticsHeroPanel totalAmount={formatCurrency(totalAmountInKRW)} />

      <Stack direction="row" gap={0.75} flexWrap="wrap">
        <Chip size="small" variant="outlined" label={`대표 통화 ${currencySummaries[0]?.currency ?? '-'}`} />
        {currencySummaries[0] && (
          <Chip size="small" variant="outlined" label={`${currencySummaries[0].expenseCount}건`} />
        )}
      </Stack>

      <StatisticsSectionCard title="짧은 인사이트" tone="mint">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(5, minmax(0, 1fr))' },
            gap: 1.5,
          }}
        >
          <StatisticsSummaryCard label="총 여행 수" value={`${totalTripsCount}회`} tone="blue" />
          <StatisticsSummaryCard label="총 장소 수" value={`${totalPlacesCount}곳`} tone="mint" />
          <StatisticsSummaryCard
            label="자주 가는 지역"
            value={topRegion?.region ?? '-'}
            caption={topRegion ? `${topRegion.tripCount}회` : undefined}
            tone="blue"
          />
          <StatisticsSummaryCard label="평균 여행 지출액" value={formatCurrency(averageTripAmountInKRW)} tone="mint" />
          <StatisticsSummaryCard
            label="활동량 높은 여행"
            value={activityTripSummaries[0]?.trip.name ?? '-'}
            caption={activityTripSummaries[0] ? `${activityTripSummaries[0].placeCount}곳` : undefined}
            tone="amber"
          />
        </Box>
      </StatisticsSectionCard>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(12, minmax(0, 1fr))' },
          gap: 2,
        }}
      >
        <Box sx={{ gridColumn: { xs: '1 / -1', md: '1 / span 7' } }}>
          <StatisticsSectionCard title="여행별 지출 순위" tone="blue">
            <Stack gap={1.5}>
              {travelSummaries.slice(0, 5).map((summaryItem, index) => (
                <StatisticsBarChart
                  key={summaryItem.trip.id}
                  label={`${index + 1}. ${summaryItem.trip.name}`}
                  value={formatCurrency(summaryItem.totalAmountInKRW)}
                  ratio={topTravelAmount > 0 ? summaryItem.totalAmountInKRW / topTravelAmount : 0}
                  helper={`${Math.round(summaryItem.share * 100)}%`}
                  chips={summaryItem.currencies}
                  tone="blue"
                />
              ))}
            </Stack>
          </StatisticsSectionCard>
        </Box>

        <Box sx={{ gridColumn: { xs: '1 / -1', md: '8 / span 5' } }}>
          <StatisticsSectionCard title="활동량 많은 여행 순위" tone="amber">
            <Stack gap={1.5}>
              {activityTripSummaries.slice(0, 5).map((summaryItem, index) => (
                <StatisticsBarChart
                  key={`${summaryItem.trip.id}-overview-activity`}
                  label={`${index + 1}. ${summaryItem.trip.name}`}
                  value={`${summaryItem.placeCount}곳`}
                  ratio={topActivityPlaceCount > 0 ? summaryItem.placeCount / topActivityPlaceCount : 0}
                  helper={summaryItem.trip.destination}
                  tone="amber"
                />
              ))}
            </Stack>
          </StatisticsSectionCard>
        </Box>
      </Box>
    </Stack>
  )
}
