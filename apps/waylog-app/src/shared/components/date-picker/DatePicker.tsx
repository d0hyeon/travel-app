import { format, setHours, setMinutes, startOfDay } from 'date-fns'
import { useRef, useState } from 'react'
import { Pressable, View } from 'react-native'

import { Calendar, type CalendarRef } from './Calendar'
import { CalendarHeader } from './CalendarHeader'
import { TimeStepHeader } from './TimeStepHeader'
import { TimeWheel } from './TimeWheel'
import { toggleRangeSelection } from './calendar.utils'
import type { DatePickerStep, DateSelection, TimeOfDay } from './datePicker.model'
import { DEFAULT_MINUTE_STEP } from './datePicker.model'

import { MaterialIcons } from '@expo/vector-icons'
import { palette } from '../../config/tokens'
import { Stack, Typography } from '../mui'

const EMPTY_RANGE: DateSelection = [null, null]

/**
 * 고르는 중인 값의 모양은 타입이 정한다.
 * date·dateTime 은 하루뿐이라 빈 둘째 칸을 들고 다니지 않는다.
 */
type DatePickerValueProps =
  | {
    type?: 'date' | 'dateTime'
    /** 아직 안 골랐으면 옵셔널이다. */
    value?: Date
    onChange?: (value: Date) => void
  }
  | {
    type: 'range'
    value?: DateSelection
    onChange?: (value: DateSelection) => void
  }

type DatePickerProps = DatePickerValueProps & {
  /**
   * 보여줄 단계. 주면 밖이 쥐고, 주지 않으면 안에서 쥔다.
   * 하단 버튼이 단계를 따라가야 하는 곳만 주면 된다.
   */
  step?: DatePickerStep
  /** dateTime 에서만 쓴다. */
  minuteStep?: number
  /** 단계가 바뀌어야 할 때. step 을 준 쪽은 이걸 받아 직접 옮긴다. */
  onStepChange?: (step: DatePickerStep) => void
}

/**
 * 달력이 보여줄 달과 고르는 중인 날짜를 쥔다. 확정 시점은 위가 정한다.
 *
 * dateTime 에서 날짜를 고르면 시각 단계로 넘어간다.
 * 이 전환은 안에서 끝내므로 소비처가 매번 다시 구현하지 않는다.
 */
export function DatePicker(props: DatePickerProps) {
  const { type = 'date', step, minuteStep = DEFAULT_MINUTE_STEP, onStepChange } = props

  // 달력은 어느 타입이든 같은 모양으로 그리므로 안에서는 늘 기간 꼴로 쥔다.
  const selectionFromProps: DateSelection =
    props.type === 'range' ? (props.value ?? EMPTY_RANGE) : [props.value ?? null, null]

  const [innerSelection, setInnerSelection] = useState(selectionFromProps)
  const [innerStep, setInnerStep] = useState<DatePickerStep>('date')

  // value 를 준 쪽이 값의 주인이다. step 은 따로 물어야 한다. 둘은 각각 맡길 수 있다.
  const isValueControlled = props.value !== undefined
  const isStepControlled = step !== undefined

  const selection = isValueControlled ? selectionFromProps : innerSelection
  const [start] = selection
  const currentStep = step ?? innerStep

  const [cursor, setCursor] = useState(() => start ?? new Date())
  const calendarRef = useRef<CalendarRef>(null)

  const goToStep = (next: DatePickerStep) => {
    if (!isStepControlled) setInnerStep(next)
    onStepChange?.(next)
  }

  // 안에서 쥔 값도 밖으로 내보내는 값도 타입이 정한 모양이라 분기 안에서 함께 옮긴다.
  const changeDay = (picked: Date) => {
    if (!isValueControlled) setInnerSelection([picked, null])
    if (props.type !== 'range') props.onChange?.(picked)
  }

  const changeRange = (picked: DateSelection) => {
    if (!isValueControlled) setInnerSelection(picked)
    if (props.type === 'range') props.onChange?.(picked)
  }

  const handleSelectDay = (day: Date) => {
    if (props.type === 'range') {
      changeRange(toggleRangeSelection(selection, day))
      return
    }

    // 하루만 고르는 타입에서는 이미 고른 시각을 잃지 않게 날짜만 갈아끼운다.
    const time = start ?? startOfDay(day)
    changeDay(setMinutes(setHours(day, time.getHours()), time.getMinutes()))

    // 날짜를 고르면 곧바로 시각을 묻는다. 누를 버튼을 하나 줄인다.
    if (type === 'dateTime') goToStep('time')
  }

  const handleChangeTime = ({ hours, minutes }: TimeOfDay) => {
    // 시각 단계는 range 에 없다. 날짜 하나를 고르는 타입만 여기 온다.
    if (props.type === 'range') return

    // 날짜를 아직 안 골랐으면 오늘에 시각을 얹는다. 휠이 헛돌지 않게 한다.
    const base = start ?? startOfDay(new Date())
    changeDay(setMinutes(setHours(base, hours), minutes))
  }

  if (currentStep === 'time') {
    // 시각 단계에 왔다면 날짜는 이미 골라져 있다.
    const pickedTime = start ?? startOfDay(new Date())

    return (
      <View>
        {/* 단계를 밖이 쥐면 돌아가는 길도 밖에 있다. 여기서 또 내면 뒤로가기가 둘이 된다. */}
        {!isStepControlled && (
          <TimeStepHeader day={pickedTime} onBack={() => goToStep('date')} />
        )}

        <TimeWheel
          hours={pickedTime.getHours()}
          minutes={pickedTime.getMinutes()}
          minuteStep={minuteStep}
          onChange={handleChangeTime}
        />
      </View>
    )
  }

  return (
    <View>
      <CalendarHeader
        cursor={cursor}
        onPreviousMonth={() => calendarRef.current?.slidePrevious()}
        onNextMonth={() => calendarRef.current?.slideNext()}
      />

      <Calendar
        ref={calendarRef}
        cursor={cursor}
        selection={selection}
        onCursorChange={setCursor}
        onSelectDay={handleSelectDay}
      />
    </View>
  )
}
