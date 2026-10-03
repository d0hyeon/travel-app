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

/**
 * 고를 수 있는 날짜의 양 끝. 양 끝도 고를 수 있다.
 * 날짜는 하루 단위로 본다. 시각은 경계일에서만 시(hour) 단위로 자른다.
 */
export type DateBounds = {
  minDate?: Date
  maxDate?: Date
}

/**
 * 기본 시간 설정
 * 날짜를 고를 때 직전 값이 없으면 이 시각을 얹는다.
 * range 는 날짜 단위라 쓰지 않는다.
 */
export type DateTimeSetter = {
  defaultHours?: number
  defaultMinutes?: number
}

export const DEFAULT_MINUTE_STEP = 5

/** 시각 휠이 주고받는 값. */
export type TimeOfDay = { hours: number; minutes: number }

/** 어느 날 고를 수 있는 시와 분의 양 끝. 양 끝도 고를 수 있다. */
export type AllowedTimes = {
  minHours: number
  maxHours: number
  minMinutes: number
  maxMinutes: number
}
