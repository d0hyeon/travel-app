/** 시작일과 종료일이 모두 정해진 기간. */
export type DateRange = [Date, Date]

/**
 * 고르는 중인 날짜. 시작일만 찍힌 상태, 종료일만 남은 상태를 모두 표현한다.
 * 확정 전에만 쓴다. 밖으로 나가는 값에는 빈 칸이 없다.
 */
export type DateSelection = [Date | null, Date | null]

/**
 * date     — 하루만 고른다
 * dateTime — 하루를 고른 뒤 시각까지 고른다
 * range    — 시작일과 종료일을 고른다
 */
export type DatePickerType = 'date' | 'dateTime' | 'range'

/** dateTime 이 거치는 단계. 나머지 타입은 date 에 머문다. */
export type DatePickerStep = 'date' | 'time'

export const DEFAULT_MINUTE_STEP = 5

/** 시각 휠이 주고받는 값. */
export type TimeOfDay = { hours: number; minutes: number }
