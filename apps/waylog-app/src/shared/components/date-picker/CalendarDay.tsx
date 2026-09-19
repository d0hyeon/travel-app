import { isSameDay, isSameMonth, isToday as checkIsToday } from 'date-fns'
import { Pressable, StyleSheet, View } from 'react-native'
import { isWithinRange } from './calendar.utils'
import type { DateSelection } from './datePicker.model'
import { Typography } from '~/shared/components/design-system'
import { palette, radius } from '../../config/tokens'

interface CalendarDayProps {
  day: Date
  /** 이 칸이 속한 달. 다른 달 날짜는 자리만 지킨다. */
  month: Date
  selection: DateSelection
  /** 고를 수 없는 날. 눌러도 반응하지 않는다. */
  disabled?: boolean
  onPress: (day: Date) => void
}

// 기간 배경은 칸을 꽉 채워야 날짜끼리 이어져 보인다.
// 양 끝만 둥글려 알약 모양이 되게 한다.
export function CalendarDay({ day, month, selection, disabled, onPress }: CalendarDayProps) {
  const [start, end] = selection
  const isToday = checkIsToday(day)
  const isOutsideMonth = !isSameMonth(day, month)
  if (isOutsideMonth) return <View style={styles.cell} />

  // 고를 수 없는 날은 기간 배경을 입히지 않는다.
  // 칠해두면 고른 것으로 읽혀 눌리지 않는 이유를 설명하지 못한다.
  if (disabled === true) {
    return (
      <View style={[styles.cell, styles.disabled]}>
        <View style={styles.rangeBand}>
          <Typography variant="body2" color="text.secondary">
            {day.getDate()}
          </Typography>
        </View>
      </View>
    )
  }

  const isStart = start != null && isSameDay(start, day)
  const isEnd = end != null && isSameDay(end, day)
  const isEdge = isStart || isEnd

  // 고른 끝은 반대쪽 끝이 비어 있어도 칠한다.
  // 한쪽을 풀었을 때 남은 끝이 사라지면 초기화된 것으로 읽힌다.
  const isSelected = isEdge || isWithinRange(day, selection)

  // 한쪽 끝만 찍힌 동안에는 그 하루가 양끝을 겸한다.
  const isLoneEdge = isEdge && (start == null || end == null)

  return (
    <Pressable style={styles.cell} onPress={() => onPress(day)}>
      <View
        style={[
          styles.rangeBand,
          isSelected && styles.view,
          (isStart || isLoneEdge) && styles.bandStart,
          (isEnd || isLoneEdge) && styles.bandEnd,
          !isSelected && isToday && styles.outlined
        ]}
      >
        <Typography variant="body2" style={{ color: isSelected ? '#fff' : palette.text }}>
          {day.getDate()}
        </Typography>
      </View>
    </Pressable>
  )
}

/** 격자 높이를 이 값으로 잡는 쪽이 있어 한 군데서만 정한다. */
export const CALENDAR_DAY_HEIGHT = 40

const styles = StyleSheet.create({
  // 7칸이 폭을 고르게 나눠 가져야 요일이 세로로 줄을 맞춘다.
  cell: { flex: 1, height: CALENDAR_DAY_HEIGHT },
  rangeBand: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 0,
  },
  bandStart: { borderTopLeftRadius: radius.xxl, borderBottomLeftRadius: radius.xxl },
  bandEnd: { borderTopRightRadius: radius.xxl, borderBottomRightRadius: radius.xxl },
  disabled: { opacity: 0.4 },
  outlined: { borderWidth: 1, borderColor: palette.primary, borderStyle: 'solid', borderRadius: radius.xxl },
  view: {
    backgroundColor: palette.primary,
  },
})
