import { Box, Chip, Stack } from '@mui/material'
import { formatCurrency } from '~features/expense/expense.utils'
import { StatisticsBarChart } from '~shared/components/statistics/StatisticsBarChart'
import { StatisticsColumnChart } from '~shared/components/statistics/StatisticsColumnChart'
import { StatisticsDonutChart } from '~shared/components/statistics/StatisticsDonutChart'
import { StatisticsHeroPanel } from './StatisticsHeroPanel'
import { StatisticsSectionCard } from './StatisticsSectionCard'
import { StatisticsSummaryCard } from './StatisticsSummaryCard'
import {
  StatisticsTrendChart,
  StatisticsTrendModeToggle,
  useStatisticsTrendMode,
} from './StatisticsTrendChart'
import {
  StatisticsViewConfigButton,
  useStatisticsChartViewMode,
} from './StatisticsViewConfigButton'
import type { StatisticsSummary } from './statistics-expense/useStatisticsSummary'

interface StatisticsOverviewSectionProps {
  summary: StatisticsSummary
}

export function StatisticsOverviewSection({ summary }: StatisticsOverviewSectionProps) {
  const [trendMode, setTrendMode] = useStatisticsTrendMode()
  const [trendViewMode, setTrendViewMode] = useStatisticsChartViewMode('trend', 'line')
  const [travelViewMode, setTravelViewMode] = useStatisticsChartViewMode('travel-spend', 'horizontal-bar')
  const [activityViewMode, setActivityViewMode] = useStatisticsChartViewMode('activity-trip', 'horizontal-bar')
  const [cityViewMode, setCityViewMode] = useStatisticsChartViewMode('city-visit', 'vertical-bar')
  const [regionViewMode, setRegionViewMode] = useStatisticsChartViewMode('region-visit', 'donut')
  const [categoryVisitViewMode, setCategoryVisitViewMode] = useStatisticsChartViewMode('category-visit', 'donut')
  const {
    totalAmountInKRW,
    totalTripsCount,
    totalPlacesCount,
    averageTripAmountInKRW,
    topRegion,
    travelSummaries,
    currencySummaries,
    activityTripSummaries,
    cityVisitSummaries,
    regionVisitSummaries,
    categoryVisitSummaries,
    expenseTrend,
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

      <StatisticsSectionCard title="요약" tone="mint">
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

      <StatisticsSectionCard
        title="지출 추이"
        tone="blue"
        action={
          <Stack direction="row" gap={0.75} alignItems="center">
            <StatisticsTrendModeToggle value={trendMode} onChange={setTrendMode} />
            <StatisticsViewConfigButton
              title="지출 추이"
              options={[
                { value: 'line', label: '라인형', caption: '흐름 변화를 부드럽게 봐요' },
                { value: 'bar', label: '막대형', caption: '여행별 값 차이를 또렷하게 봐요' },
              ]}
              value={trendViewMode}
              onChange={setTrendViewMode}
            />
          </Stack>
        }
      >
        <StatisticsTrendChart data={expenseTrend} mode={trendMode} viewMode={trendViewMode} />
      </StatisticsSectionCard>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(12, minmax(0, 1fr))' },
          gap: 2,
        }}
      >
        <Box sx={{ gridColumn: { xs: '1 / -1', md: '1 / span 7' } }}>
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
                data={travelSummaries.slice(0, 5).map((summaryItem) => ({
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
            )}
          </StatisticsSectionCard>
        </Box>

        <Box sx={{ gridColumn: { xs: '1 / -1', md: '8 / span 5' } }}>
          <StatisticsSectionCard
            title="활동량 많은 여행 순위"
            tone="amber"
            action={
              <StatisticsViewConfigButton
                title="활동량 많은 여행 순위"
                options={[
                  { value: 'horizontal-bar', label: '가로 막대형', caption: '여행 이름과 활동량을 함께 읽어요' },
                  { value: 'vertical-bar', label: '세로 막대형', caption: '활동량 차이를 직관적으로 비교해요' },
                  { value: 'donut', label: '도넛형', caption: '상위 여행 비중을 중심으로 봐요' },
                ]}
                value={activityViewMode}
                onChange={setActivityViewMode}
              />
            }
          >
            {activityViewMode === 'vertical-bar' ? (
              <StatisticsColumnChart
                data={activityTripSummaries.slice(0, 5).map((summaryItem) => ({
                  id: summaryItem.trip.id,
                  label: summaryItem.trip.name,
                  value: summaryItem.placeCount,
                  helper: summaryItem.trip.destination,
                }))}
                formatValue={(value) => `${value}곳`}
                colors={['#d68d06', '#e6a93d', '#efc46d', '#f4d999', '#faecc8']}
              />
            ) : activityViewMode === 'donut' ? (
              <StatisticsDonutChart
                data={activityTripSummaries.slice(0, 5).map((summaryItem) => ({
                  id: summaryItem.trip.id,
                  label: summaryItem.trip.name,
                  value: summaryItem.placeCount,
                  helper: summaryItem.trip.destination,
                }))}
                formatValue={(value) => `${value}곳`}
                colors={['#d68d06', '#e6a93d', '#efc46d', '#f4d999', '#faecc8']}
                centerLabel="가장 활동적"
                centerValue={activityTripSummaries[0]?.trip.name ?? '-'}
              />
            ) : (
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
            )}
          </StatisticsSectionCard>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          gap: 2,
        }}
      >
        <StatisticsSectionCard
          title="도시 방문 순위"
          tone="mint"
          action={
            <StatisticsViewConfigButton
              title="도시 방문 순위"
              options={[
                { value: 'vertical-bar', label: '세로 막대형', caption: '도시 간 횟수 차이를 빠르게 봐요' },
                { value: 'horizontal-bar', label: '가로 막대형', caption: '도시 이름을 길게 읽기 좋아요' },
                { value: 'donut', label: '도넛형', caption: '상위 도시 비중을 중심으로 봐요' },
              ]}
              value={cityViewMode}
              onChange={setCityViewMode}
            />
          }
        >
          {cityViewMode === 'horizontal-bar' ? (
            <Stack gap={1.25}>
              {cityVisitSummaries.map((summaryItem, index) => (
                <StatisticsBarChart
                  key={`${summaryItem.city}-${index}`}
                  label={`${index + 1}. ${summaryItem.city}`}
                  value={`${summaryItem.tripCount}회`}
                  ratio={cityVisitSummaries[0]?.tripCount ? summaryItem.tripCount / cityVisitSummaries[0].tripCount : 0}
                  helper={`${Math.round(summaryItem.share * 100)}%`}
                  tone="mint"
                />
              ))}
            </Stack>
          ) : cityViewMode === 'donut' ? (
            <StatisticsDonutChart
              data={cityVisitSummaries.slice(0, 5).map((summaryItem, index) => ({
                id: `${summaryItem.city}-${index}`,
                label: summaryItem.city,
                value: summaryItem.tripCount,
                helper: `${Math.round(summaryItem.share * 100)}%`,
              }))}
              formatValue={(value) => `${value}회`}
              colors={['#2a9d6f', '#52b78a', '#82d2ae', '#b4e8d1', '#ddf7eb']}
              centerLabel="자주 가는 도시"
              centerValue={cityVisitSummaries[0]?.city ?? '-'}
            />
          ) : (
            <StatisticsColumnChart
              data={cityVisitSummaries.slice(0, 6).map((summaryItem, index) => ({
                id: `${summaryItem.city}-${index}`,
                label: summaryItem.city,
                value: summaryItem.tripCount,
                helper: `${Math.round(summaryItem.share * 100)}%`,
              }))}
              formatValue={(value) => `${value}회`}
              colors={['#2a9d6f', '#4cb88a', '#72cf9f', '#97dfb7', '#bceecf', '#ddf7e7']}
            />
          )}
        </StatisticsSectionCard>

        <StatisticsSectionCard
          title="지역/국가 방문 순위"
          tone="mint"
          action={
            <StatisticsViewConfigButton
              title="지역/국가 방문 순위"
              options={[
                { value: 'donut', label: '도넛형', caption: '지역 비중을 중심으로 봐요' },
                { value: 'horizontal-bar', label: '가로 막대형', caption: '지역 이름과 횟수를 함께 읽어요' },
                { value: 'vertical-bar', label: '세로 막대형', caption: '지역 간 차이를 빠르게 비교해요' },
              ]}
              value={regionViewMode}
              onChange={setRegionViewMode}
            />
          }
        >
          {regionViewMode === 'horizontal-bar' ? (
            <Stack gap={1.25}>
              {regionVisitSummaries.map((summaryItem, index) => (
                <StatisticsBarChart
                  key={`${summaryItem.region}-${index}`}
                  label={`${index + 1}. ${summaryItem.region}`}
                  value={`${summaryItem.tripCount}회`}
                  ratio={regionVisitSummaries[0]?.tripCount ? summaryItem.tripCount / regionVisitSummaries[0].tripCount : 0}
                  helper={`${Math.round(summaryItem.share * 100)}%`}
                  tone="mint"
                />
              ))}
            </Stack>
          ) : regionViewMode === 'vertical-bar' ? (
            <StatisticsColumnChart
              data={regionVisitSummaries.slice(0, 6).map((summaryItem, index) => ({
                id: `${summaryItem.region}-${index}`,
                label: summaryItem.region,
                value: summaryItem.tripCount,
                helper: `${Math.round(summaryItem.share * 100)}%`,
              }))}
              formatValue={(value) => `${value}회`}
              colors={['#2a9d6f', '#4cb88a', '#72cf9f', '#97dfb7', '#bceecf', '#ddf7e7']}
            />
          ) : (
            <StatisticsDonutChart
              data={regionVisitSummaries.slice(0, 5).map((summaryItem, index) => ({
                id: `${summaryItem.region}-${index}`,
                label: summaryItem.region,
                value: summaryItem.tripCount,
                helper: `${Math.round(summaryItem.share * 100)}%`,
              }))}
              formatValue={(value) => `${value}회`}
              colors={['#2a9d6f', '#52b78a', '#82d2ae', '#b4e8d1', '#ddf7eb']}
              centerLabel="자주 가는 지역"
              centerValue={regionVisitSummaries[0] ? regionVisitSummaries[0].region : '-'}
            />
          )}
        </StatisticsSectionCard>
      </Box>

      <StatisticsSectionCard
        title="카테고리별 방문 순위"
        tone="mint"
        action={
          <StatisticsViewConfigButton
            title="카테고리별 방문 순위"
            options={[
              { value: 'donut', label: '도넛형', caption: '카테고리 비중을 한눈에 봐요' },
              { value: 'horizontal-bar', label: '가로 막대형', caption: '카테고리 이름과 횟수를 함께 읽어요' },
              { value: 'vertical-bar', label: '세로 막대형', caption: '카테고리 간 차이를 빠르게 비교해요' },
            ]}
            value={categoryVisitViewMode}
            onChange={setCategoryVisitViewMode}
          />
        }
      >
        {categoryVisitViewMode === 'horizontal-bar' ? (
          <Stack gap={1.25}>
            {categoryVisitSummaries.map((summaryItem, index) => (
              <StatisticsBarChart
                key={summaryItem.category}
                label={`${index + 1}. ${summaryItem.label}`}
                value={`${summaryItem.placeCount}곳`}
                ratio={
                  categoryVisitSummaries[0]?.placeCount
                    ? summaryItem.placeCount / categoryVisitSummaries[0].placeCount
                    : 0
                }
                helper={`${Math.round(summaryItem.share * 100)}%`}
                tone="mint"
              />
            ))}
          </Stack>
        ) : categoryVisitViewMode === 'vertical-bar' ? (
          <StatisticsColumnChart
            data={categoryVisitSummaries.map((summaryItem) => ({
              id: summaryItem.category,
              label: summaryItem.label,
              value: summaryItem.placeCount,
              helper: `${Math.round(summaryItem.share * 100)}%`,
            }))}
            formatValue={(value) => `${value}곳`}
            colors={categoryVisitSummaries.map((s) => s.color)}
          />
        ) : (
          <StatisticsDonutChart
            data={categoryVisitSummaries.map((summaryItem) => ({
              id: summaryItem.category,
              label: summaryItem.label,
              value: summaryItem.placeCount,
              helper: `${Math.round(summaryItem.share * 100)}%`,
            }))}
            formatValue={(value) => `${value}곳`}
            colors={categoryVisitSummaries.map((s) => s.color)}
            centerLabel="많이 간 카테고리"
            centerValue={categoryVisitSummaries[0]?.label ?? '-'}
          />
        )}
      </StatisticsSectionCard>
    </Stack>
  )
}
