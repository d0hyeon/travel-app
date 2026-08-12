import { Close } from "@mui/icons-material";
import { Box, Dialog, DialogContent, IconButton, Stack, Typography, useTheme, type IconButtonProps } from "@mui/material";
import { Suspense } from "react";
import { useTrip } from "~features/trip/useTrip";
import { HourlyForecastList } from "~features/weather/HourlyForecastList";
import { useDailyWeatherForecast } from "~features/weather/useDailyWeatherForecast";
import { PRECIPITATION_SNOW_TYPES } from "~features/weather/weather.types";
import { WeatherIcon } from "~features/weather/WeatherIcon";
import { DialogTitle } from "~shared/components/confirm-dialog/DialogTitle";
import { ErrorBoundary } from "~shared/components/ErrorBoundary";
import { useOverlay } from "~shared/hooks/useOverlay";
import { arrayIncludes, assert } from "~shared/utils/types";
import { useActiveTripDay } from "../trip-route/useActiveTripDay";
import { useIsMobile } from "~shared/hooks/env/useIsMobile";
import { DailyWeatherInfoBox } from "~features/weather/DailyWeatherInfoBox";
import { TripWeatherForecastSheet } from "./TripWeatherForecastSheet";


interface Props extends IconButtonProps {
  tripId: string;
}
export function TripWeatherIconButton(props: Props) {
  const { value: activedTripDate } = useActiveTripDay(props.tripId);

  return (
    <ErrorBoundary resetKeys={[activedTripDate]}>
      <Suspense>
        <Resolved {...props} />
      </Suspense>
    </ErrorBoundary>
  )
}
function Resolved({ tripId, ...props }: Props) {
  const { data: trip } = useTrip(tripId);
  const { value: activedTripDate } = useActiveTripDay(tripId);
  const { data: weatherForecast } = useDailyWeatherForecast({
    coordinate: { lat: trip.lat, lng: trip.lng },
    date: activedTripDate
  });

  const theme = useTheme();
  const overlay = useOverlay();
  const isMobile = useIsMobile();

  const openHourlyForecastSheet = () => {
    assert(weatherForecast != null, '날씨 데이터가 존재하지 않습니다.');
    overlay.open(({ isOpen, onClose }) => (
      <TripWeatherForecastSheet
        isOpen={isOpen}
        onClose={onClose}
        tripId={tripId}
        initialDate={activedTripDate}
      />
    ))
  }

  const openHourlyForecastDialog = () => {
    assert(weatherForecast != null, '날씨 데이터가 존재하지 않습니다.');

    overlay.open(({ isOpen, onClose, close }) => (
      <Dialog open={isOpen} onClose={onClose} maxWidth="lg" slotProps={{ paper: { sx: { height: '100%', width: '550px' }, } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" paddingRight={1}>
          <DialogTitle>날씨 예보</DialogTitle>
          <IconButton onClick={close}>
            <Close />
          </IconButton>
        </Stack>
        <DialogContent sx={{ paddingTop: 0 }}>
          <Stack direction="row" gap={2} justifyContent="stretch" width="100%" alignItems="stretch">
            <ErrorBoundary>
              <Box width="100%">
                <Typography variant="subtitle2" marginBottom={0.5} paddingX={1}>오전</Typography>
                <DailyWeatherInfoBox coordinate={trip} date={activedTripDate} dayPart="am" />
                <HourlyForecastList coordinate={trip} date={activedTripDate} dayPart="am" paddingX={0.5} marginTop={2} />
              </Box>
            </ErrorBoundary>
            <ErrorBoundary>
              <Box width="100%" minHeight="500px">
                <Typography variant="subtitle2" marginBottom={0.5} paddingX={1}>오후</Typography>
                <DailyWeatherInfoBox coordinate={trip} date={activedTripDate} dayPart="pm" />
                <HourlyForecastList coordinate={trip} date={activedTripDate} dayPart="pm" paddingX={0.5} marginTop={2} />

              </Box>
            </ErrorBoundary>
          </Stack>
        </DialogContent>
      </Dialog>
    ))
  }


  if (weatherForecast == null) {
    return null;
  }


  return (
    <>
      <IconButton
        onClick={isMobile ? openHourlyForecastSheet : openHourlyForecastDialog}
        sx={[
          arrayIncludes(PRECIPITATION_SNOW_TYPES, weatherForecast.forecast.summary.precipitationType)
            ? { background: `${theme.alpha('#000', 0.4)}!important` } : {},
          ...(Array.isArray(props.sx) ? props.sx : [props.sx])
        ]}
        {...props}
      >
        <WeatherIcon
          skyCondition={weatherForecast.forecast.summary.skyCondition}
          precipitationType={weatherForecast.forecast.summary.precipitationType}
        />
      </IconButton>
    </>
  )
}
