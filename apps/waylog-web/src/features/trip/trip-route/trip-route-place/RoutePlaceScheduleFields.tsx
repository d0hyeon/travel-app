import { Stack, TextField, Typography } from '@mui/material'
import { DesktopTimePicker, renderDigitalClockTimeView } from '@mui/x-date-pickers'
import { getRoutePlaceTimeMinutes, isValidRoutePlaceTime } from '@waylog/domains/modules/route'
import { formatDuration } from '@waylog/utility'
import { format, isValid, parse } from 'date-fns'
import type { TouchEvent } from 'react'
import { Controller, useWatch, type Control } from 'react-hook-form'
import type { RoutePlaceFormValues } from './routePlaceForm.types'

const TIME_FORMAT = 'HH:mm'
const TIME_STEP_MINUTES = 30

function stopTouchPropagation(event: TouchEvent<HTMLElement>) {
  event.stopPropagation()
}
const INVALID_TIME_RANGE_MESSAGE = '종료 시간은 시작 시간보다 뒤여야 해요'

interface Props {
  control: Control<RoutePlaceFormValues>
}

export function RoutePlaceScheduleFields({ control }: Props) {
  const [startTime, endTime] = useWatch({ control, name: ['startTime', 'endTime'] })
  const stayMinutes = getRoutePlaceTimeMinutes({ startTime, endTime })
  const isTimeValid = isValidRoutePlaceTime({ startTime, endTime })

  return (
    <Stack spacing={2}>
      <Stack spacing={1}>
        <Stack direction="row" spacing={0.5}>
          <Typography variant="caption" color="text.secondary">시간</Typography>
          {stayMinutes != null && isTimeValid && (
            <Typography variant="caption" color="primary">· {formatDuration(stayMinutes * 60)}</Typography>
          )}
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Controller
            control={control}
            name="startTime"
            rules={{ deps: ['endTime'] }}
            render={({ field }) => <TimeField label="시작" error={!isTimeValid} {...field} />}
          />
          <Typography color="text.secondary">~</Typography>
          <Controller
            control={control}
            name="endTime"
            rules={{
              validate: (value, { startTime: start }) =>
                isValidRoutePlaceTime({ startTime: start, endTime: value }) || INVALID_TIME_RANGE_MESSAGE,
            }}
            render={({ field }) => <TimeField label="종료" error={!isTimeValid} {...field} />}
          />
        </Stack>
        {!isTimeValid && (
          <Typography variant="caption" color="error">{INVALID_TIME_RANGE_MESSAGE}</Typography>
        )}
      </Stack>

      <Controller
        control={control}
        name="routeMemo"
        render={({ field }) => (
          <TextField {...field} label="경로 메모" multiline minRows={3} fullWidth size="small" />
        )}
      />
    </Stack>
  )
}

interface TimeFieldProps {
  label: string
  value: string | null
  error: boolean
  onChange: (value: string | null) => void
}

function TimeField({ label, value, error, onChange }: TimeFieldProps) {
  return (
    <DesktopTimePicker
      label={label}
      ampm={false}
      closeOnSelect
      views={['hours']}
      viewRenderers={{ hours: renderDigitalClockTimeView }}
      timeSteps={{ minutes: TIME_STEP_MINUTES }}
      value={value == null ? null : parse(value, TIME_FORMAT, new Date())}
      onChange={(next) => {
        if (next == null) return onChange(null)
        if (isValid(next)) onChange(format(next, TIME_FORMAT))
      }}
      slotProps={{
        textField: { size: 'small', fullWidth: true, error },
        field: { clearable: true },
        actionBar: { actions: [] },
        popper: {
          onTouchStart: stopTouchPropagation,
          onTouchMove: stopTouchPropagation,
          onTouchEnd: stopTouchPropagation,
        },
      }}
      sx={{ flex: 1 }}
    />
  )
}
