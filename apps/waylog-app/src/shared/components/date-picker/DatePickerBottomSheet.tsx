import { useState } from 'react'
import { BottomSheet } from '../bottom-sheet/BottomSheet'
import { Button } from '../mui'
import { DatePicker } from './DatePicker'
import { DEFAULT_MINUTE_STEP, type DatePickerMode, type DateRangeSelection } from './datePicker.model'

interface DatePickerBottomSheetProps {
  isOpen: boolean
  mode: DatePickerMode
  /** 시트를 열 때의 값. 확정 전까지 밖으로 새어 나가지 않는다. */
  defaultSelection: DateRangeSelection
  minuteStep?: number
  onConfirm: (selection: DateRangeSelection) => void
  /** 사용자가 닫으려 한다 (취소·배경 탭·아래로 끌기) */
  onClose: () => void
}

// time 모드는 시각 휠이 더 붙으므로 자리를 더 준다.
const SNAP_POINTS = { calendar: [0.62], time: [0.82] } as const

export function DatePickerBottomSheet({
  isOpen,
  mode,
  defaultSelection,
  minuteStep = DEFAULT_MINUTE_STEP,
  onConfirm,
  onClose,
}: DatePickerBottomSheetProps) {
  // 오버레이가 열 때마다 새로 마운트하므로 초기값은 한 번만 읽으면 된다.
  const [selection, setSelection] = useState<DateRangeSelection>(defaultSelection)

  const [start, end] = selection
  const needsBothEnds = mode === 'range'
  const isConfirmable = needsBothEnds ? start != null && end != null : start != null

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={mode === 'time' ? SNAP_POINTS.time : SNAP_POINTS.calendar}
      safeArea
    >
      <BottomSheet.Scrollable>
        <DatePicker
          mode={mode}
          selection={selection}
          minuteStep={minuteStep}
          onSelectionChange={setSelection}
        />
      </BottomSheet.Scrollable>

      <BottomSheet.BottomActions>
        <Button fullWidth size="large" onClick={onClose}>
          취소
        </Button>
        <Button
          fullWidth
          size="large"
          variant="contained"
          disabled={!isConfirmable}
          onClick={() => onConfirm(selection)}
        >
          확인
        </Button>
      </BottomSheet.BottomActions>
    </BottomSheet>
  )
}
