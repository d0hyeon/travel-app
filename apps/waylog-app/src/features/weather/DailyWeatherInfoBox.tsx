import { useDailyWeatherForecast, type UseDailyWeatherForecastParams } from '@waylog/domains/weather'
import type { DayPart } from '@waylog/domains/weather'
import { Suspense } from 'react'
import { Box, Skeleton, Stack, Typography } from '../../shared/components/mui'
import { palette, radius } from '../../shared/config/tokens'
import { WeatherIcon } from './WeatherIcon'
import type { Sx } from '../../shared/components/mui'

interface Props extends UseDailyWeatherForecastParams {
  dayPart?: DayPart
  sx?: Sx
}

export function DailyWeatherInfoBox(props: Props) {
  return (
    <Suspense fallback={<Pending sx={props.sx} />}>
      <Resolved {...props} />
    </Suspense>
  )
}
DailyWeatherInfoBox.Skeleton = Pending

function Resolved({ coordinate, date, dayPart, sx }: Props) {
  const { data: weatherForecast } = useDailyWeatherForecast({ coordinate, date })

  if (weatherForecast == null) return null

  const forecast = dayPart
    ? weatherForecast.forecast.periods[dayPart]
    : weatherForecast.forecast.summary

  return (
    <Box sx={sx}>
      <Stack alignItems="center" gap={1} sx={BOX_STYLE}>
        <Stack direction="row" gap={0.5}>
          <Typography variant="body2" sx={{ color: palette.primary }}>
            {forecast.minimumTemperature}도
          </Typography>
          <Typography variant="body2">/</Typography>
          <Typography variant="body2" sx={{ color: '#d32f2f' }}>
            {forecast.maximumTemperature}도
          </Typography>
        </Stack>
        <WeatherIcon size={32} {...forecast} />
      </Stack>
    </Box>
  )
}

function Pending({ sx }: { sx?: Sx }) {
  return (
    <Box sx={sx}>
      <Stack alignItems="center" gap={1} sx={BOX_STYLE}>
        <Stack direction="row" gap={0.5}>
          <Skeleton variant="text" width={20} />
          <Typography variant="body2">/</Typography>
          <Skeleton variant="text" width={20} />
        </Stack>
        <Skeleton variant="circular" width={30} height={30} />
      </Stack>
    </Box>
  )
}

const BOX_STYLE = {
  paddingVertical: 16,
  borderRadius: radius.md,
  borderWidth: 1,
  borderColor: palette.divider,
} as const
