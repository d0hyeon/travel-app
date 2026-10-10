import { useTripPlaces, useTripRoutes } from '@waylog/domains/modules/trip'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Linking, Pressable, StyleSheet, View } from 'react-native'
import { BottomSheet } from '~shared/components/bottom-sheet/BottomSheet'
import { useConfirmDialog } from '~shared/components/confirm-dialog/useConfirmDialog'
import { Button, Chip, Stack, Typography } from '~shared/components/design-system'
import { toast } from '~shared/components/toast/toast'
import { palette } from '~shared/config/tokens'
import { assert } from '~shared/utils/assert'
import { usePlaceDetailOverlay } from '~features/place/place-detail/usePlaceDetailOverlay'
import { PlaceTitleButton } from '~features/trip/trip-place/trip-place-form/PlaceTitleButton'
import { RoutePlaceInfoFields } from './RoutePlaceInfoFields'
import type { RoutePlaceFormValues } from './routePlaceForm.types'
import { RoutePlaceScheduleFields } from './RoutePlaceScheduleFields'

type SheetTab = 'schedule' | 'place'

const SHEET_TABS: { value: SheetTab; label: string }[] = [
  { value: 'schedule', label: '일정' },
  { value: 'place', label: '장소 정보' },
]

interface Props {
  tripId: string
  routeId: string
  placeId: string
  onClose: () => Promise<void>
}

function toMemoText(memos: string[]) {
  return memos.join('\n')
}

function toMemos(memoText: string) {
  return memoText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
}

export function RoutePlaceEditSheet({ tripId, routeId, placeId, onClose }: Props) {
  const { data: places, update: updatePlace } = useTripPlaces(tripId)
  const { data: { routes }, update: updateRoute, updateRoutePlace } = useTripRoutes(tripId)
  const route = routes.find((x) => x.id === routeId)
  const place = places.find((x) => x.id === placeId)
  assert(route != null, '존재하지 않는 경로입니다.')
  assert(place != null, '해당 장소가 존재하지 않습니다.')

  const confirm = useConfirmDialog()
  const placeDetail = usePlaceDetailOverlay()
  const [tab, setTab] = useState<SheetTab>('schedule')
  const placeTime = route.placeTimes[place.id]
  const { control, handleSubmit, formState: { isSubmitting } } = useForm<RoutePlaceFormValues>({
    mode: 'onChange',
    defaultValues: {
      startTime: placeTime?.startTime ?? null,
      endTime: placeTime?.endTime ?? null,
      routeMemo: toMemoText(route.placeMemos[place.id] ?? []),
      category: place.category ?? null,
      placeMemo: place.memo ?? '',
    },
  })

  const removeFromRoute = async () => {
    if (!(await confirm('이 장소를 일정에서 뺄까요?'))) return

    await onClose()
    await updateRoute({ routeId, placeIds: route.placeIds.filter((id) => id !== place.id) })
    toast.success('일정에서 뺐어요')
  }

  const save = handleSubmit(
    async ({ startTime, endTime, routeMemo, category, placeMemo }) => {
      try {
        await Promise.all([
          updateRoutePlace({
            routeId,
            placeId: place.id,
            time: { startTime, endTime },
            memos: toMemos(routeMemo),
          }),
          updatePlace({ id: place.id, category, memo: placeMemo }),
        ])
      } catch {
        toast.error('저장하지 못했어요')
        return
      }
      toast.success('저장했어요')
      await onClose()
    },
    () => setTab('schedule'),
  )

  return (
    <>
      <BottomSheet.Header direction="row" justifyContent="space-between">
        <PlaceTitleButton name={place.name} onPress={() => placeDetail.open(place.placeId)} />
        <Button variant="outlined" size="small" onPress={removeFromRoute}>
          일정에서 빼기
        </Button>
      </BottomSheet.Header>
      <BottomSheet.Body style={styles.sheetBody}>
        <Stack direction="row" gap={1} style={styles.searchLinks}>
          <Chip label="네이버" variant="outlined" onPress={() => void Linking.openURL(`https://search.naver.com/search.naver?query=${encodeURIComponent(place.name)}`)} />
          <Chip label="인스타" variant="outlined" onPress={() => void Linking.openURL(`https://www.instagram.com/explore/tags/${encodeURIComponent(place.name.replaceAll(' ', ''))}/`)} />
          <Chip label="구글" variant="outlined" onPress={() => void Linking.openURL(`https://www.google.com/search?q=${encodeURIComponent(place.name)}`)} />
        </Stack>

        <View style={styles.segment}>
          {SHEET_TABS.map(({ value, label }) => (
            <Pressable
              key={value}
              style={[styles.segmentItem, tab === value && styles.segmentItemActive]}
              onPress={() => setTab(value)}
            >
              <Typography
                style={styles.segmentLabel}
                color={tab === value ? 'text.primary' : 'text.secondary'}
              >
                {label}
              </Typography>
            </Pressable>
          ))}
        </View>

        <View style={styles.tabContent}>
          <View style={tab !== 'schedule' && styles.hidden}>
            <RoutePlaceScheduleFields control={control} />
          </View>
          <View style={tab !== 'place' && styles.hidden}>
            <RoutePlaceInfoFields control={control} />
          </View>
        </View>
      </BottomSheet.Body>
      <BottomSheet.BottomActions>
        <Button variant="outlined" size="large" fullWidth onPress={onClose}>
          취소
        </Button>
        <Button variant="contained" size="large" fullWidth loading={isSubmitting} onPress={save}>
          저장
        </Button>
      </BottomSheet.BottomActions>
    </>
  )
}

const styles = StyleSheet.create({
  sheetBody: { paddingHorizontal: 16 },
  searchLinks: { marginTop: 8, marginBottom: 16 },
  segment: {
    flexDirection: 'row',
    padding: 4,
    marginBottom: 16,
    backgroundColor: '#F1F3F5',
    borderRadius: 10,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  segmentItemActive: {
    backgroundColor: palette.background,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  segmentLabel: { fontSize: 14, lineHeight: 20, fontWeight: '700' },
  tabContent: { minHeight: 252 },
  hidden: { display: 'none' },
})
