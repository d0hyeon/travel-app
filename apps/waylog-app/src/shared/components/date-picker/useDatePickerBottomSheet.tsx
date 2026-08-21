import { useCallback } from 'react'
import { useOverlay } from '../../hooks/useOverlay'
import { DatePickerBottomSheet } from './DatePickerBottomSheet'
import { DEFAULT_MINUTE_STEP, type DatePickerMode, type DateRangeSelection } from './datePicker.model'

interface OpenParams {
  mode?: DatePickerMode
  defaultSelection?: DateRangeSelection
  minuteStep?: number
}

const EMPTY_SELECTION: DateRangeSelection = [null, null]

/** 날짜 선택 시트를 열고 확정된 값을 받는다. 취소하면 null 이다. */
export function useDatePickerBottomSheet() {
  const overlay = useOverlay()

  const open = useCallback(
    ({
      mode = 'single',
      defaultSelection = EMPTY_SELECTION,
      minuteStep = DEFAULT_MINUTE_STEP,
    }: OpenParams = {}) => {
      return new Promise<DateRangeSelection | null>((resolve) => {
        overlay.open(({ isOpen, close }) => (
          <DatePickerBottomSheet
            isOpen={isOpen}
            mode={mode}
            defaultSelection={defaultSelection}
            minuteStep={minuteStep}
            onConfirm={(selection) => {
              resolve(selection)
              close()
            }}
            onClose={() => {
              resolve(null)
              close()
            }}
          />
        ))
      })
    },
    [overlay],
  )

  return { open }
}
