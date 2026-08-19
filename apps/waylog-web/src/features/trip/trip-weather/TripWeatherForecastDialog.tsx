import type { DialogProps, StackProps } from "@mui/material";

import { Close } from "@mui/icons-material";
import { alpha, Box, Dialog, DialogContent, IconButton, Skeleton, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { DailyWeatherInfoBox } from "~features/weather/DailyWeatherInfoBox";
import { HourlyForecastList } from "~features/weather/HourlyForecastList";
import { useDailyWeatherForecast } from "~features/weather/useDailyWeatherForecast";
import { DialogTitle } from "~shared/components/confirm-dialog/DialogTitle";
import { ErrorBoundary } from "~shared/components/ErrorBoundary";
import { AsyncBoundary } from "~shared/components/utils/AsyncBoundary";
import { assert } from "@waylog/domains/utils";
import { TripDateToggleGroup } from "../trip-route/components/TripDateToggleGroup";
import { useTrip } from "../useTrip";

interface Props extends Omit<DialogProps, 'onClose'> {
  tripId: string;
  initialDate: string;
  onClose?: () => void;
}

export function TripWeatherForecastDialog({ tripId, initialDate, ...props }: Props) {
  const [date, setDate] = useState(initialDate);

  const [isOpen, setIsOpen] = useState(props.open);
  useEffect(() => setIsOpen(props.open), [props.open]);

  return (
    <Dialog {...props} open={isOpen} maxWidth="lg" slotProps={{ paper: { sx: { height: '100%', width: 600 }, } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" paddingRight={1}>
        <DialogTitle>날씨 예보</DialogTitle>
        <IconButton
          onClick={() => {
            setIsOpen(false);
            setTimeout(() => props.onClose?.(), 300)
          }}>
          <Close />
        </IconButton>
      </Stack>
      <DialogContent sx={{ paddingTop: 0, overflowX: 'hidden' }}>
        <Box sx={theme => ({ overflowX: 'auto', position: 'sticky', top: 0, marginLeft: -3, width: 'calc(100% + 48px)', paddingX: 3, background: alpha(theme.palette.background.default, 0.8), backdropFilter: 'blur(3px)' })}>
          <TripDateToggleGroup tripId={tripId} value={date} onChange={setDate} />
        </Box>
        <AsyncBoundary
          resetKeys={[date]}
          rejectedFallback={({ error }) => <DailyForecast.Message message={error.message} />}
          pendingFallback={<DailyForecast.Skeleton marginTop={4} />}
        >
          <DailyForecast tripId={tripId} date={date} marginTop={4} />
        </AsyncBoundary>
      </DialogContent>
    </Dialog>
  )
}

interface DailyForecastProps extends StackProps {
  tripId: string;
  date: string;
}

function DailyForecast({ date, tripId, ...props }: DailyForecastProps) {
  const { data: { lat, lng } } = useTrip(tripId);
  const {
    data: weatherForecast
  } = useDailyWeatherForecast({ coordinate: { lat, lng }, date });

  assert(weatherForecast != null, '이 날짜는 예보를 제공하지 않아요');

  return (
    <>
      <Stack direction="row" gap={2} justifyContent="stretch" width="100%" alignItems="stretch" {...props}>
        <ErrorBoundary resetKeys={[date]}>
          <Box width="100%">
            <Typography variant="subtitle2" marginBottom={0.5} paddingX={1}>오전</Typography>
            <DailyWeatherInfoBox coordinate={{ lat, lng }} date={date} dayPart="am" />
            <HourlyForecastList coordinate={{ lat, lng }} date={date} dayPart="am" paddingX={0.5} marginTop={2} />
          </Box>
        </ErrorBoundary>
        <ErrorBoundary resetKeys={[date]}>
          <Box width="100%">
            <Typography variant="subtitle2" marginBottom={0.5} paddingX={1}>오후</Typography>
            <DailyWeatherInfoBox coordinate={{ lat, lng }} date={date} dayPart="pm" />
            <HourlyForecastList coordinate={{ lat, lng }} date={date} dayPart="pm" paddingX={0.5} marginTop={2} />
          </Box>
        </ErrorBoundary>
      </Stack>
      <Typography variant="caption" color="textSecondary" padding={1} display="block" textAlign="right">
        출처 : {weatherForecast.provider}
      </Typography>
    </>
  )
}
DailyForecast.Skeleton = DailyForecastSkeleton;

function DailyForecastSkeleton(props: StackProps) {
  return (
    <>
      <Stack direction="row" gap={2} justifyContent="stretch" width="100%" alignItems="stretch" {...props}>
        <Box width="100%">
          <Typography variant="subtitle2" marginBottom={0.5} paddingX={1}>오전</Typography>
          <DailyWeatherInfoBox.Skeleton />
          <HourlyForecastList.Skeleton dayPart="am" paddingX={0.5} marginTop={2} />
        </Box>
        <Box width="100%">
          <Typography variant="subtitle2" marginBottom={0.5} paddingX={1}>오후</Typography>
          <DailyWeatherInfoBox.Skeleton />
          <HourlyForecastList.Skeleton dayPart="pm" paddingX={0.5} marginTop={2} />
        </Box>
      </Stack>
      <Box padding={1} display="flex" justifySelf="flex-end">
        <Skeleton variant="text" />
      </Box>
    </>
  )
}
DailyForecast.Message = ForecastMessage;

function ForecastMessage(props: { message: string; }) {
  return (
    <Stack alignItems="center" paddingY={6}>
      <Typography variant="body2" color="textSecondary">
        {props.message}
      </Typography>
    </Stack>
  );
}


