import { formatDate, getHours, isToday as getIsToday, set } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Suspense, useMemo } from 'react'
import { useCurrentTime } from '@waylog/react'
import {
  useHourlyForecast,
  type DayPart,
  type UseDailyWeatherForecastParams,
} from '@waylog/domains/modules/weather'
import { Divider, Skeleton, Stack, Typography } from '../../shared/components/mui'
import { palette } from '../../shared/config/tokens'
import { HourlyForecastItem } from './HourlyForecastItem'

interface Props extends UseDailyWeatherForecastParams {
  dayPart?: DayPart
}

export function HourlyForecastList(props: Props) {
  return (
    <Suspense fallback={<HourlyForecastListSkeleton date={props.date} dayPart={props.dayPart} />}>
      <Resolved {...props} />
    </Suspense>
  )
}

function Resolved({ coordinate, date, dayPart }: Props) {
  const { forecast, hourly } = useHourlyForecast({ coordinate, date, dayPart })

  // 오전은 늦은 시각이 위로 오도록 뒤집어 보여준다.
  const orderedHourly = useMemo(
    () => (dayPart === 'am' ? hourly.toReversed() : hourly),
    [dayPart, hourly],
  )

  if (forecast == null) {
    return null
  }

  return (
    <Stack gap={1}>
      {orderedHourly.map((item) => (
        <HourlyForecastItem
          key={item.forecastAt}
          forecast={item}
          precipitationType={forecast.summary.precipitationType}
        />
      ))}
    </Stack>
  )
}

const today = Date.now()

function HourlyForecastListSkeleton({
  date = formatDate(today, 'yyyy-MM-dd'),
  dayPart = 'pm',
}: Partial<Omit<Props, 'coordinate'>>) {
  const isToday = getIsToday(date)
  const startHours = dayPart === 'pm' ? 12 : 0
  const endHours = dayPart === 'am' ? 12 : 24

  const hours = useMemo(() => {
    const hours = range(isToday ? getHours(date) : startHours, endHours)
    if (dayPart === 'am') {
      return hours.toReversed()
    }
    return hours
  }, [date, dayPart, endHours, isToday, startHours])
  const now = useCurrentTime()

  return (
    <Stack gap={1}>
      {hours.map((hour) => (
        <Stack
          key={hour}
          gap={0.5}
          sx={{
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: palette.divider,
          }}
        >
          <Typography variant="subtitle2">
            {formatDate(set(now, { hours: hour }), 'b h시', { locale: ko })}
          </Typography>

          <Stack direction="row" alignItems="center" gap={1} sx={{ paddingLeft: 4 }}>
            <PendingMetric label="기온" />
            <Divider orientation="vertical" sx={{ height: 10, alignSelf: 'center' }} />
            <PendingMetric label="습도" />
            <Divider orientation="vertical" sx={{ height: 10, alignSelf: 'center' }} />
            <PendingMetric label="풍속" />
          </Stack>
        </Stack>
      ))}
    </Stack>
  )
}
HourlyForecastList.Skeleton = HourlyForecastListSkeleton

function PendingMetric({ label }: { label: string }) {
  return (
    <Stack direction="row" justifyContent="space-between" gap={0.5}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Skeleton variant="text" width={20} />
    </Stack>
  )
}

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start }).map((_, index) => index + start)
}
