import { Box, Skeleton, Typography, type BoxProps } from '@mui/material'
import { useCountAnimation } from '~shared/hooks/animation/useCountdownAnimation'
import { useTrip } from '../useTrip'



function getDaysDiff(targetDate: Date): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(targetDate)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function getDateDiff(targetDate: Date): { years: number; months: number; days: number; totalDays: number } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(targetDate)
  target.setHours(0, 0, 0, 0)

  const totalDays = Math.abs(Math.ceil((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24)))

  let years = today.getFullYear() - target.getFullYear()
  let months = today.getMonth() - target.getMonth()
  let days = today.getDate() - target.getDate()

  if (days < 0) {
    months--
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0)
    days += prevMonth.getDate()
  }

  if (months < 0) {
    years--
    months += 12
  }

  return { years, months, days, totalDays }
}

interface Props {
  tripId: string;
}

export function TripDDay({ tripId, ...props }: Props & BoxProps) {
  const { data: { startDate, endDate } } = useTrip(tripId)
  const start = new Date(startDate)
  const end = new Date(endDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const daysUntilStart = getDaysDiff(start)
  const daysUntilEnd = getDaysDiff(end)

  // 여행 전
  if (daysUntilStart > 0) {
    return <BeforeTripDDay days={daysUntilStart} animationEnabled {...props} />
  }

  // 여행 중
  if (daysUntilStart <= 0 && daysUntilEnd >= 0) {
    return <DuringTripDDay day={Math.abs(daysUntilStart) + 1} animationEnabled {...props} />
  }

  // 여행 후
  const dateDiff = getDateDiff(end)
  return <AfterTripDDay dateDiff={dateDiff} animationEnabled {...props} />
}
TripDDay.Skeleton = (props: BoxProps) => {
  return (
    <DDayBox {...props}>
      <Skeleton variant='text' />
    </DDayBox>
  )
}



function DDayBox(props: BoxProps) {
  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)',
        borderRadius: 4,
        px: 2.5,
        py: 2,
      }}
      {...props}
    />
  )
}

interface BeforeTripDDayProps extends BoxProps {
  days: number
  animationEnabled: boolean
}

function BeforeTripDDay({ days, animationEnabled, ...props }: BeforeTripDDayProps) {
  const displayDays = useCountAnimation(days, { enabled: animationEnabled })

  return (
    <DDayBox {...props}>
      <Typography variant="body2" color="text.secondary" fontWeight={500}>
        두근두근 여행이{' '}
        <Typography
          component="span"
          variant="h6"
          color="primary.main"
          fontWeight={700}
          sx={{ mx: 0.5 }}
        >
          {displayDays}일
        </Typography>
        {' '}남았어요
      </Typography>
    </DDayBox>
  )
}

interface DuringTripDDayProps extends BoxProps {
  day: number
  animationEnabled: boolean
}

function DuringTripDDay({ day, animationEnabled, ...props }: DuringTripDDayProps) {
  const displayDay = useCountAnimation(day, { enabled: animationEnabled })

  return (
    <DDayBox {...props}>
      <Typography variant="body2" color="text.secondary" fontWeight={500}>
        여행{' '}
        <Typography
          component="span"
          variant="h6"
          color="success.main"
          fontWeight={700}
          sx={{ mx: 0.5 }}
        >
          {displayDay}일차
        </Typography>
        {' '}즐기는 중!
      </Typography>
    </DDayBox>
  )
}

interface AfterTripDDayProps extends BoxProps {
  dateDiff: { years: number; months: number; days: number; totalDays: number }
  animationEnabled: boolean
}

function totalDaysToYMD(totalDays: number): { years: number; months: number; days: number } {
  // 대략적인 변환: 1년 = 365일, 1개월 = 30일
  const years = Math.floor(totalDays / 365)
  const remainingAfterYears = totalDays % 365
  const months = Math.floor(remainingAfterYears / 30)
  const days = remainingAfterYears % 30
  return { years, months, days }
}

function AfterTripDDay({ dateDiff, animationEnabled, ...props }: AfterTripDDayProps) {
  const { years, months, days, totalDays } = dateDiff

  // totalDays를 기준으로 애니메이션하고, 각 프레임에서 년/월/일로 변환
  const animatedTotalDays = useCountAnimation(totalDays, {
    enabled: animationEnabled,
    duration: 2500
  })
  const animated = totalDaysToYMD(animatedTotalDays)

  const isOnlyDays = years === 0 && months === 0

  // 목표값 기준으로 자릿수 계산
  const yearsDigits = String(years).length
  const totalDaysDigits = String(totalDays).length

  // tabular-nums: 모든 숫자가 동일한 너비로 렌더링됨
  const numStyle = { fontVariantNumeric: 'tabular-nums' }


  return (
    <DDayBox {...props}>
      <Typography variant="body2" color="text.secondary" >
        {years > 0 && (
          <Typography key="years" component="span" variant="subtitle1" color="primary.main" fontWeight={700} sx={numStyle}>
            {String(animated.years).padStart(yearsDigits, '\u2007')}{/* \u2007 = figure space (숫자 너비 공백) */}년{' '}
          </Typography>
        )}
        {months > 0 && (
          <Typography key="months" component="span" variant="subtitle1" color="primary.main" fontWeight={700} sx={numStyle}>
            {String(animated.months).padStart(String(months).length, '\u2007')}개월{' '}
          </Typography>
        )}
        {days > 0 && (
          <Typography key="days" component="span" variant="subtitle1" color="primary.main" fontWeight={700} sx={numStyle}>
            {String(animated.days).padStart(String(days).length, '\u2007')}일
          </Typography>
        )}
        {!isOnlyDays && (
          <Typography component="span" variant="body2" color="text.disabled" sx={{ ml: 0.5, ...numStyle }}>
            ({String(animatedTotalDays).padStart(totalDaysDigits, '\u2007')}일)
          </Typography>
        )}

        {' '}지난 여행이에요
      </Typography>
    </DDayBox>
  )
}
