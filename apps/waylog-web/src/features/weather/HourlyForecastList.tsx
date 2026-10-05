import { Divider, Skeleton, Stack, Typography, useTheme, type StackProps } from "@mui/material";
import { formatDate, getHours, isToday as getIsToday, set } from "date-fns";
import { ko } from 'date-fns/locale';
import { Suspense, useMemo } from "react";
import { useCurrentTime } from "@waylog/react";
import { HourlyForecastItem } from "./HourlyForecastItem";
import { type UseDailyWeatherForecastParams } from "@waylog/domains/modules/weather";
import { useHourlyForecast } from "@waylog/domains/modules/weather";
import type { DayPart } from "@waylog/domains/modules/weather";

interface Props extends UseDailyWeatherForecastParams, StackProps {
  dayPart?: DayPart
}

export function HourlyForecastList(props: Props) {
  return (
    <Suspense fallback={<HourlyForecastListSkeleton {...props} />}>
      <Resolved {...props} />
    </Suspense>
  )
}
HourlyForecastList.Skeleton = HourlyForecastListSkeleton;

function Resolved({ coordinate, date, dayPart, ...props }: Props) {
  const { forecast, hourly } = useHourlyForecast({ coordinate, date, dayPart });

  // 오전은 늦은 시각이 위로 오도록 뒤집어 보여준다.
  const orderedHourly = useMemo(
    () => dayPart === "am" ? hourly.toReversed() : hourly,
    [dayPart, hourly],
  );

  if (forecast == null) {
    return null;
  }

  return (
    <Stack gap={1} {...props}>
      {orderedHourly.map(x => (
        <HourlyForecastItem
          key={x.forecastAt}
          forecast={x}
          precipitationType={forecast.summary.precipitationType}
        />
      ))}
    </Stack>
  )
}
HourlyForecastList.Skeleton = HourlyForecastListSkeleton;

const today = Date.now();
function HourlyForecastListSkeleton({
  date = formatDate(today, 'yyyy-MM-dd'),
  dayPart = 'pm',
  ...props
}: Partial<Omit<Props, 'coordinate'>>) {
  const isToday = getIsToday(date)
  const startHours = dayPart === "pm" ? 12 : 0;
  const endHours = dayPart === "am" ? 12 : 24;


  const hours = useMemo(() => {
    const hours = range(
      isToday ? getHours(date) : startHours,
      endHours
    )
    if (dayPart === "am") {
      return hours.toReversed();
    }
    return hours
  }, [date, dayPart, endHours, isToday, startHours])
  const theme = useTheme();
  const now = useCurrentTime();

  return (
    <Stack gap={1} {...props}>
      {hours.map((hour) => {
        const date = set(now, { hours: hour });

        return (
          <Stack
            key={hour}
            gap={0.5}
            paddingY={1}
            paddingX={1.5}
            sx={{ borderRadius: 4, border: `1px solid ${theme.palette.divider}` }}
          >
            <Typography variant="subtitle2" fontWeight={800}>
              {formatDate(date, 'b h시', { locale: ko })}
            </Typography>

            <Stack direction="row" alignItems="center" gap={1} paddingLeft={0.5}>
              <>
                <Stack direction="row" justifyContent="space-between" gap={0.5} >
                  <Typography variant="caption" color="textSecondary">기온</Typography>
                  <Skeleton variant="text" width="20px" />
                </Stack>
                <Divider sx={{ height: 10, alignSelf: 'center' }} orientation="vertical" flexItem />
              </>
              <Stack direction="row" justifyContent="space-between" gap={0.5} >
                <Typography variant="caption" color="textSecondary">습도</Typography>
                <Skeleton variant="text" width="20px" />
              </Stack>
              <Divider sx={{ height: 10, alignSelf: 'center' }} orientation="vertical" flexItem />
              <Stack direction="row" justifyContent="space-between" gap={0.5} >
                <Typography variant="caption" color="textSecondary">풍속</Typography>
                <Skeleton variant="text" width="20px" />
              </Stack>
            </Stack>
          </Stack>
        )
      })}
    </Stack>
  )
}

function range(start: number, end: number): number[];
function range(size: number): number[];
function range(...args: number[]) {
  if (args.length === 1) {
    return Array.from({ length: args[0] }).map((_, i) => i);
  }

  return Array.from({ length: args[1] - args[0] }).map((_, i) => i + args[0]);

}
