import { Box, Stack, Typography, useTheme } from '@mui/material'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

interface StatisticsDonutChartItem {
  id: string
  label: string
  value: number
  helper?: string
}

interface StatisticsDonutChartProps {
  data: StatisticsDonutChartItem[]
  formatValue?: (value: number) => string
  colors?: string[]
  centerLabel?: string
  centerValue?: string
}

const DEFAULT_COLORS = ['#4C84FF', '#7BA7FF', '#A9C4FF', '#D1E0FF', '#E7EEFF']

export function StatisticsDonutChart({
  data,
  formatValue = (value) => `${value}`,
  colors = DEFAULT_COLORS,
  centerLabel,
  centerValue,
}: StatisticsDonutChartProps) {
  const theme = useTheme()

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(180px, 220px) minmax(0, 1fr)' },
        gap: 2,
        alignItems: 'center',
      }}
    >
      <Box sx={{ width: '100%', height: 220, position: 'relative' }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={54}
              outerRadius={82}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((item, index) => (
                <Cell key={item.id} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              wrapperStyle={{ zIndex: 10 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const item = payload[0]?.payload as StatisticsDonutChartItem

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
          </PieChart>
        </ResponsiveContainer>

        {(centerLabel || centerValue) && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <Stack alignItems="center" gap={0.25}>
              {centerLabel ? (
                <Typography fontSize={12} color="text.secondary">
                  {centerLabel}
                </Typography>
              ) : null}
              {centerValue ? (
                <Typography fontSize={15} fontWeight={800}>
                  {centerValue}
                </Typography>
              ) : null}
            </Stack>
          </Box>
        )}
      </Box>

      <Stack gap={1}>
        {data.map((item, index) => (
          <Box
            key={item.id}
            sx={{
              display: 'grid',
              gridTemplateColumns: 'auto minmax(0, 1fr) auto',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: colors[index % colors.length],
              }}
            />
            <Box minWidth={0}>
              <Typography fontSize={13} fontWeight={700} noWrap>
                {item.label}
              </Typography>
              {item.helper ? (
                <Typography fontSize={12} color="text.secondary" noWrap>
                  {item.helper}
                </Typography>
              ) : null}
            </Box>
            <Typography fontSize={12} color={theme.palette.text.secondary} whiteSpace="nowrap">
              {formatValue(item.value)}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  )
}
