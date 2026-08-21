import { Box, Skeleton, Stack, Typography, useTheme, type BoxProps } from "@mui/material";
import { useDailyWeatherForecast, type UseDailyWeatherForecastParams } from "@waylog/domains/weather";
import { WeatherIcon } from "./WeatherIcon";
import { Suspense } from "react";
import type { DayPart } from "@waylog/domains/weather";

interface Props extends UseDailyWeatherForecastParams, BoxProps {
  dayPart?: DayPart;
}

export function DailyWeatherInfoBox(props: Props) {
  return (
    <Suspense fallback={<Pending {...props} />}>
      <Resolved {...props} />
    </Suspense>
  )
}
DailyWeatherInfoBox.Skeleton = Pending;

function Resolved({ coordinate, date, dayPart, ...props }: Props) {
  const { data: weatherForecast } = useDailyWeatherForecast({ coordinate, date });
  const theme = useTheme();

  if (weatherForecast == null) return null;

  const forecast = dayPart
    ? weatherForecast.forecast.periods[dayPart]
    : weatherForecast.forecast.summary

  return (
    <Box {...props}>
      <Stack alignItems="center" gap={1} paddingY={2} borderRadius={2} border={`1px solid ${theme.palette.divider}`}>
        <Stack direction="row" gap={0.5}>
          <Typography variant="body2" color="primary">{forecast.minimumTemperature}도</Typography>
          <Typography variant="body2">/</Typography>
          <Typography variant="body2" color="error">{forecast.maximumTemperature}도</Typography>
        </Stack>
        <WeatherIcon fontSize="large" {...forecast} />
      </Stack>
    </Box>
  )
}

function Pending(props: BoxProps) {
  const theme = useTheme();

  return (
    <Box {...props}>
      <Stack alignItems="center" gap={1} paddingY={2} borderRadius={2} border={`1px solid ${theme.palette.divider}`}>
        <Stack direction="row" gap={0.5}>
          <Skeleton variant="text" width="20px" />
          <Typography variant="body2">/</Typography>
          <Skeleton variant="text" width="20px" />
        </Stack>
        <Skeleton variant="circular" width="30px" />
      </Stack>
    </Box>
  )
}
