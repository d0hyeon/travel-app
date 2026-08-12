import { Stack, Tab, Tabs, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { eachDayOfInterval, getHours, isToday as getIsToday } from "date-fns";
import { Suspense, useMemo, useRef, useState, type ComponentProps } from "react";
import { Swiper, SwiperSlide, type SwiperRef } from "swiper/react";
import { DailyWeatherInfoBox } from "~features/weather/DailyWeatherInfoBox";
import { HourlyForecastList } from "~features/weather/HourlyForecastList";
import { useDailyWeatherForecast } from "~features/weather/useDailyWeatherForecast";
import type { HourlyForecastScope } from "~features/weather/useHourlyForecast";
import { BottomSheet } from "~shared/components/bottom-sheet/BottomSheet";
import { ErrorBoundary } from "~shared/components/ErrorBoundary";
import { useCurrentTime } from "~shared/hooks/env/useCurrentTime";
import type { Coordinate } from "~shared/types/coordinate";
import { formatDisplayDate, formatShortDate } from "~shared/utils/formats";
import { useTrip } from "../useTrip";

import "swiper/css";

const DAY_PARTS = [
  { scope: 'AM', dayPart: 'morning', label: '오전' },
  { scope: 'PM', dayPart: 'afternoon', label: '오후' },
] as const;

const AFTERNOON_START_HOUR = 12;

/** 오늘이면 현재 시각이 속한 시간대, 그 외에는 오전부터 본다. */
function getInitialDayPartIndex(date: string, now: number) {
  if (!getIsToday(date)) return 0;
  return getHours(now) >= AFTERNOON_START_HOUR ? 1 : 0;
}

interface Props extends Omit<ComponentProps<typeof BottomSheet>, "children"> {
  tripId: string;
  /** 시트를 열 때 선택되어 있을 여행 일자. 이후 선택은 시트 내부 상태로 관리한다. */
  initialDate: string;
}

export function TripWeatherForecastSheet({ tripId, initialDate, ...props }: Props) {
  return (
    <BottomSheet snapPoints={[0.95]} defaultSnapIndex={0} {...props}>
      <Suspense fallback={null}>
        <Resolved tripId={tripId} initialDate={initialDate} />
      </Suspense>
    </BottomSheet>
  );
}

function Resolved({ tripId, initialDate }: Pick<Props, "tripId" | "initialDate">) {
  const { data: trip } = useTrip(tripId);
  const [selectedDate, selectDate] = useState(initialDate);

  const tripDates = useMemo(
    () => eachDayOfInterval({ start: trip.startDate, end: trip.endDate })
      .map(formatDisplayDate),
    [trip.startDate, trip.endDate],
  );

  return (
    <>
      <BottomSheet.Header>
        <Tabs
          value={selectedDate}
          sx={{ width: '100%', minHeight: 24, height: 40, overflow: "hidden" }}
          variant="scrollable"
          slotProps={{ list: { sx: { height: '100%' } } }}
        >
          {tripDates.map((date) => (
            <Tab
              key={date}
              value={date}
              label={formatShortDate(date)}
              onClick={() => selectDate(date)}
              sx={{ minHeight: 40 }}
            />
          ))}
        </Tabs>
      </BottomSheet.Header>

      <BottomSheet.Body paddingX={0}>
        <ErrorBoundary
          key={selectedDate}
          fallback={ForecastUnavailable}
        >
          <DayPartForecast
            coordinate={{ lat: trip.lat, lng: trip.lng }}
            date={selectedDate}
          />
        </ErrorBoundary>
      </BottomSheet.Body>
    </>
  );
}

function DayPartForecast({ coordinate, date }: { coordinate: Coordinate; date: string }) {
  const { data: weatherForecast } = useDailyWeatherForecast({ coordinate, date });
  const swiperRef = useRef<SwiperRef>(null);
  const now = useCurrentTime();
  const [activeIndex, setActiveIndex] = useState(() => getInitialDayPartIndex(date, now));

  if (weatherForecast == null) return <ForecastUnavailable />;

  const selectDayPart = (scope: HourlyForecastScope) => {
    const index = DAY_PARTS.findIndex(x => x.scope === scope);
    setActiveIndex(index);
    swiperRef.current?.swiper.slideTo(index);
  };

  return (
    <Stack gap={1}>
      <ToggleButtonGroup
        value={DAY_PARTS[activeIndex].scope}
        exclusive
        onChange={(_, scope: HourlyForecastScope | null) => scope && selectDayPart(scope)}
        size="small"
        sx={(theme) => ({
          alignSelf: 'end',
          marginTop: 1.5,
          marginRight: 1.5,
          backgroundColor: theme.palette.grey[200],
          padding: 0.25,
          borderRadius: '8px',
          '& .MuiToggleButton-root': {
            border: 'none',
            paddingX: 1.25,
            paddingY: 0.5,
            minHeight: 0,
            fontSize: 11,
            lineHeight: 1.4,
            color: 'text.secondary',
          },
          '.Mui-selected': { backgroundColor: '#fff !important', color: 'text.primary' },
          '.MuiButtonBase-root': { borderRadius: '6px' },
        })}
      >
        {DAY_PARTS.map(({ scope, label }) => (
          <ToggleButton key={scope} value={scope}>{label}</ToggleButton>
        ))}
      </ToggleButtonGroup>

      <Swiper
        ref={swiperRef}
        initialSlide={activeIndex}
        onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
        data-prevent-sheet="true"
        style={{ width: '100%' }}
      >
        {DAY_PARTS.map(({ scope, dayPart }) => (
          <SwiperSlide key={scope}>
            <Stack gap={1} paddingX={1.5}>
              <DailyWeatherInfoBox coordinate={coordinate} date={date} dayPart={dayPart} />
              <HourlyForecastList coordinate={coordinate} date={date} scope={scope} marginTop={1} />
            </Stack>
          </SwiperSlide>
        ))}
      </Swiper>
    </Stack>
  );
}

function ForecastUnavailable() {
  return (
    <Stack alignItems="center" paddingY={6}>
      <Typography variant="body2" color="textSecondary">
        이 날짜는 예보를 제공하지 않아요
      </Typography>
    </Stack>
  );
}
