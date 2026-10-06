import { Box, Stack, Typography, useTheme } from '@mui/material'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface StatisticsColumnChartItem {
  id: string
  label: string
  value: number
  helper?: string
}

interface StatisticsColumnChartProps {
  data: StatisticsColumnChartItem[]
  formatValue?: (value: number) => string
  colors?: string[]
}

const DEFAULT_COLORS = ['#4C84FF', '#7BA7FF', '#A9C4FF', '#D1E0FF', '#E7EEFF']

export function StatisticsColumnChart({
  data,
  formatValue = (value) => `${value}`,
  colors = DEFAULT_COLORS,
}: StatisticsColumnChartProps) {
  const theme = useTheme()

  return (
    <Box sx={{ width: '100%', height: 280 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 8 }} barCategoryGap={18}>
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            interval={0}
            height={42}
            tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={40}
            tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: '#fafafa' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const item = payload[0]?.payload as StatisticsColumnChartItem

              return (
                <Stack
                  sx={{
                    bgcolor: '#fff',
                    border: '1px solid #e6e6e6',
                    borderRadius: 2,
                    p: 1.25,
                    minWidth: 160,
                  }}
                  gap={0.5}
                >
                  <Typography fontSize={13} fontWeight={700}>
                    {item.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatValue(item.value)}
                  </Typography>
                  {item.helper ? (
                    <Typography variant="caption" color="text.secondary">
                      {item.helper}
                    </Typography>
                  ) : null}
                </Stack>
              )
            }}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={40}>
            {data.map((item, index) => (
              <Cell key={item.id} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  )
}
