import { Close } from "@mui/icons-material";
import { Box, Dialog, DialogContent, IconButton, Stack, Tab, Tabs, Typography } from "@mui/material";
import { eachDayOfInterval } from "date-fns";
import { Suspense, useCallback, useMemo, useState } from "react";
import { MarineActivityType, type MarineActivityIndex } from "~features/marine-activity/marineActivity.types";
import { useDailyMarineActivityIndices } from "~features/marine-activity/useDailyMarineActivityIndices";
import { BottomSheet } from "~shared/components/bottom-sheet/BottomSheet";
import { DialogTitle } from "~shared/components/confirm-dialog/DialogTitle";
import { useIsMobile } from "~shared/hooks/env/useIsMobile";
import { useOverlay } from "~shared/hooks/useOverlay";
import { formatDisplayDate, formatShortDate } from "~shared/utils/formats";
import type { Trip } from "../trip.types";
import { useTrip } from "../useTrip";

interface TripMarineActivityDetailOverlayProps {
  trip: Trip;
  placeCode: string;
  placeName: string;
  initialDate: string;
  isOpen: boolean;
  onClose: () => void;
}

type OpenTripMarineActivityDetailParams = Omit<
  TripMarineActivityDetailOverlayProps,
  "isOpen" | "onClose" | "trip"
>;

export function useTripMarineActivityDetailOverlay(tripId: string) {
  const overlay = useOverlay();
  const { data: trip } = useTrip(tripId);

  const open = useCallback(
    (params: OpenTripMarineActivityDetailParams) => {
      return overlay.open(({ isOpen, close }) => (
        <TripMarineActivityDetailOverlay {...params} trip={trip} isOpen={isOpen} onClose={close} />
      ));
    },
    [overlay],
  );

  return { open };
}

export function TripMarineActivityDetailOverlay(props: TripMarineActivityDetailOverlayProps) {
  const isMobile = useIsMobile();
  if (isMobile) return <TripMarineActivityDetailSheet {...props} />;
  return <TripMarineActivityDetailDialog {...props} />;
}

function TripMarineActivityDetailDialog({
  placeName,
  isOpen,
  onClose,
  initialDate,
  ...detailParams
}: TripMarineActivityDetailOverlayProps) {
  const [selectedDate, selectDate] = useState(initialDate);
  const tripDates = useMemo(
    () => eachDayOfInterval({ start: detailParams.trip.startDate, end: detailParams.trip.endDate }).map(formatDisplayDate),
    [detailParams.trip],
  );

  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="sm">
      <Stack direction="row" justifyContent="space-between" alignItems="center" paddingRight={1}>
        <DialogTitle>{placeName}</DialogTitle>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </Stack>
      <DialogContent sx={{ paddingTop: 0 }}>
        <Stack gap={1}>
          <Tabs
            value={selectedDate}
            onChange={(_, date: string) => selectDate(date)}
            sx={{ width: "100%", minHeight: 24, height: 40, overflow: "hidden" }}
            variant="scrollable"
            slotProps={{ list: { sx: { height: "100%" } } }}
          >
            {tripDates.map((date) => (
              <Tab key={date} value={date} label={formatShortDate(date)} sx={{ minHeight: 40 }} />
            ))}
          </Tabs>
          <Suspense>
            <TripMarineActivityDetailContent date={selectedDate} {...detailParams} />
          </Suspense>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

function TripMarineActivityDetailSheet({
  placeName,
  isOpen,
  onClose,
  initialDate,
  ...detailParams
}: TripMarineActivityDetailOverlayProps) {
  const [selectedDate, selectDate] = useState(initialDate);
  const tripDates = useMemo(
    () => eachDayOfInterval({ start: detailParams.trip.startDate, end: detailParams.trip.endDate }).map(formatDisplayDate),
    [detailParams.trip],
  );


  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} snapPoints={[0.9]} defaultSnapIndex={0}>
      <BottomSheet.Header direction="row" justifyContent="space-between">
        <Typography variant="subtitle1" fontWeight={700}>
          {placeName}
        </Typography>
      </BottomSheet.Header>
      <BottomSheet.Body sx={{ paddingX: 0 }}>
        <Tabs
          value={selectedDate}
          onChange={(_, date: string) => selectDate(date)}
          sx={{ width: "100%", minHeight: 24, height: 40, overflow: "hidden" }}
          variant="scrollable"
          slotProps={{ list: { sx: { height: "100%" } } }}
        >
          {tripDates.map((date) => (
            <Tab key={date} value={date} label={formatShortDate(date)} sx={{ minHeight: 40 }} />
          ))}
        </Tabs>
        <Suspense>
          <TripMarineActivityDetailContent date={selectedDate} {...detailParams} />
        </Suspense>
      </BottomSheet.Body>
    </BottomSheet>
  );
}

interface ContentProps extends Omit<TripMarineActivityDetailOverlayProps, "placeName" | "isOpen" | "onClose" | 'initialDate'> {
  date: string;
}

function TripMarineActivityDetailContent({
  trip: { lat, lng },
  placeCode,
  date,
}: ContentProps) {
  const { data } = useDailyMarineActivityIndices({ coordinate: { lat, lng }, date });
  const selectedIndex = data?.indices?.find?.((index) => index.placeCode === placeCode);

  return (

    <Box paddingX={2} paddingTop={1.5} paddingBottom={2}>
      {selectedIndex ? (
        <Stack gap={2}>
          <MarineActivityGrade index={selectedIndex} />
          <MarineActivityMetrics index={selectedIndex} />
        </Stack>
      ) : (
        <Stack alignItems="center" paddingY={6}>
          <Typography variant="body2" color="text.secondary">
            선택 날짜에 제공되는 해양 지수가 없어요
          </Typography>
        </Stack>
      )}
    </Box>
  );
}

function MarineActivityGrade({ index }: { index: MarineActivityIndex }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
      <Typography variant="body2" fontWeight={700}>
        {index.type === MarineActivityType.Beach ? "해수욕 지수" : "스킨스쿠버 지수"}
      </Typography>
      <Typography variant="h6" fontWeight={800} lineHeight={1.15} color={getGradeColor(index.grade)}>
        {index.gradeLabel}
      </Typography>
    </Stack>
  );
}

function MarineActivityMetrics({ index }: { index: MarineActivityIndex }) {
  return (
    <Stack gap={1.25}>

      <InfoRow label="수온" value={formatMetricValue(index.metrics.waterTemperatureCelsius, "℃")} />
      <InfoRow label="파고" value={formatMetricValue(index.metrics.waveHeightMeters, "m")} />
      <InfoRow label="풍속" value={formatMetricValue(index.metrics.windSpeedMetersPerSecond, "m/s")} />
      <InfoRow label="기온" value={formatMetricValue(index.metrics.airTemperatureCelsius, "℃")} />
      <InfoRow label="유속" value={formatMetricValue(index.metrics.currentSpeedMetersPerSecond, "m/s")} />
      <InfoRow label="물때" value={index.metrics.tideLabel ?? "-"} />
    </Stack>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} textAlign="right">
        {value}
      </Typography>
    </Stack>
  );
}

function formatMetricValue(value: number | null, unit: string) {
  if (value == null) return "-";
  return `${value}${unit}`;
}

function getGradeColor(grade: MarineActivityIndex["grade"]) {
  if (grade === "veryGood" || grade === "good") return "primary";
  if (grade === "normal") return "textPrimary";
  if (grade === "bad" || grade === "veryBad") return "warning";
  return "text.primary";
}
