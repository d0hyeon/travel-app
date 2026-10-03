import { useCallback } from 'react'
import { useOverlay } from '../../hooks/useOverlay'
import { DatePickerBottomSheet } from './DatePickerBottomSheet'
import type { DateBounds, DateRange, DateSelection, DateTimeSetter } from './datePicker.model'

interface OpenDayParams extends DateBounds, DateTimeSetter {
  type?: 'date' | 'dateTime'
  defaultValue?: Date | null
  minuteStep?: number
}

interface OpenRangeParams extends DateBounds {
  defaultValue?: DateSelection
  /** 하루만 골라도 확정할 수 있게 한다. 이때 시작일과 종료일이 같아진다. */
  allowSingleDay?: boolean
}

const EMPTY_RANGE: DateSelection = [null, null]

/**
 * 날짜 선택 시트를 연다. 확정하면 고른 값이, 취소하면 null 이 온다.
 * 하루와 기간은 돌려주는 모양이 달라 여는 길도 나눠 둔다.
 */
export function useDatePickerBottomSheet() {
  const overlay = useOverlay()

  const openDay = useCallback(
    ({ type = 'date', defaultValue = null, minuteStep, ...params }: OpenDayParams = {}) =>


      new Promise<Date | null>((resolve) => {
        overlay.open(({ isOpen, close, onClose }) => {
          const settle = (value: Date | null) => {
            resolve(value)
            close()
          }

          return (
            <DatePickerBottomSheet
              isOpen={isOpen}
              type={type}
              defaultValue={defaultValue}
              minuteStep={minuteStep}
              onConfirm={settle}
              onDismiss={() => settle(null)}
              onClose={onClose}
              {...params}
            />
          )
        })
      }),
    [overlay],
  )

  const openRange = useCallback(
    ({ defaultValue = EMPTY_RANGE, allowSingleDay, minDate, maxDate }: OpenRangeParams = {}) =>
      new Promise<DateRange | null>((resolve) => {
        overlay.open(({ isOpen, close }) => {
          const settle = (value: DateRange | null) => {
            resolve(value)
            close()
          }

          return (
            <DatePickerBottomSheet
              isOpen={isOpen}
              type="range"
              defaultValue={defaultValue}
              allowSingleDay={allowSingleDay}
              minDate={minDate}
              maxDate={maxDate}
              onConfirm={settle}
              onDismiss={() => settle(null)}
            />
          )
        })
      }),
    [overlay],
  )

  return { openDay, openRange }
}
