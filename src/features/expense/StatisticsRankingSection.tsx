import { Box, Stack } from '@mui/material'
import { formatCurrency } from './expense.utils'
import { StatisticsBarChart } from './StatisticsBarChart'
import { StatisticsSectionCard } from './StatisticsSectionCard'
import type { AllExpenseSummary } from './useAllExpenseSummary'

interface StatisticsRankingSectionProps {
  summary: AllExpenseSummary
}

export function StatisticsRankingSection({ summary }: StatisticsRankingSectionProps) {
  const {
    travelSummaries,
    payerSummaries,
    regionVisitSummaries,
    cityVisitSummaries,
    activityTripSummaries,
  } = summary

  const topTravelAmount = travelSummaries[0]?.totalAmountInKRW ?? 0
  const topPayerAmount = payerSummaries[0]?.totalAmountInKRW ?? 0
  const topCityVisitCount = cityVisitSummaries[0]?.tripCount ?? 0
  const topActivityPlaceCount = activityTripSummaries[0]?.placeCount ?? 0
  const topRegionVisitCount = regionVisitSummaries[0]?.tripCount ?? 0

  return (
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
            {travelSummaries.map((summaryItem, index) => (
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
        <StatisticsSectionCard title="결제자 순위" tone="amber">
          <Stack gap={1.5}>
            {payerSummaries.slice(0, 8).map((summaryItem, index) => (
              <StatisticsBarChart
                key={`${summaryItem.name}-${index}`}
                label={`${index + 1}. ${summaryItem.emoji} ${summaryItem.name}`}
                value={formatCurrency(summaryItem.totalAmountInKRW)}
                ratio={topPayerAmount > 0 ? summaryItem.totalAmountInKRW / topPayerAmount : 0}
                helper={`${summaryItem.tripCount}개 여행 · ${Math.round(summaryItem.share * 100)}%`}
                chips={summaryItem.tripNames.slice(0, 3)}
                tone="amber"
              />
            ))}
          </Stack>
        </StatisticsSectionCard>
      </Box>

      <Box sx={{ gridColumn: { xs: '1 / -1', md: '1 / span 6' } }}>
        <StatisticsSectionCard title="도시 방문 순위" tone="mint">
          <Stack gap={1.5}>
            {cityVisitSummaries.map((summaryItem, index) => (
              <StatisticsBarChart
                key={`${summaryItem.city}-${index}`}
                label={`${index + 1}. ${summaryItem.city}`}
                value={`${summaryItem.tripCount}회`}
                ratio={topCityVisitCount > 0 ? summaryItem.tripCount / topCityVisitCount : 0}
                helper={`${Math.round(summaryItem.share * 100)}%`}
                tone="mint"
              />
            ))}
          </Stack>
        </StatisticsSectionCard>
      </Box>

      <Box sx={{ gridColumn: { xs: '1 / -1', md: '7 / span 6' } }}>
        <StatisticsSectionCard title="활동량이 많은 여행 순위" tone="blue">
          <Stack gap={1.5}>
            {activityTripSummaries.map((summaryItem, index) => (
              <StatisticsBarChart
                key={`${summaryItem.trip.id}-activity`}
                label={`${index + 1}. ${summaryItem.trip.name}`}
                value={`${summaryItem.placeCount}곳`}
                ratio={topActivityPlaceCount > 0 ? summaryItem.placeCount / topActivityPlaceCount : 0}
                helper={summaryItem.trip.destination}
                tone="blue"
              />
            ))}
          </Stack>
        </StatisticsSectionCard>
      </Box>

      <Box sx={{ gridColumn: '1 / -1' }}>
        <StatisticsSectionCard title="지역 방문 순위" tone="mint">
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
              gap: 1.5,
            }}
          >
            {regionVisitSummaries.map((summaryItem, index) => (
              <StatisticsBarChart
                key={`${summaryItem.region}-${index}`}
                label={`${index + 1}. ${summaryItem.region}`}
                value={`${summaryItem.tripCount}회`}
                ratio={topRegionVisitCount > 0 ? summaryItem.tripCount / topRegionVisitCount : 0}
                helper={`${Math.round(summaryItem.share * 100)}%`}
                tone="mint"
              />
            ))}
          </Box>
        </StatisticsSectionCard>
      </Box>
    </Box>
  )
}
