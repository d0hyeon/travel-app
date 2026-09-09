import { eachDayOfInterval, getHours, isToday as getIsToday } from 'date-fns'
import { useMemo, useRef, useState } from 'react'
import { useWindowDimensions } from 'react-native'
import type Animated from 'react-native-reanimated'
import { useCurrentTime } from '@waylog/react'
import type { Coordinate } from '@waylog/utility'
import { formatDisplayDate, formatShortDate } from '@waylog/utility'
import { useTrip } from '@waylog/domains/modules/trip'
import {
  hasDayPartForecast,
  useDailyWeatherForecast,
  type DayPart,
} from '@waylog/domains/modules/weather'
import { BottomSheet } from '../../../shared/components/bottom-sheet/BottomSheet'
import { ErrorBoundary } from '@waylog/react'
import { AsyncBoundary } from '@waylog/react'
import {
  Stack,
  Tab,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '~/shared/components/design-system'
import { DailyWeatherInfoBox } from '../../weather/DailyWeatherInfoBox'
import { isPageWithinRenderWindow } from '../../../shared/components/pagerWindow'
import { toForecastPages, toPageIndex } from './weatherForecastPager'
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
      <AsyncBoundary pendingFallback={null}>
        <Resolved tripId={tripId} initialDate={initialDate} />
      </AsyncBoundary>
    </BottomSheet>
  )
}

function Resolved({ tripId, initialDate }: Pick<Props, 'tripId' | 'initialDate'>) {
  const { data: trip } = useTrip(tripId)
  const { width } = useWindowDimensions()
  const scrollRef = useRef<Animated.ScrollView>(null)
  const now = useCurrentTime()

  const tripDates = useMemo(
    () => eachDayOfInterval({ start: trip.startDate, end: trip.endDate }).map(formatDisplayDate),
    [trip.startDate, trip.endDate],
  )
  const pages = useMemo(() => toForecastPages(tripDates), [tripDates])

  const [activeIndex, setActiveIndex] = useState(() =>
    toPageIndex(tripDates, initialDate, DAY_PARTS[getInitialDayPartIndex(initialDate, now)].dayPart),
  )
  const activePage = pages[activeIndex] ?? pages[0]

  const scrollToPage = (index: number) => {
    setActiveIndex(index)
    scrollRef.current?.scrollTo({ x: index * width, animated: true })
  }

  if (activePage == null) return <ForecastUnavailable />

  return (
    <>
      {/* 탭이 헤더 폭을 온전히 쓰도록 좌우 패딩을 없앤다. */}
      <BottomSheet.Header sx={{ px: 0 }}>
        <Tabs
          value={activePage.date}
          onChange={(_, date) => scrollToPage(toPageIndex(tripDates, date, 'am'))}
          scrollable
          sx={{ width: '100%' }}
        >
          {tripDates.map((date) => (
            <Tab key={date} value={date} label={formatShortDate(date)} />
          ))}
        </Tabs>
      </BottomSheet.Header>

      <BottomSheet.Body sx={{ paddingHorizontal: 0 }}>
        <Stack gap={1} sx={{ flex: 1, minHeight: 0 }}>
          <ToggleButtonGroup
            value={activePage.dayPart}
            exclusive
            size="small"
            onChange={(_, dayPart) =>
              dayPart && scrollToPage(toPageIndex(tripDates, activePage.date, dayPart as DayPart))
            }
            sx={{ alignSelf: 'flex-end', marginTop: 12, marginRight: 12 }}
          >
            {DAY_PARTS.map(({ dayPart, label }) => (
              <ToggleButton key={dayPart} value={dayPart}>
                {label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          {/* 여행 전체를 한 줄로 편다. 오전에서 왼쪽 끝, 오후에서 오른쪽 끝으로
              밀면 그대로 인접 날짜로 넘어간다. */}
          <BottomSheet.ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: activeIndex * width, y: 0 }}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / width)
              if (index !== activeIndex) setActiveIndex(index)
            }}
          >
            {pages.map((page, index) => (
              <Stack
                key={`${page.date}:${page.dayPart}`}
                gap={1}
                sx={{ width, paddingHorizontal: 12 }}
              >
                {/* 화면에서 먼 페이지는 그리지 않는다. 그 날짜 예보도 요청되지 않는다. */}
                {isPageWithinRenderWindow(index, activeIndex) && (
                  <AsyncBoundary
                    resetKeys={[page.date, page.dayPart]}
                    rejectedFallback={() => <ForecastUnavailable />}
                    pendingFallback={null}
                  >
                    <ForecastPageContent
                      coordinate={{ lat: trip.lat, lng: trip.lng }}
                      date={page.date}
                      dayPart={page.dayPart}
                    />
                  </AsyncBoundary>
                )}
              </Stack>
            ))}
          </BottomSheet.ScrollView>
        </Stack>
      </BottomSheet.Body>
    </>
  )
}

function ForecastPageContent({
  coordinate,
  date,
  dayPart,
}: {
  coordinate: Coordinate
  date: string
  dayPart: DayPart
}) {
  const { data: weatherForecast } = useDailyWeatherForecast({ coordinate, date })

  if (weatherForecast == null) return <ForecastUnavailable />
  if (!hasDayPartForecast(weatherForecast.forecast.hourly, dayPart)) return <ForecastUnavailable />

  return (
    <>
      <ErrorBoundary resetKeys={[date, dayPart]}>
        <DailyWeatherInfoBox coordinate={coordinate} date={date} dayPart={dayPart} />
      </ErrorBoundary>
      <ErrorBoundary resetKeys={[date, dayPart]}>
        <HourlyForecastList coordinate={coordinate} date={date} dayPart={dayPart} />
      </ErrorBoundary>
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
