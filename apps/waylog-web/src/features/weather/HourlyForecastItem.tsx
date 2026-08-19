import { Box, Divider, Stack, Typography, useTheme, type StackProps } from "@mui/material";
import { formatDate, isSameHour } from "date-fns";
import { ko } from "date-fns/locale";
import { useCurrentTime } from "@waylog/react";
import { reverseKeyValue } from "@waylog/domains/utils";
import { arrayIncludes } from "@waylog/domains/utils";
import { WeatherIcon } from "./WeatherIcon";
import { PRECIPITATION_SNOW_TYPES, PrecipitationType, SkyCondition, type HourlyWeatherForecast } from "./weather.types";

const SKY_CONDITION_LABEL = reverseKeyValue(SkyCondition);

interface Props extends StackProps {
  forecast: HourlyWeatherForecast;
  /**
   * 눈/비 표기의 기준이 되는 강수 형태.
   * 기존 동작을 유지하기 위해 항목 자신이 아니라 하루 요약값을 받는다.
   */
  precipitationType: PrecipitationType;
}

export function HourlyForecastItem({ forecast, precipitationType, ...props }: Props) {
  const theme = useTheme();
  const now = useCurrentTime();

  const isSnowy = arrayIncludes(PRECIPITATION_SNOW_TYPES, precipitationType);
  const isCurrentHour = isSameHour(now, forecast.forecastAt);

  return (
    <Stack
      gap={0.5}
      paddingY={1}
      paddingX={1.5}
      sx={{ borderRadius: 4, border: `1px solid ${isCurrentHour ? theme.palette.primary.main : theme.palette.divider}` }}
      {...props}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle2" fontWeight={800}>
          {formatDate(forecast.forecastAt, 'b h시', { locale: ko })}
        </Typography>
        <Stack direction="row" alignItems="center">
          <Box display="inline-flex" borderRadius="50%" padding={0.5} sx={isSnowy ? { background: `${theme.alpha('#000', 0.4)}!important` } : {}}>
            <WeatherIcon fontSize="small" {...forecast} />
          </Box>
          <Typography variant="caption">
            {forecast.precipitationType === PrecipitationType.없음
              ? SKY_CONDITION_LABEL[forecast.skyCondition!]
              : isSnowy ? '눈' : '비'
            }
          </Typography>
        </Stack>
      </Stack>

      <Stack direction="row" alignItems="center" gap={1} paddingLeft={0.5}>
        {forecast.temperature != null && (
          <>
            <Stack direction="row" justifyContent="space-between" gap={0.5}>
              <Typography variant="caption" color="textSecondary">기온</Typography>
              <Typography variant="caption" color="primary">{forecast.temperature}도</Typography>
            </Stack>
            <Divider sx={{ height: 10, alignSelf: 'center' }} orientation="vertical" flexItem />
          </>
        )}
        <Stack direction="row" justifyContent="space-between" gap={0.5}>
          <Typography variant="caption" color="textSecondary">습도</Typography>
          <Typography variant="caption" color="primary">{forecast.humidity}%</Typography>
        </Stack>
        <Divider sx={{ height: 10, alignSelf: 'center' }} orientation="vertical" flexItem />
        <Stack direction="row" justifyContent="space-between" gap={0.5}>
          <Typography variant="caption" color="textSecondary">풍속</Typography>
          <Typography variant="caption" color="primary">{forecast.windSpeed}m/s</Typography>
        </Stack>
      </Stack>
    </Stack>
  );
}
