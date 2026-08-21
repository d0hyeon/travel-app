import { setHours, setMinutes, startOfDay } from 'date-fns'
import { useRef, useState } from 'react'
import { View } from 'react-native'

import { Calendar, type CalendarRef } from './Calendar'
import { CalendarHeader } from './CalendarHeader'
import { TimeWheel } from './TimeWheel'
import { toggleRangeSelection } from './calendar.utils'
import type { DatePickerMode, DateRangeSelection, TimeOfDay } from './datePicker.model'

interface DatePickerProps {
  mode: DatePickerMode
  selection: DateRangeSelection
  minuteStep: number
  onSelectionChange: (selection: DateRangeSelection) => void
}

/**
 * 달력이 보여줄 달과 고르는 중인 날짜를 쥔다.
 * 확정 시점은 위(시트)가 정하므로 여기서는 고르는 것까지만 책임진다.
 */
export function DatePicker({ mode, selection, minuteStep, onSelectionChange }: DatePickerProps) {
  const [start] = selection
  const [cursor, setCursor] = useState(() => start ?? new Date())
  const calendarRef = useRef<CalendarRef>(null)

  const handleSelectDay = (day: Date) => {
    if (mode === 'range') {
      onSelectionChange(toggleRangeSelection(selection, day))
      return
    }

    // 하루만 고르는 모드에서는 이미 고른 시각을 잃지 않게 날짜만 갈아끼운다.
    const time = start ?? startOfDay(day)
    const picked = setMinutes(setHours(day, time.getHours()), time.getMinutes())

    onSelectionChange([picked, null])
  }

  const handleChangeTime = ({ hours, minutes }: TimeOfDay) => {
    // 날짜를 아직 안 골랐으면 오늘에 시각을 얹는다. 휠이 헛돌지 않게 한다.
    const base = start ?? startOfDay(new Date())

    onSelectionChange([setMinutes(setHours(base, hours), minutes), null])
  }

  // 날짜를 고르기 전에도 휠은 자리를 지킨다. 나중에 나타나면 화면이 튄다.
  const pickedTime = start ?? startOfDay(new Date())

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

      {mode === 'time' && (
        <TimeWheel
          hours={pickedTime.getHours()}
          minutes={pickedTime.getMinutes()}
          minuteStep={minuteStep}
          onChange={handleChangeTime}
        />
      )}
    </View>
  )
}
