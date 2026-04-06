import PublicRoundedIcon from '@mui/icons-material/PublicRounded'
import { Box, Chip, Stack } from '@mui/material'
import { formatCurrency } from '~features/expense/expense.utils'
import { StatisticsBarChart } from '~shared/components/statistics/StatisticsBarChart'
import { StatisticsSectionCard } from './StatisticsSectionCard'
import { StatisticsSummaryCard } from './StatisticsSummaryCard'
import { statisticsToneStyles } from '~shared/components/statistics/statistics.constants'
import type { StatisticsSummary } from './statistics-expense/useStatisticsSummary'

interface StatisticsCurrencySectionProps {
  summary: StatisticsSummary
}

export function StatisticsCurrencySection({ summary }: StatisticsCurrencySectionProps) {
  const { currencySummaries, travelSummaries } = summary
  const topCurrencyAmount = currencySummaries[0]?.totalAmountInKRW ?? 0

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(12, minmax(0, 1fr))' },
        gap: 2,
      }}
    >
      <Box sx={{ gridColumn: { xs: '1 / -1', md: '1 / span 5' } }}>
        <StatisticsSectionCard title="대표 통화" tone="mint">
          <Stack gap={1.25}>
            <StatisticsSummaryCard
              label="1위 통화"
              value={currencySummaries[0]?.currency ?? '-'}
              caption={currencySummaries[0] ? formatCurrency(currencySummaries[0].totalAmountInKRW) : undefined}
              tone="mint"
              icon={<PublicRoundedIcon sx={{ color: statisticsToneStyles.mint.fill, fontSize: 18 }} />}
            />
            <StatisticsSummaryCard label="통화 수" value={`${currencySummaries.length}개`} tone="blue" />
          </Stack>
        </StatisticsSectionCard>
      </Box>

      <Box sx={{ gridColumn: { xs: '1 / -1', md: '6 / span 7' } }}>
        <StatisticsSectionCard title="통화별 지출 분포" tone="mint">
          <Stack gap={1.5}>
            {currencySummaries.map((summaryItem) => (
              <StatisticsBarChart
                key={summaryItem.currency}
                label={summaryItem.currency}
                value={formatCurrency(summaryItem.totalAmountInKRW)}
                ratio={topCurrencyAmount > 0 ? summaryItem.totalAmountInKRW / topCurrencyAmount : 0}
                helper={`${summaryItem.expenseCount}건 · ${Math.round(summaryItem.share * 100)}%`}
                tone="mint"
              />
            ))}
          </Stack>
        </StatisticsSectionCard>
      </Box>

      <Box sx={{ gridColumn: '1 / -1' }}>
        <StatisticsSectionCard title="통화가 쓰인 여행" tone="blue">
          <Stack direction="row" gap={0.75} flexWrap="wrap">
            {travelSummaries.flatMap((summaryItem) =>
              summaryItem.currencies.map((currency) => (
                <Chip
                  key={`${summaryItem.trip.id}-${currency}`}
                  label={`${currency} · ${summaryItem.trip.name}`}
                  variant="outlined"
                />
              ))
            )}
          </Stack>
        </StatisticsSectionCard>
      </Box>
    </Box>
  )
}
