/** 시작일과 종료일이 모두 정해진 기간. */
export type DateRange = [Date, Date]

/**
 * 고르는 중인 기간. 시작일만 찍힌 상태, 종료일만 남은 상태를 모두 표현한다.
 * 두 칸이 다 차야 DateRange 가 된다.
 */
export type DateRangeSelection = [Date | null, Date | null]

/**
 * single — 하루만 고른다
 * range  — 시작일과 종료일을 고른다
 * time   — 하루를 고른 뒤 시각까지 고른다
 */
export type DatePickerMode = 'single' | 'range' | 'time'

export const DEFAULT_MINUTE_STEP = 5

/** 시각 휠이 주고받는 값. */
export type TimeOfDay = { hours: number; minutes: number }
