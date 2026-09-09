import { addMonths } from 'date-fns'
import { useCallback, useImperativeHandle, useLayoutEffect, useRef, type Ref } from 'react'
import {
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native'
import { buildMonthMatrix } from './calendar.utils'
import type { DateSelection } from './datePicker.model'
import { Typography } from '~/shared/components/design-system'
import { palette } from '../../config/tokens'
import { CalendarDay } from './CalendarDay'

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const

// 달을 넘길 때 쓰는 방향. 이름으로 부호의 의미를 남긴다.
const Direction = { Previous: -1, Next: 1 } as const

/** 달 이동을 밖에서 시켜도 스와이프와 같은 애니메이션을 타게 한다. */
export type CalendarRef = {
  slidePrevious: () => void
  slideNext: () => void
}

interface CalendarProps {
  cursor: Date
  selection: DateSelection
  onCursorChange: (cursor: Date) => void
  onSelectDay: (day: Date) => void
  ref?: Ref<CalendarRef>
}

/**
 * 앞뒤 달을 양옆에 미리 깔아두고 가운데 페이지(현재 달)를 기준으로 페이징한다.
 * 페이징 애니메이션은 네이티브 ScrollView에 맡겨 JS 왕복 없이 매끄럽게 끝낸다.
 * 스크롤이 완전히 멈춘 뒤에야 cursor를 갱신하고 위치를 조용히 가운데로 되돌리므로,
 * 되돌리는 순간이 화면에 애니메이션으로 보이지 않는다.
 */
export function Calendar({ cursor, selection, onCursorChange, onSelectDay, ref }: CalendarProps) {
  const { width } = useWindowDimensions()
  const scrollRef = useRef<ScrollView>(null)
  const cursorRef = useRef(cursor)
  cursorRef.current = cursor

  // cursor가 바뀌어 가운데 달이 교체된 프레임에 맞춰 스크롤 위치를 원점으로 되돌린다.
  // useLayoutEffect로 커밋과 같은 프레임에 묶어, 옛 달 위치로 보였다가 다시 튀는
  // 깜빡임 없이 조용히 스왑되게 한다.
  useLayoutEffect(() => {
    scrollRef.current?.scrollTo({ x: width, animated: false })
  }, [cursor, width])

  const goTo = useCallback(
    (direction: number, animated: boolean) => {
      scrollRef.current?.scrollTo({ x: (1 + direction) * width, animated })
    },
    [width],
  )

  useImperativeHandle(
    ref as never,
    () => ({
      slidePrevious: () => goTo(Direction.Previous, true),
      slideNext: () => goTo(Direction.Next, true),
    }),
    [goTo],
  )

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(event.nativeEvent.contentOffset.x / width)
    const direction = page - 1
    if (direction === 0) return

    onCursorChange(addMonths(cursorRef.current, direction))
  }

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
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          // normal(기본값)은 감속이 느려 화면이 페이지에 스냅된 뒤에도 momentum이
          // 한참 남아 onMomentumScrollEnd가 손 뗀 시점과 다르게 들쭉날쭉 늦게 온다.
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          // 초기 렌더에서도 가운데 페이지(현재 달)에서 시작한다.
          contentOffset={{ x: width, y: 0 }}
          onMomentumScrollEnd={handleScrollEnd}
        >
          {months.map((month) => (
            <View key={month.toISOString()} style={{ width }}>
              <MonthGrid month={month} selection={selection} onSelectDay={onSelectDay} />
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  )
}

interface MonthGridProps {
  month: Date
  selection: DateSelection
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
