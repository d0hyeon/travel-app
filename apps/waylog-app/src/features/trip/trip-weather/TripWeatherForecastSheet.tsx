import { eachDayOfInterval, getHours, isToday as getIsToday } from 'date-fns'
import { Suspense, useMemo, useRef, useState } from 'react'
import { ScrollView, useWindowDimensions } from 'react-native'
import { useCurrentTime } from '@waylog/react'
import type { Coordinate } from '@waylog/utility'
import { formatDisplayDate, formatShortDate } from '@waylog/utility'
import { useTrip } from '@waylog/domains/modules/trip'
import { useDailyWeatherForecast, type DayPart } from '@waylog/domains/modules/weather'
import { BottomSheet } from '../../../shared/components/bottom-sheet/BottomSheet'
import { ErrorBoundary } from '../../../shared/components/ErrorBoundary'
import {
  Stack,
  Tab,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '../../../shared/components/mui'
import { DailyWeatherInfoBox } from '../../weather/DailyWeatherInfoBox'
import { HourlyForecastList } from '../../weather/HourlyForecastList'

const DAY_PARTS = [
  { dayPart: 'am', label: '오전' },
  { dayPart: 'pm', label: '오후' },
] satisfies Array<{ dayPart: DayPart; label: string }>

const AFTERNOON_START_HOUR = 12

/** 오늘이면 현재 시각이 속한 시간대, 그 외에는 오전부터 본다. */
function getInitialDayPartIndex(date: string, now: number) {
  if (!getIsToday(date)) return 0
  return getHours(now) >= AFTERNOON_START_HOUR ? 1 : 0
}

interface Props {
  tripId: string
  /** 시트를 열 때 선택되어 있을 여행 일자. 이후 선택은 시트 내부 상태로 관리한다. */
  initialDate: string
  isOpen?: boolean
  /** 닫기 요청 */
  onDismiss?: () => void
  /** 닫기 모션이 끝난 시점 */
  onClose?: () => void
}

export function TripWeatherForecastSheet({ tripId, initialDate, ...props }: Props) {
  return (
    <BottomSheet snapPoints={[0.95]} defaultSnapIndex={0} {...props}>
      <Suspense fallback={null}>
        <Resolved tripId={tripId} initialDate={initialDate} />
      </Suspense>
    </BottomSheet>
  )
}

function Resolved({ tripId, initialDate }: Pick<Props, 'tripId' | 'initialDate'>) {
  const { data: trip } = useTrip(tripId)
  const [selectedDate, selectDate] = useState(initialDate)

  const tripDates = useMemo(
    () => eachDayOfInterval({ start: trip.startDate, end: trip.endDate }).map(formatDisplayDate),
    [trip.startDate, trip.endDate],
  )

  return (
    <>
      <BottomSheet.Header>
        <Tabs value={selectedDate} onChange={(_, date) => selectDate(date)}>
          {tripDates.map((date) => (
            <Tab key={date} value={date} label={formatShortDate(date)} />
          ))}
        </Tabs>
      </BottomSheet.Header>

      <BottomSheet.Body sx={{ paddingHorizontal: 0 }}>
        <ErrorBoundary resetKeys={[selectedDate]} fallback={<ForecastUnavailable />}>
          <DayPartForecast
            coordinate={{ lat: trip.lat, lng: trip.lng }}
            date={selectedDate}
          />
        </ErrorBoundary>
      </BottomSheet.Body>
    </>
  )
}

function DayPartForecast({ coordinate, date }: { coordinate: Coordinate; date: string }) {
  const { data: weatherForecast } = useDailyWeatherForecast({ coordinate, date })
  const { width } = useWindowDimensions()
  const scrollRef = useRef<ScrollView>(null)
  const now = useCurrentTime()
  const [activeDayPart, setActiveDayPart] = useState<DayPart>(
    () => DAY_PARTS[getInitialDayPartIndex(date, now)].dayPart,
  )

  if (weatherForecast == null) return <ForecastUnavailable />

  const availableDayParts = DAY_PARTS.filter(({ dayPart }) =>
    weatherForecast.forecast.hourly.some(({ forecastAt }) =>
      dayPart === 'am'
        ? getHours(forecastAt) < AFTERNOON_START_HOUR
        : getHours(forecastAt) >= AFTERNOON_START_HOUR,
    ),
  )
  const selectedDayPart =
    availableDayParts.find(({ dayPart }) => dayPart === activeDayPart) ?? availableDayParts[0]

  if (!selectedDayPart) return <ForecastUnavailable />

  // 웹은 Swiper 로 넘긴다. RN 은 페이징 스크롤이 같은 동작을 낸다.
  const selectDayPart = (dayPart: DayPart) => {
    const index = availableDayParts.findIndex((item) => item.dayPart === dayPart)
    setActiveDayPart(dayPart)
    scrollRef.current?.scrollTo({ x: index * width, animated: true })
  }

  return (
    <>
      <Stack gap={1}>
        <ToggleButtonGroup
          value={selectedDayPart.dayPart}
          exclusive
          size="small"
          onChange={(_, dayPart) => dayPart && selectDayPart(dayPart as DayPart)}
          sx={{ alignSelf: 'flex-end', marginTop: 12, marginRight: 12 }}
        >
          {availableDayParts.map(({ dayPart, label }) => (
            <ToggleButton key={dayPart} value={dayPart}>
              {label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: availableDayParts.indexOf(selectedDayPart) * width, y: 0 }}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width)
            const dayPart = availableDayParts[index]
            if (dayPart) setActiveDayPart(dayPart.dayPart)
          }}
        >
          {availableDayParts.map(({ dayPart }) => (
            <Stack key={dayPart} gap={1} sx={{ width, paddingHorizontal: 12 }}>
              <ErrorBoundary resetKeys={[date, dayPart]}>
                <DailyWeatherInfoBox coordinate={coordinate} date={date} dayPart={dayPart} />
              </ErrorBoundary>
              <ErrorBoundary resetKeys={[date, dayPart]}>
                <HourlyForecastList coordinate={coordinate} date={date} dayPart={dayPart} />
              </ErrorBoundary>
            </Stack>
          ))}
        </ScrollView>
      </Stack>
      <Typography
        variant="caption"
        color="text.secondary"
        textAlign="right"
        sx={{ paddingVertical: 4, paddingHorizontal: 16, marginTop: 8 }}
      >
        출처 : {weatherForecast.provider}
      </Typography>
    </>
  )
}

function ForecastUnavailable() {
  return (
    <Stack alignItems="center" sx={{ paddingVertical: 48 }}>
      <Typography variant="body2" color="text.secondary">
        이 날짜는 예보를 제공하지 않아요
      </Typography>
    </Stack>
  )
}
