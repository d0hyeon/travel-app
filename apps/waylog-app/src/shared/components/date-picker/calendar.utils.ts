import { addDays, endOfMonth, isBefore, isSameDay, startOfMonth, startOfWeek } from 'date-fns'
import type { DateSelection } from './datePicker.model'

/**
 * 한 달을 주 단위 격자로 편다.
 * 격자는 항상 7칸씩 채워지므로 앞뒤로 남는 자리는 인접한 달의 날짜가 메운다.
 * 그 날짜가 이번 달인지는 호출부가 isSameMonth 로 판단한다.
 */
export function buildMonthMatrix(cursor: Date): Date[][] {
  const firstCell = startOfWeek(startOfMonth(cursor))
  const lastDay = endOfMonth(cursor)

  const weeks: Date[][] = []
  for (let cell = firstCell; cell <= lastDay || weeks.length === 0; ) {
    const week = Array.from({ length: 7 }, (_, index) => addDays(cell, index))
    weeks.push(week)
    cell = addDays(cell, 7)
  }

  return weeks
}

/** 기간 안에 드는가. 양 끝도 기간에 속한다. */
export function isWithinRange(day: Date, range: DateSelection): boolean {
  const [start, end] = range
  if (start == null) return false

  // 종료일을 아직 안 찍었으면 기간이랄 게 없다. 시작일 하나만 칠해진다.
  if (end == null) return isSameDay(start, day)

  return !isBefore(day, start) && !isBefore(end, day)
}

/**
 * 날짜 하나를 눌렀을 때 기간 선택이 어떻게 바뀌는지 정한다.
 * 이미 찍힌 끝을 다시 누르면 그 끝이 풀리고,
 * 남은 끝을 넘어서 누르면 기간을 뒤집는 대신 그 끝이 눌린 쪽으로 옮겨간다.
 */
export function toggleRangeSelection(
  selection: DateSelection,
  day: Date,
): DateSelection {
  const [start, end] = selection

  // 이미 찍힌 끝을 다시 누르면 그 끝만 푼다. 나머지 끝은 남는다.
  if (start != null && isSameDay(start, day)) return [null, end]
  if (end != null && isSameDay(end, day)) return [start, null]

  // 시작일이 풀린 동안 종료일보다 뒤를 누르면 시작일을 채울 수 없다. 채우면 기간이 뒤집힌다.
  // 빈 시작일 대신 종료일을 눌린 쪽으로 옮긴다.
  if (start == null && end != null && isBefore(end, day)) return [start, day]

  // 시작일보다 앞을 누르면 기간을 뒤집는 대신 시작일을 그쪽으로 옮긴다.
  if (start == null || isBefore(day, start)) return [day, end]

  return [start, day]
}

/** 분 선택지. 60 을 넘지 않는 눈금만 낸다. */
export function buildMinuteOptions(step: number): number[] {
  return Array.from({ length: Math.ceil(60 / step) }, (_, index) => index * step)
}
