import { useTripPlaces, useTripRoutes } from '@waylog/domains/modules/trip'
import { assert } from '@waylog/utility'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import type { RoutePlaceFormValues } from './routePlaceForm.types'

export type RoutePlaceEditTab = 'schedule' | 'place'

interface Params {
  tripId: string
  routeId: string
  placeId: string
  onSaved: () => void
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

export function useRoutePlaceEditForm({ tripId, routeId, placeId, onSaved }: Params) {
  const { data: places, update: updatePlace } = useTripPlaces(tripId)
  const { data: { routes }, updateRoutePlace } = useTripRoutes(tripId)
  const route = routes.find((x) => x.id === routeId)
  const place = places.find((x) => x.id === placeId)
  assert(!!route, '존재하지 않는 경로입니다.')
  assert(!!place, '존재하지 않는 장소입니다.')

  const [tab, setTab] = useState<RoutePlaceEditTab>('schedule')
  const placeTime = route.placeTimes[place.id]
  const { control, handleSubmit, formState: { isSubmitting } } = useForm<RoutePlaceFormValues>({
    mode: 'onChange',
    defaultValues: {
      startTime: placeTime?.startTime ?? null,
      endTime: placeTime?.endTime ?? null,
      routeMemo: toMemoText(route.placeMemos[place.id] ?? []),
      category: place.category ?? 'none',
      placeMemo: place.memo ?? '',
    },
  })

  const submit = handleSubmit(
    async ({ startTime, endTime, routeMemo, category, placeMemo }) => {
      try {
        await Promise.all([
          updateRoutePlace({
            routeId,
            placeId: place.id,
            time: { startTime, endTime },
            memos: toMemos(routeMemo),
          }),
          updatePlace({
            id: place.id,
            category: category === 'none' ? null : category,
            memo: placeMemo,
          }),
        ])
      } catch {
        toast.error('저장하지 못했어요')
        return
      }
      onSaved()
    },
    () => setTab('schedule'),
  )

  return { place, control, tab, setTab, submit, isSubmitting }
}
