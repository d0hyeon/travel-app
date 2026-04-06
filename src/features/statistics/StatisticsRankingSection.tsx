import { Box, Stack, Typography } from '@mui/material'
import { formatCurrency } from '~features/expense/expense.utils'
import { StatisticsBarChart } from '~shared/components/statistics/StatisticsBarChart'
import { StatisticsColumnChart } from '~shared/components/statistics/StatisticsColumnChart'
import { StatisticsDonutChart } from '~shared/components/statistics/StatisticsDonutChart'
import { StatisticsSectionCard } from './StatisticsSectionCard'
import {
  StatisticsViewConfigButton,
  useStatisticsChartViewMode,
} from './StatisticsViewConfigButton'
import type { StatisticsSummary } from './statistics-expense/useStatisticsSummary'

interface StatisticsRankingSectionProps {
  summary: StatisticsSummary
}

function getTripDays(startDate: string, endDate: string) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diff = end.getTime() - start.getTime()
  return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)) + 1)
}

export function StatisticsRankingSection({ summary }: StatisticsRankingSectionProps) {
  const [travelViewMode, setTravelViewMode] = useStatisticsChartViewMode('travel-spend', 'horizontal-bar')
  const [payerViewMode, setPayerViewMode] = useStatisticsChartViewMode('payer-ranking', 'donut')
  const [cityViewMode, setCityViewMode] = useStatisticsChartViewMode('city-visit', 'vertical-bar')
  const [regionViewMode, setRegionViewMode] = useStatisticsChartViewMode('region-visit', 'donut')
  const [activityViewMode, setActivityViewMode] = useStatisticsChartViewMode('activity-trip', 'vertical-bar')
  const {
    travelSummaries,
    payerSummaries,
    regionVisitSummaries,
    cityVisitSummaries,
    activityTripSummaries,
  } = summary

  const topTravelAmount = travelSummaries[0]?.totalAmountInKRW ?? 0

  return (
    <Stack gap={3}>
      <Stack gap={1}>
        <Typography variant="overline" color="text.secondary">
          지출
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
                    label={`${summaryItem.emoji} ${summaryItem.name}`}
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
                  label: `${summaryItem.emoji} ${summaryItem.name}`,
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
          방문
        </Typography>
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
      </Stack>

      <Stack gap={1}>
        <Typography variant="overline" color="text.secondary">
          활동
        </Typography>
        <StatisticsSectionCard
          title="활동량이 많은 여행 순위"
          tone="blue"
          action={
            <StatisticsViewConfigButton
              title="활동량이 많은 여행 순위"
              options={[
                { value: 'vertical-bar', label: '세로 막대형', caption: '활동량 차이를 빠르게 비교해요' },
                { value: 'horizontal-bar', label: '가로 막대형', caption: '여행 이름과 활동량을 함께 읽어요' },
                { value: 'donut', label: '도넛형', caption: '상위 여행 비중을 중심으로 봐요' },
              ]}
              value={activityViewMode}
              onChange={setActivityViewMode}
            />
          }
        >
          {activityViewMode === 'horizontal-bar' ? (
            <Stack gap={1.5}>
              {activityTripSummaries.map((summaryItem, index) => (
                <StatisticsBarChart
                  key={`${summaryItem.trip.id}-activity`}
                  label={`${index + 1}. ${summaryItem.trip.name}`}
                  value={`${summaryItem.placeCount}곳 / 일 평균 ${Number((summaryItem.placeCount / getTripDays(summaryItem.trip.startDate, summaryItem.trip.endDate)).toFixed(1)).toLocaleString()}`}
                  ratio={
                    activityTripSummaries[0]?.placeCount
                      ? summaryItem.placeCount / activityTripSummaries[0].placeCount
                      : 0
                  }
                  tone="blue"
                />
              ))}
            </Stack>
          ) : activityViewMode === 'donut' ? (
            <StatisticsDonutChart
              data={activityTripSummaries.slice(0, 5).map((summaryItem) => ({
                id: summaryItem.trip.id,
                label: summaryItem.trip.name,
                value: summaryItem.placeCount,
                helper: `일 평균 ${Number(
                  (summaryItem.placeCount / getTripDays(summaryItem.trip.startDate, summaryItem.trip.endDate)).toFixed(1),
                ).toLocaleString()}`,
              }))}
              formatValue={(value) => `${value}곳`}
              centerLabel="가장 활동적"
              centerValue={activityTripSummaries[0]?.trip.name ?? '-'}
            />
          ) : (
            <StatisticsColumnChart
              data={activityTripSummaries.slice(0, 6).map((summaryItem) => ({
                id: summaryItem.trip.id,
                label: summaryItem.trip.name,
                value: summaryItem.placeCount,
                helper: `일 평균 ${Number(
                  (summaryItem.placeCount / getTripDays(summaryItem.trip.startDate, summaryItem.trip.endDate)).toFixed(1),
                ).toLocaleString()}`,
              }))}
              formatValue={(value) => `${value}곳`}
              colors={['#4C84FF', '#709dff', '#95b8ff', '#bed3ff', '#dce8ff', '#edf3ff']}
            />
          )}
        </StatisticsSectionCard>
      </Stack>
    </Stack>
  )
}
