import { isSameDay, isSameMonth } from 'date-fns'
import { Pressable, StyleSheet, View } from 'react-native'
import { isWithinRange } from './calendar.utils'
import type { DateRangeSelection } from './datePicker.model'
import { Typography } from '../mui'
import { palette, radius } from '../../config/tokens'

interface CalendarDayProps {
  day: Date
  /** 이 칸이 속한 달. 다른 달 날짜는 자리만 지킨다. */
  month: Date
  selection: DateRangeSelection
  onPress: (day: Date) => void
}

// 기간 배경은 칸을 꽉 채워야 날짜끼리 이어져 보인다.
// 양 끝만 둥글려 알약 모양이 되게 한다.
export function CalendarDay({ day, month, selection, onPress }: CalendarDayProps) {
  const [start, end] = selection

  const isOutsideMonth = !isSameMonth(day, month)
  if (isOutsideMonth) return <View style={styles.cell} />

  const isStart = start != null && isSameDay(start, day)
  const isEnd = end != null && isSameDay(end, day)
  const isEdge = isStart || isEnd
  const isInRange = isWithinRange(day, selection)

  // 시작일만 찍힌 동안에는 그 하루가 양끝을 겸한다.
  const isSingle = isStart && end == null

  return (
    <Pressable style={styles.cell} onPress={() => onPress(day)}>
      <View
        style={[
          styles.rangeBand,
          isInRange && { backgroundColor: palette.primary },
          (isStart || isSingle) && styles.bandStart,
          (isEnd || isSingle) && styles.bandEnd,
        ]}
      >
        <Typography variant="body2" color={isInRange ? '#fff' : palette.text}>
          {day.getDate()}
        </Typography>
      </View>
    </Pressable>
  )
}

const CELL_HEIGHT = 40

const styles = StyleSheet.create({
  // 7칸이 폭을 고르게 나눠 가져야 요일이 세로로 줄을 맞춘다.
  cell: { flex: 1, height: CELL_HEIGHT },
  rangeBand: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 0,
  },
  bandStart: { borderTopLeftRadius: radius.xxl, borderBottomLeftRadius: radius.xxl },
  bandEnd: { borderTopRightRadius: radius.xxl, borderBottomRightRadius: radius.xxl },
})
