import { formatDate, isSameHour } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useCurrentTime } from '@waylog/react'
import { arrayIncludes, reverseKeyValue } from '@waylog/utility'
import {
  PRECIPITATION_SNOW_TYPES,
  PrecipitationType,
  SkyCondition,
  type HourlyWeatherForecast,
} from '@waylog/domains/modules/weather'
import { Box, Divider, Stack, Typography } from '../../shared/components/mui'
import { palette } from '../../shared/config/tokens'
import { WeatherIcon } from './WeatherIcon'

const SKY_CONDITION_LABEL = reverseKeyValue(SkyCondition)

interface Props {
  forecast: HourlyWeatherForecast
  /**
   * 눈/비 표기의 기준이 되는 강수 형태.
   * 기존 동작을 유지하기 위해 항목 자신이 아니라 하루 요약값을 받는다.
   */
  precipitationType: PrecipitationType
}

export function HourlyForecastItem({ forecast, precipitationType }: Props) {
  const now = useCurrentTime()

  const isSnowy = arrayIncludes(PRECIPITATION_SNOW_TYPES, precipitationType)
  const isCurrentHour = isSameHour(now, forecast.forecastAt)

  return (
    <Stack
      gap={0.5}
      sx={{
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: isCurrentHour ? palette.primary : palette.divider,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle2">
          {formatDate(forecast.forecastAt, 'b h시', { locale: ko })}
        </Typography>
        <Stack direction="row" alignItems="center" gap={0.5}>
          <Box
            sx={{
              borderRadius: 999,
              padding: 4,
              backgroundColor: isSnowy ? 'rgba(0,0,0,0.4)' : undefined,
            }}
          >
            <WeatherIcon size={16} {...forecast} />
          </Box>
          <Typography variant="caption">
            {forecast.precipitationType === PrecipitationType.없음
              ? SKY_CONDITION_LABEL[forecast.skyCondition!]
              : isSnowy
                ? '눈'
                : '비'}
          </Typography>
        </Stack>
      </Stack>

      <Stack direction="row" alignItems="center" gap={1} sx={{ paddingLeft: 4 }}>
        {forecast.temperature != null && (
          <>
            <Metric label="기온" value={`${forecast.temperature}도`} />
            <Divider orientation="vertical" sx={{ height: 10, alignSelf: 'center' }} />
          </>
        )}
        <Metric label="습도" value={`${forecast.humidity}%`} />
        <Divider orientation="vertical" sx={{ height: 10, alignSelf: 'center' }} />
        <Metric label="풍속" value={`${forecast.windSpeed}m/s`} />
      </Stack>
    </Stack>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" justifyContent="space-between" gap={0.5}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="caption" sx={{ color: palette.primary }}>
        {value}
      </Typography>
    </Stack>
  )
}
