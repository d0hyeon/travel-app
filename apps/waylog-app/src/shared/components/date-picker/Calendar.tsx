import { addMonths } from 'date-fns'
import { useCallback, useEffect, useImperativeHandle, type Ref } from 'react'
import { StyleSheet, View, useWindowDimensions } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { buildMonthMatrix } from './calendar.utils'
import type { DateRangeSelection } from './datePicker.model'
import { Typography } from '../mui'
import { palette } from '../../config/tokens'
import { CalendarDay } from './CalendarDay'

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const

// 달을 넘길 때 쓰는 방향. 이름으로 부호의 의미를 남긴다.
const Direction = { Previous: -1, Next: 1 } as const

const SWIPE_DISTANCE_THRESHOLD = 60
const SWIPE_VELOCITY_THRESHOLD = 500
const SLIDE_DURATION = 240

/** 달 이동을 밖에서 시켜도 스와이프와 같은 애니메이션을 타게 한다. */
export type CalendarRef = {
  slidePrevious: () => void
  slideNext: () => void
}

interface CalendarProps {
  cursor: Date
  selection: DateRangeSelection
  onCursorChange: (cursor: Date) => void
  onSelectDay: (day: Date) => void
  ref?: Ref<CalendarRef>
}

/**
 * 앞뒤 달을 양옆에 미리 깔아두고 통째로 민다.
 * 넘긴 뒤에는 새 커서 기준으로 다시 그려지므로 위치를 0으로 되돌린다.
 */
export function Calendar({ cursor, selection, onCursorChange, onSelectDay, ref }: CalendarProps) {
  const { width } = useWindowDimensions()
  const offsetX = useSharedValue(0)
  const isSliding = useSharedValue(false)

  // 커서가 바뀌면 가운데 달이 교체된 것이므로 위치를 원점으로 되돌린다.
  useEffect(() => {
    offsetX.set(0)
    isSliding.set(false)
  }, [cursor, offsetX, isSliding])

  const commitDirection = useCallback(
    (direction: number) => {
      onCursorChange(addMonths(cursor, direction))
    },
    [cursor, onCursorChange],
  )

  // 스와이프든 버튼이든 같은 길로 달을 넘긴다.
  const slide = useCallback(
    (direction: number) => {
      if (isSliding.get()) return
      isSliding.set(true)

      offsetX.set(
        withTiming(-direction * width, { duration: SLIDE_DURATION }, (finished) => {
          if (finished === true) runOnJS(commitDirection)(direction)
        }),
      )
    },
    [commitDirection, width, offsetX, isSliding],
  )

  useImperativeHandle(
    ref as never,
    () => ({
      slidePrevious: () => slide(Direction.Previous),
      slideNext: () => slide(Direction.Next),
    }),
    [slide],
  )

  const settle = useCallback(
    (translationX: number, velocityX: number) => {
      const isFarEnough = Math.abs(translationX) > SWIPE_DISTANCE_THRESHOLD
      const isFastEnough = Math.abs(velocityX) > SWIPE_VELOCITY_THRESHOLD

      // 덜 끌었으면 원래 자리로 되돌린다.
      if (!isFarEnough && !isFastEnough) {
        offsetX.set(withTiming(0, { duration: SLIDE_DURATION }))
        return
      }

      // 오른쪽으로 끌면 왼쪽에 깔린 이전 달이 따라 들어온다.
      slide(translationX > 0 ? Direction.Previous : Direction.Next)
    },
    [slide, offsetX],
  )

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    // 세로로 끄는 동안에는 시트가 제스처를 갖도록 비켜준다.
    .failOffsetY([-16, 16])
    .onUpdate((event) => {
      if (isSliding.get()) return
      offsetX.set(event.translationX)
    })
    .onEnd((event) => {
      if (isSliding.get()) return
      runOnJS(settle)(event.translationX, event.velocityX)
    })

  const trackStyle = useAnimatedStyle(() => ({
    flexDirection: 'row',
    width: width * 3,
    transform: [{ translateX: offsetX.get() - width }],
  }))

  const months = [
    addMonths(cursor, Direction.Previous),
    cursor,
    addMonths(cursor, Direction.Next),
  ]

  return (
    <View>
      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label) => (
          <View key={label} style={styles.weekdayCell}>
            <Typography variant="caption" color={palette.textSecondary}>
              {label}
            </Typography>
          </View>
        ))}
      </View>

      <View style={styles.viewport}>
        <GestureDetector gesture={pan}>
          <Animated.View style={trackStyle}>
            {months.map((month) => (
              <View key={month.toISOString()} style={{ width }}>
                <MonthGrid month={month} selection={selection} onSelectDay={onSelectDay} />
              </View>
            ))}
          </Animated.View>
        </GestureDetector>
      </View>
    </View>
  )
}

interface MonthGridProps {
  month: Date
  selection: DateRangeSelection
  onSelectDay: (day: Date) => void
}

function MonthGrid({ month, selection, onSelectDay }: MonthGridProps) {
  const weeks = buildMonthMatrix(month)

  return (
    <View style={styles.grid}>
      {weeks.map((week) => (
        <View key={week[0]!.toISOString()} style={styles.week}>
          {week.map((day) => (
            <CalendarDay
              key={day.toISOString()}
              day={day}
              month={month}
              selection={selection}
              onPress={onSelectDay}
            />
          ))}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  weekdayRow: { flexDirection: 'row', paddingHorizontal: 8, paddingBottom: 4 },
  weekdayCell: { flex: 1, alignItems: 'center' },
  // 양옆에 깔린 달이 삐져나오지 않도록 잘라낸다.
  viewport: { overflow: 'hidden' },
  grid: { paddingHorizontal: 8, gap: 2 },
  week: { flexDirection: 'row' },
})
