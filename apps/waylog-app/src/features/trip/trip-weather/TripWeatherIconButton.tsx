import { Suspense } from 'react'
import { useTrip } from '@waylog/domains/modules/trip'
import { arrayIncludes, assert } from '@waylog/utility'
import { PRECIPITATION_SNOW_TYPES, useDailyWeatherForecast } from '@waylog/domains/modules/weather'
import { ErrorBoundary } from '../../../shared/components/ErrorBoundary'
import { IconButton } from '../../../shared/components/mui'
import { useOverlay } from '../../../shared/hooks/useOverlay'
import { WeatherIcon } from '../../weather/WeatherIcon'
import { useActiveTripDay } from '../trip-route/useActiveTripDay'
import { TripWeatherForecastSheet } from './TripWeatherForecastSheet'

interface Props {
  tripId: string
}

export function TripWeatherIconButton(props: Props) {
  const { value: activedTripDate } = useActiveTripDay(props.tripId)

  return (
    <ErrorBoundary resetKeys={[activedTripDate]}>
      <Suspense>
        <Resolved {...props} />
      </Suspense>
    </ErrorBoundary>
  )
}

function Resolved({ tripId }: Props) {
  const { data: trip } = useTrip(tripId)
  const { value: activedTripDate } = useActiveTripDay(tripId)
  const { data: weatherForecast } = useDailyWeatherForecast({
    coordinate: { lat: trip.lat, lng: trip.lng },
    date: activedTripDate,
  })

  const overlay = useOverlay()

  // 웹은 모바일에서 시트, 데스크톱에서 다이얼로그를 연다. 앱은 시트만 있다.
  const openHourlyForecastSheet = () => {
    assert(weatherForecast != null, '날씨 데이터가 존재하지 않습니다.')

    overlay.open(({ isOpen, close }) => (
      <TripWeatherForecastSheet
        isOpen={isOpen}
        onClose={close}
        tripId={tripId}
        initialDate={activedTripDate}
      />
    ))
  }

  if (weatherForecast == null) {
    return null
  }

  const hasSnowForecast = arrayIncludes(
    PRECIPITATION_SNOW_TYPES,
    weatherForecast.forecast.summary.precipitationType,
  )

  return (
    <IconButton
      onClick={openHourlyForecastSheet}
      sx={hasSnowForecast ? { backgroundColor: 'rgba(0,0,0,0.4)' } : undefined}
    >
      <WeatherIcon
        skyCondition={weatherForecast.forecast.summary.skyCondition}
        precipitationType={weatherForecast.forecast.summary.precipitationType}
      />
    </IconButton>
  )
}
