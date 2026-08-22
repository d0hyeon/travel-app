import { useState } from 'react'
import { BottomSheet } from '../bottom-sheet/BottomSheet'
import { Button } from '../mui'
import { DatePicker } from './DatePicker'
import { DEFAULT_MINUTE_STEP } from './datePicker.model'
import type { DatePickerStep, DateRange, DateSelection } from './datePicker.model'

/** 확정된 값의 모양도 타입이 정한다. 시트를 여는 쪽은 무엇을 고를지 이미 안다. */
type DatePickerBottomSheetValueProps =
  | {
      type?: 'date' | 'dateTime'
      /** 시트를 열 때의 값. 확정 전까지 밖으로 새어 나가지 않는다. */
      defaultValue: Date | null
      minuteStep?: number
      onConfirm: (value: Date) => void
    }
  | {
      type: 'range'
      defaultValue: DateSelection
      /** 하루만 골라도 확정할 수 있게 한다. 이때 시작일과 종료일이 같아진다. */
      allowSingleDay?: boolean
      onConfirm: (value: DateRange) => void
    }

type DatePickerBottomSheetProps = DatePickerBottomSheetValueProps & {
  isOpen: boolean
  /** 사용자가 닫으려 한다 (취소·배경 탭·아래로 끌기) */
  onDismiss: () => void
}

// 시각 휠은 달력보다 자리를 덜 먹는다.
const SNAP_POINTS = { date: [0.62], time: [0.45] } as const

export function DatePickerBottomSheet(props: DatePickerBottomSheetProps) {
  const { isOpen, onDismiss } = props

  // 두 모양을 한 상태에 담으면 다시 빈 칸을 들고 다니게 되므로 따로 쥔다.
  const [day, setDay] = useState<Date | null>(
    props.type === 'range' ? null : props.defaultValue,
  )
  const [range, setRange] = useState<DateSelection>(
    props.type === 'range' ? props.defaultValue : [null, null],
  )
  const [step, setStep] = useState<DatePickerStep>('date')

  const [start, end] = range
  const allowSingleDay = props.type === 'range' && props.allowSingleDay === true
  const isConfirmable =
    props.type === 'range' ? start != null && (end != null || allowSingleDay) : day != null

  const handlePressPrimary = () => {
    if (props.type === 'range') {
      if (start == null) return
      // 하루만 고른 기간은 양끝을 같은 날로 채워 내보낸다. 소비자는 빈 칸을 보지 않는다.
      props.onConfirm([start, end ?? start])
      return
    }

    if (day == null) return
    props.onConfirm(day)
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onDismiss={onDismiss}
      snapPoints={step === 'time' ? SNAP_POINTS.time : SNAP_POINTS.date}
      safeArea
    >
      <BottomSheet.Scrollable>
        {props.type === 'range' ? (
          <DatePicker type="range" value={range} onChange={setRange} />
        ) : (
          <DatePicker
            type={props.type ?? 'date'}
            value={day ?? undefined}
            step={step}
            minuteStep={props.minuteStep ?? DEFAULT_MINUTE_STEP}
            onChange={setDay}
            onStepChange={setStep}
          />
        )}
      </BottomSheet.Scrollable>

      <BottomSheet.BottomActions>
        <Button fullWidth size="large" onClick={step === 'time' ? () => setStep('date') : onDismiss}>
          {step === 'time' ? '이전' : '취소'}
        </Button>
        <Button
          fullWidth
          size="large"
          variant="contained"
          disabled={!isConfirmable}
          onClick={handlePressPrimary}
        >
          확인
        </Button>
      </BottomSheet.BottomActions>
    </BottomSheet>
  )
}
