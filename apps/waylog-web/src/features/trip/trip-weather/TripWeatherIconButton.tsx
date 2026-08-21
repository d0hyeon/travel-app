import { IconButton, useTheme, type IconButtonProps } from "@mui/material";
import { Suspense } from "react";
import { useTrip } from "@waylog/domains/trip";
import { useDailyWeatherForecast } from "@waylog/domains/weather";
import { PRECIPITATION_SNOW_TYPES } from "@waylog/domains/weather";
import { WeatherIcon } from "~features/weather/WeatherIcon";
import { ErrorBoundary } from "~shared/components/ErrorBoundary";
import { useIsMobile } from "~shared/hooks/env/useIsMobile";
import { useOverlay } from "~shared/hooks/useOverlay";
import { arrayIncludes, assert } from "@waylog/domains/utils";
import { useActiveTripDay } from "../trip-route/useActiveTripDay";
import { TripWeatherForecastDialog } from "./TripWeatherForecastDialog";
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
      <TripWeatherForecastDialog
        open={isOpen}
        onClose={onClose}
        tripId={tripId}
        initialDate={activedTripDate}
      />
    ))
  }

  if (weatherForecast == null) {
    return null;
  }

  const hasSnowForecast = arrayIncludes(PRECIPITATION_SNOW_TYPES, weatherForecast.forecast.summary.precipitationType)

  return (
    <>
      <IconButton
        onClick={isMobile ? openHourlyForecastSheet : openHourlyForecastDialog}
        sx={[hasSnowForecast
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
