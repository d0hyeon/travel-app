import { eachDayOfInterval } from 'date-fns'
import { Suspense, useCallback, useMemo, useState } from 'react'
import { MarineActivityType, type MarineActivityIndex } from '@waylog/domains/modules/marine-activity'
import { useDailyMarineActivityIndices } from '@waylog/domains/modules/marine-activity'
import { formatDisplayDate, formatShortDate } from '@waylog/utility'
import type { Trip } from '@waylog/domains/modules/trip'
import { useTrip } from '@waylog/domains/modules/trip'
import { BottomSheet } from '../../../shared/components/bottom-sheet/BottomSheet'
import { Box, Stack, Tab, Tabs, Typography } from '../../../shared/components/mui'
import { useOverlay } from '../../../shared/hooks/useOverlay'
import { palette } from '../../../shared/config/tokens'

interface TripMarineActivityDetailOverlayProps {
  trip: Trip
  placeCode: string
  placeName: string
  initialDate: string
  isOpen: boolean
  onClose: () => void
}

type OpenTripMarineActivityDetailParams = Omit<
  TripMarineActivityDetailOverlayProps,
  'isOpen' | 'onClose' | 'trip'
>

export function useTripMarineActivityDetailOverlay(tripId: string) {
  const overlay = useOverlay()
  const { data: trip } = useTrip(tripId)

  const open = useCallback(
    (params: OpenTripMarineActivityDetailParams) => {
      return overlay.open(({ isOpen, close }) => (
        <TripMarineActivityDetailSheet
          {...params}
          trip={trip}
          isOpen={isOpen}
          onClose={close}
        />
      ))
    },
    [overlay, trip],
  )

  return { open }
}

// 웹은 모바일에서 BottomSheet, 데스크톱에서 Dialog 를 쓴다. 앱은 시트만 있다.
function TripMarineActivityDetailSheet({
  placeName,
  isOpen,
  onClose,
  initialDate,
  ...detailParams
}: TripMarineActivityDetailOverlayProps) {
  const [selectedDate, selectDate] = useState(initialDate)
  const tripDates = useMemo(
    () =>
      eachDayOfInterval({
        start: detailParams.trip.startDate,
        end: detailParams.trip.endDate,
      }).map(formatDisplayDate),
    [detailParams.trip],
  )

  return (
    <BottomSheet isOpen={isOpen} onDismiss={onClose} snapPoints={[0.9]} defaultSnapIndex={0}>
      <BottomSheet.Header direction="row" justifyContent="space-between">
        <Typography variant="subtitle1">{placeName}</Typography>
      </BottomSheet.Header>
      <BottomSheet.Body sx={{ paddingHorizontal: 0 }}>
        <Tabs value={selectedDate} onChange={(_, date) => selectDate(date)}>
          {tripDates.map((date) => (
            <Tab key={date} value={date} label={formatShortDate(date)} />
          ))}
        </Tabs>
        <Suspense>
          <TripMarineActivityDetailContent date={selectedDate} {...detailParams} />
        </Suspense>
      </BottomSheet.Body>
    </BottomSheet>
  )
}

interface ContentProps
  extends Omit<
    TripMarineActivityDetailOverlayProps,
    'placeName' | 'isOpen' | 'onClose' | 'initialDate'
  > {
  date: string
}

function TripMarineActivityDetailContent({
  trip: { lat, lng },
  placeCode,
  date,
}: ContentProps) {
  const { data } = useDailyMarineActivityIndices({ coordinate: { lat, lng }, date })
  const selectedIndex = data?.indices?.find?.((index) => index.placeCode === placeCode)

  return (
    <Box sx={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}>
      {selectedIndex ? (
        <Stack gap={2}>
          <MarineActivityGrade index={selectedIndex} />
          <MarineActivityMetrics index={selectedIndex} />
        </Stack>
      ) : (
        <Stack alignItems="center" sx={{ paddingVertical: 48 }}>
          <Typography variant="body2" color="text.secondary">
            선택 날짜에 제공되는 해양 지수가 없어요
          </Typography>
        </Stack>
      )}
    </Box>
  )
}

function MarineActivityGrade({ index }: { index: MarineActivityIndex }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
      <Typography variant="body2">
        {index.type === MarineActivityType.Beach ? '해수욕 지수' : '스킨스쿠버 지수'}
      </Typography>
      <Typography variant="h6" sx={{ color: getGradeColor(index.grade) }}>
        {index.gradeLabel}
      </Typography>
    </Stack>
  )
}

function MarineActivityMetrics({ index }: { index: MarineActivityIndex }) {
  return (
    <Stack gap={1.25}>
      <InfoRow label="수온" value={formatMetricValue(index.metrics.waterTemperatureCelsius, '℃')} />
      <InfoRow label="파고" value={formatMetricValue(index.metrics.waveHeightMeters, 'm')} />
      <InfoRow
        label="풍속"
        value={formatMetricValue(index.metrics.windSpeedMetersPerSecond, 'm/s')}
      />
      <InfoRow label="기온" value={formatMetricValue(index.metrics.airTemperatureCelsius, '℃')} />
      <InfoRow
        label="유속"
        value={formatMetricValue(index.metrics.currentSpeedMetersPerSecond, 'm/s')}
      />
      <InfoRow label="물때" value={index.metrics.tideLabel ?? '-'} />
    </Stack>
  )
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" textAlign="right">
        {value}
      </Typography>
    </Stack>
  )
}

function formatMetricValue(value: number | null, unit: string) {
  if (value == null) return '-'
  return `${value}${unit}`
}

function getGradeColor(grade: MarineActivityIndex['grade']) {
  if (grade === 'veryGood' || grade === 'good') return palette.primary
  if (grade === 'bad' || grade === 'veryBad') return palette.warning
  return palette.text
}
