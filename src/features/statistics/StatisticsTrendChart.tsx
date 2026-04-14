import { Box, Stack, ToggleButton, ToggleButtonGroup, Typography, useTheme } from '@mui/material'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { TooltipContentProps } from 'recharts'
import { formatDate } from 'date-fns'
import { formatCurrency } from '~features/expense/expense.utils'
import type { StatisticsChartViewMode } from './StatisticsViewConfigButton'
import type { ExpenseTrendPoint } from './statistics-expense/useStatisticsSummary'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { useStorageState } from '~shared/hooks/useStorageState'

interface StatisticsTrendChartProps {
  data: ExpenseTrendPoint[]
  mode: TrendMode
  viewMode?: StatisticsChartViewMode
}

export type TrendMode = 'cumulative' | 'single'

export function StatisticsTrendChart({ data, mode, viewMode = 'line' }: StatisticsTrendChartProps) {
  const theme = useTheme()
  const dataKey = mode === 'cumulative' ? 'cumulativeAmountInKRW' : 'amountInKRW'
  const lineColor = mode === 'cumulative' ? theme.palette.primary.main : theme.palette.success.main
  const chartData = data.map((point) => ({
    ...point,
    axisId: point.tripId,
  }))
  const getDateRangeLabel = (startDate: string, endDate: string) =>
    `${formatDate(startDate, 'yyyy.MM.dd')} ~ ${formatDate(endDate, 'MM.dd')}`

  const tooltipContent = ({ active, payload }: TooltipContentProps<any, any>) => {
    if (!active || !payload?.length) return null
    const point = payload[0]?.payload as ExpenseTrendPoint

    return (
      <Stack
        sx={{
          bgcolor: '#fff',
          border: '1px solid #e6e6e6',
          borderRadius: 2,
          p: 1.25,
          minWidth: 180,
        }}
        gap={0.5}
      >
        <Typography fontSize={13} fontWeight={700}>
          {point.tripName}
        </Typography>
        <Typography fontSize={12}>
          {getDateRangeLabel(point.startDate, point.endDate)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          이번 여행 {formatCurrency(point.amountInKRW)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          누적 {formatCurrency(point.cumulativeAmountInKRW)}
        </Typography>
      </Stack>
    )
  }

  const isMobile = useIsMobile();

  return (
    <Box sx={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        {viewMode === 'bar' ? (
          <BarChart data={chartData} margin={{ top: 12, right: 20, left: 8, bottom: 12 }} barCategoryGap={18}>
            <CartesianGrid stroke="#f1f1f1" vertical={false} />
            <XAxis
              dataKey="axisId"
              tickLine={false}
              axisLine={false}
              interval={0}
              height={68}
              tick={(props: { x?: number | string; y?: number | string; payload?: { value?: string } }) => {
                const { x, y, payload } = props
                const point = data.find((item) => item.tripId === payload?.value)

                if (x == null || y == null || !point) return null

                return (
                  <g transform={`translate(${Number(x)},${Number(y)})`}>
                    <text textAnchor="middle" fill={theme.palette.text.secondary} fontSize="11">
                      <tspan x="0" dy="16">{point.tripName}</tspan>
                    </text>
                  </g>
                )
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
              tickFormatter={(value: number) => `${Math.round(value / 10000)}만`}
            />
            <Tooltip cursor={{ fill: '#fafafa' }} content={tooltipContent} />
            <Bar dataKey={dataKey} fill={lineColor} radius={[8, 8, 0, 0]} maxBarSize={36} />
          </BarChart>
        ) : (
          <LineChart data={chartData} margin={{ top: 12, right: 20, left: 8, bottom: 12 }}>
            <CartesianGrid stroke="#f1f1f1" vertical={false} />
            <XAxis
              dataKey="axisId"
              tickLine={false}
              axisLine={false}
              interval={0}
              height={68}
              tick={(props: { x?: number | string; y?: number | string; payload?: { value?: string } }) => {
                const { x, y, payload } = props
                const point = data.find((item) => item.tripId === payload?.value)

                if (x == null || y == null || !point) return null

                return (
                  <g transform={`translate(${Number(x)},${Number(y)})`}>
                    <text textAnchor="middle" fill={theme.palette.text.secondary} fontSize="11">
                      <tspan x="0" dy="16">{point.tripName}</tspan>
                    </text>
                  </g>
                )
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              // width={50}

              tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
              tickFormatter={(value: number) => `${Math.round(value / 10000)}만`}
            />
            <Tooltip
              cursor={{ stroke: '#d9e7ff', strokeWidth: 1 }}
              content={tooltipContent}
              trigger={isMobile ? 'click' : 'hover'}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={lineColor}
              strokeWidth={3}
              dot={{ r: 4, fill: lineColor, stroke: '#fff', strokeWidth: 2 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </Box>
  )
}

export function StatisticsTrendModeToggle({
  value,
  onChange,
}: {
  value: TrendMode
  onChange: (value: TrendMode) => void
}) {
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={(_, nextValue: TrendMode | null) => {
        if (nextValue) onChange(nextValue)
      }}
      size="small"
      sx={{
        '& .MuiToggleButton-root': {
          minWidth: 56,
          minHeight: 30,
          px: 1.25,
          py: 0,
          fontSize: 12,
          fontWeight: 600,
          borderColor: '#e6e6e6',
          color: 'text.secondary',
          lineHeight: 1,
        },
        '& .MuiToggleButton-root.Mui-selected': {
          bgcolor: '#f5f5f5',
          color: 'text.primary',
        },
        '& .MuiToggleButton-root.Mui-selected:hover': {
          bgcolor: '#efefef',
        },
      }}
    >
      <ToggleButton value="cumulative">누적</ToggleButton>
      <ToggleButton value="single">여행별</ToggleButton>
    </ToggleButtonGroup>
  )
}

export function useStatisticsTrendMode(defaultValue: TrendMode = 'cumulative') {
  return useStorageState<TrendMode>('statistics-trend-mode', defaultValue);
}
