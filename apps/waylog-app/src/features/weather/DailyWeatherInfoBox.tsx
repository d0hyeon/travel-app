import { useDailyWeatherForecast, type UseDailyWeatherForecastParams } from '@waylog/domains/modules/weather'
import type { DayPart } from '@waylog/domains/modules/weather'
import { Suspense } from 'react'
import { Box, Skeleton, Stack, Typography } from '~/shared/components/design-system'
import { palette, radius } from '../../shared/config/tokens'
import { WeatherIcon } from './WeatherIcon'
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native'

interface Props extends UseDailyWeatherForecastParams {
  dayPart?: DayPart
  style?: StyleProp<ViewStyle>
}

export function DailyWeatherInfoBox(props: Props) {
  return (
    <Suspense fallback={<Pending style={props.style} />}>
      <Resolved {...props} />
    </Suspense>
  )
}
DailyWeatherInfoBox.Skeleton = Pending

function Resolved({ coordinate, date, dayPart, style }: Props) {
  const { data: weatherForecast } = useDailyWeatherForecast({ coordinate, date })

  if (weatherForecast == null) return null

  const forecast = dayPart
    ? weatherForecast.forecast.periods[dayPart]
    : weatherForecast.forecast.summary

  return (
    <Box style={style}>
      <Stack alignItems="center" gap={1} style={BOX_STYLE}>
        <Stack direction="row" gap={0.5}>
          <Typography variant="body2" style={styles.lowTemperature}>
            {forecast.minimumTemperature}도
          </Typography>
          <Typography variant="body2">/</Typography>
          <Typography variant="body2" style={styles.highTemperature}>
            {forecast.maximumTemperature}도
          </Typography>
        </Stack>
        <WeatherIcon size={32} {...forecast} />
      </Stack>
    </Box>
  )
}

function Pending({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <Box style={style}>
      <Stack alignItems="center" gap={1} style={BOX_STYLE}>
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

const styles = StyleSheet.create({
  lowTemperature: { color: palette.primary },
  highTemperature: { color: '#d32f2f' },
})
