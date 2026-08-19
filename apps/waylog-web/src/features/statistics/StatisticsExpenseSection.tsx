import { Box, Chip, Stack, Typography } from '@mui/material'
import { formatCurrency } from '~features/expense/expense.utils'
import { StatisticsBarChart } from '~shared/components/statistics/StatisticsBarChart'
import { StatisticsColumnChart } from '~shared/components/statistics/StatisticsColumnChart'
import { StatisticsDonutChart } from '~shared/components/statistics/StatisticsDonutChart'
import { StatisticsHeroPanel } from './StatisticsHeroPanel'
import { StatisticsSectionCard } from './StatisticsSectionCard'
import {
  StatisticsTrendChart
} from './StatisticsTrendChart'
import {
  StatisticsViewConfigButton,
  useStatisticsChartViewMode,
} from './StatisticsViewConfigButton'
import type { StatisticsSummary } from './statistics-expense/useStatisticsSummary'

interface StatisticsExpenseSectionProps {
  summary: StatisticsSummary
}

export function StatisticsExpenseSection({ summary }: StatisticsExpenseSectionProps) {
  const [trendViewMode, setTrendViewMode] = useStatisticsChartViewMode('trend', 'line')
  const [travelViewMode, setTravelViewMode] = useStatisticsChartViewMode('travel-spend', 'horizontal-bar')
  const [payerViewMode, setPayerViewMode] = useStatisticsChartViewMode('payer-ranking', 'donut')
  const [categoryExpenseViewMode, setCategoryExpenseViewMode] = useStatisticsChartViewMode('category-expense', 'donut')
  const {
    totalAmountInKRW,
    currencySummaries,
    travelSummaries,
    payerSummaries,
    categoryExpenseSummaries,
    expenseTrend,
  } = summary

  const topTravelAmount = travelSummaries[0]?.totalAmountInKRW ?? 0

  return (
    <Stack gap={3}>
      <StatisticsHeroPanel totalAmount={formatCurrency(totalAmountInKRW)} />

      <Stack direction="row" gap={0.75} flexWrap="wrap">
        <Chip size="small" variant="outlined" label={`대표 통화 ${currencySummaries[0]?.currency ?? '-'}`} />
        {currencySummaries[0] && (
          <Chip size="small" variant="outlined" label={`${currencySummaries[0].expenseCount}건`} />
        )}
      </Stack>

      <StatisticsSectionCard
        title="지출 추이"
        tone="blue"
        action={
          <Stack direction="row" gap={0.75} alignItems="center">
            <StatisticsViewConfigButton
              title="지출 추이"
              options={[
                { value: 'line', label: '라인형', caption: '흐름 변화를 부드럽게 봐요' },
                { value: 'bar', label: '막대형', caption: '여행별 값 차이를 또렷하게 봐요' },
                { value: 'donut', label: '도넛형', caption: '여행별 비중을 중심으로 봐요' },
              ]}
              value={trendViewMode}
              onChange={setTrendViewMode}
            />
          </Stack>
        }
      >
        <StatisticsTrendChart data={expenseTrend} viewMode={trendViewMode} />
      </StatisticsSectionCard>

      <Stack gap={1}>
        <Typography variant="overline" color="text.secondary">
          여행별
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.4fr) minmax(320px, 0.8fr)' },
            gap: 2,
          }}
        >
          <StatisticsSectionCard
            title="여행별 지출 순위"
            tone="blue"
            action={
              <StatisticsViewConfigButton
                title="여행별 지출 순위"
                options={[
                  { value: 'horizontal-bar', label: '가로 막대형', caption: '여행 이름과 금액을 함께 읽어요' },
                  { value: 'vertical-bar', label: '세로 막대형', caption: '상위 여행 비교가 빠르게 보여요' },
                  { value: 'donut', label: '도넛형', caption: '여행별 비중을 중심으로 봐요' },
                ]}
                value={travelViewMode}
                onChange={setTravelViewMode}
              />
            }
          >
            {travelViewMode === 'vertical-bar' ? (
              <StatisticsColumnChart
                data={travelSummaries.map((summaryItem) => ({
                  id: summaryItem.trip.id,
                  label: summaryItem.trip.name,
                  value: summaryItem.totalAmountInKRW,
                  helper: `${Math.round(summaryItem.share * 100)}%`,
                }))}
                formatValue={formatCurrency}
              />
            ) : travelViewMode === 'donut' ? (
              <StatisticsDonutChart
                data={travelSummaries.slice(0, 5).map((summaryItem) => ({
                  id: summaryItem.trip.id,
                  label: summaryItem.trip.name,
                  value: summaryItem.totalAmountInKRW,
                  helper: `${Math.round(summaryItem.share * 100)}%`,
                }))}
                formatValue={formatCurrency}
                centerLabel="가장 큰 지출"
                centerValue={travelSummaries[0]?.trip.name ?? '-'}
              />
            ) : (
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
            )}
          </StatisticsSectionCard>

          <StatisticsSectionCard
            title="결제자 순위"
            tone="amber"
            action={
              <StatisticsViewConfigButton
                title="결제자 순위"
                options={[
                  { value: 'donut', label: '도넛형', caption: '결제 비중을 중심으로 봐요' },
                  { value: 'horizontal-bar', label: '가로 막대형', caption: '이름과 금액을 함께 읽어요' },
                  { value: 'vertical-bar', label: '세로 막대형', caption: '인원 간 차이를 한눈에 비교해요' },
                ]}
                value={payerViewMode}
                onChange={setPayerViewMode}
              />
            }
          >
            {payerViewMode === 'horizontal-bar' ? (
              <Stack gap={1.5}>
                {payerSummaries.slice(0, 5).map((summaryItem, index) => (
                  <StatisticsBarChart
                    key={`${summaryItem.name}-${index}`}
                    label={summaryItem.name}
                    value={formatCurrency(summaryItem.totalAmountInKRW)}
                    ratio={
                      payerSummaries[0]?.totalAmountInKRW
                        ? summaryItem.totalAmountInKRW / payerSummaries[0].totalAmountInKRW
                        : 0
                    }
                    helper={`${summaryItem.tripCount}개 여행 · ${summaryItem.paymentCount}회 결제`}
                    tone="amber"
                  />
                ))}
              </Stack>
            ) : payerViewMode === 'vertical-bar' ? (
              <StatisticsColumnChart
                data={payerSummaries.slice(0, 5).map((summaryItem, index) => ({
                  id: `${summaryItem.name}-${index}`,
                  label: summaryItem.name,
                  value: summaryItem.totalAmountInKRW,
                  helper: `${summaryItem.tripCount}개 여행`,
                }))}
                formatValue={formatCurrency}
                colors={['#d68d06', '#e6a93d', '#efc46d', '#f4d999', '#faecc8']}
              />
            ) : (
              <StatisticsDonutChart
                data={payerSummaries.slice(0, 5).map((summaryItem, index) => ({
                  id: `${summaryItem.name}-${index}`,
                  label: summaryItem.name,
                  value: summaryItem.totalAmountInKRW,
                  helper: `${summaryItem.tripCount}개 여행 · ${summaryItem.paymentCount}회 결제`,
                }))}
                formatValue={formatCurrency}
                colors={['#d68d06', '#e6a93d', '#efc46d', '#f4d999', '#faecc8']}
                centerLabel="최다 결제"
                centerValue={payerSummaries[0] ? payerSummaries[0].name : '-'}
              />
            )}
          </StatisticsSectionCard>
        </Box>
      </Stack>

      <Stack gap={1}>
        <Typography variant="overline" color="text.secondary">
          카테고리별
        </Typography>
        <StatisticsSectionCard
          title="카테고리별 지출 순위"
          tone="blue"
          action={
            <StatisticsViewConfigButton
              title="카테고리별 지출 순위"
              options={[
                { value: 'donut', label: '도넛형', caption: '카테고리 비중을 한눈에 봐요' },
                { value: 'horizontal-bar', label: '가로 막대형', caption: '카테고리 이름과 금액을 함께 읽어요' },
                { value: 'vertical-bar', label: '세로 막대형', caption: '카테고리 간 차이를 빠르게 비교해요' },
              ]}
              value={categoryExpenseViewMode}
              onChange={setCategoryExpenseViewMode}
            />
          }
        >
          {categoryExpenseViewMode === 'horizontal-bar' ? (
            <Stack gap={1.5}>
              {categoryExpenseSummaries.map((summaryItem, index) => (
                <StatisticsBarChart
                  key={summaryItem.category}
                  label={`${index + 1}. ${summaryItem.label}`}
                  value={formatCurrency(summaryItem.totalAmountInKRW)}
                  ratio={
                    categoryExpenseSummaries[0]?.totalAmountInKRW
                      ? summaryItem.totalAmountInKRW / categoryExpenseSummaries[0].totalAmountInKRW
                      : 0
                  }
                  helper={`${summaryItem.expenseCount}건 · ${Math.round(summaryItem.share * 100)}%`}
                  tone="blue"
                />
              ))}
            </Stack>
          ) : categoryExpenseViewMode === 'vertical-bar' ? (
            <StatisticsColumnChart
              data={categoryExpenseSummaries.map((summaryItem) => ({
                id: summaryItem.category,
                label: summaryItem.label,
                value: summaryItem.totalAmountInKRW,
                helper: `${Math.round(summaryItem.share * 100)}%`,
              }))}
              formatValue={formatCurrency}
              colors={categoryExpenseSummaries.map((s) => s.color)}
            />
          ) : (
            <StatisticsDonutChart
              data={categoryExpenseSummaries.map((summaryItem) => ({
                id: summaryItem.category,
                label: summaryItem.label,
                value: summaryItem.totalAmountInKRW,
                helper: `${summaryItem.expenseCount}건 · ${Math.round(summaryItem.share * 100)}%`,
              }))}
              formatValue={formatCurrency}
              colors={categoryExpenseSummaries.map((s) => s.color)}
              centerLabel="최다 지출"
              centerValue={categoryExpenseSummaries[0]?.label ?? '-'}
            />
          )}
        </StatisticsSectionCard>
      </Stack>
    </Stack>
  )
}
