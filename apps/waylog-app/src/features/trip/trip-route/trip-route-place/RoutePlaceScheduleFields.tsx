import { MaterialIcons } from '@expo/vector-icons'
import { getRoutePlaceTimeMinutes, isValidRoutePlaceTime } from '@waylog/domains/modules/route'
import { formatDuration } from '@waylog/utility'
import { Controller, useWatch, type Control } from 'react-hook-form'
import { Keyboard, Pressable, StyleSheet } from 'react-native'
import { useDatePickerBottomSheet } from '~shared/components/date-picker'
import { Stack, TextField, Typography } from '~shared/components/design-system'
import { palette, radius } from '~shared/config/tokens'
import type { RoutePlaceFormValues } from './routePlaceForm.types'

const INVALID_TIME_RANGE_MESSAGE = '종료 시간은 시작 시간보다 뒤여야 해요'

interface Props {
  control: Control<RoutePlaceFormValues>
}

export function RoutePlaceScheduleFields({ control }: Props) {
  const { openTime } = useDatePickerBottomSheet()
  const [startTime, endTime] = useWatch({ control, name: ['startTime', 'endTime'] })

  const stayMinutes = getRoutePlaceTimeMinutes({ startTime, endTime })
  const isTimeValid = isValidRoutePlaceTime({ startTime, endTime })

  return (
    <Stack gap={2}>
      <Stack gap={1}>
        <Stack direction="row" gap={0.5}>
          <Typography variant="caption" color="text.secondary">
            시간
          </Typography>
          {stayMinutes != null && isTimeValid && (
            <Typography variant="caption" color="primary">
              · {formatDuration(stayMinutes * 60)}
            </Typography>
          )}
        </Stack>
        <Stack direction="row" alignItems="center" gap={1}>
          <Controller
            control={control}
            name="startTime"
            rules={{ deps: ['endTime'] }}
            render={({ field }) => (
              <TimeButton
                placeholder="시작"
                value={field.value}
                invalid={!isTimeValid}
                onPress={async () => {
                  Keyboard.dismiss()
                  const picked = await openTime({ defaultValue: field.value })
                  if (picked != null) field.onChange(picked)
                }}
                onClear={() => field.onChange(null)}
              />
            )}
          />
          <Typography color="text.secondary">~</Typography>
          <Controller
            control={control}
            name="endTime"
            rules={{
              validate: (value, { startTime: start }) =>
                isValidRoutePlaceTime({ startTime: start, endTime: value }) || INVALID_TIME_RANGE_MESSAGE,
            }}
            render={({ field }) => (
              <TimeButton
                placeholder="종료"
                value={field.value}
                invalid={!isTimeValid}
                onPress={async () => {
                  Keyboard.dismiss()
                  const picked = await openTime({ defaultValue: field.value ?? startTime })
                  if (picked != null) field.onChange(picked)
                }}
                onClear={() => field.onChange(null)}
              />
            )}
          />
        </Stack>
        {!isTimeValid && (
          <Typography variant="caption" color="error">
            {INVALID_TIME_RANGE_MESSAGE}
          </Typography>
        )}
      </Stack>

      <Stack gap={1}>
        <Typography variant="caption" color="text.secondary">
          경로 메모
        </Typography>
        <Controller
          control={control}
          name="routeMemo"
          render={({ field }) => (
            <TextField
              placeholder="경로 메모"
              fullWidth
              multiline
              minRows={5}
              value={field.value}
              onChangeText={field.onChange}
            />
          )}
        />
      </Stack>
    </Stack>
  )
}

interface TimeButtonProps {
  placeholder: string
  value: string | null
  invalid: boolean
  onPress: () => void
  onClear: () => void
}

function TimeButton({ placeholder, value, invalid, onPress, onClear }: TimeButtonProps) {
  return (
    <Pressable style={[styles.timeButton, invalid && styles.timeButtonInvalid]} onPress={onPress}>
      <Typography
        style={styles.timeText}
        color={value == null ? 'text.disabled' : 'text.primary'}
      >
        {value ?? placeholder}
      </Typography>
      {value != null && (
        <Pressable hitSlop={8} onPress={onClear} style={styles.clearButton}>
          <MaterialIcons name="close" size={16} color={palette.textSecondary} />
        </Pressable>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  timeButton: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.divider,
    borderRadius: radius.lg,
  },
  timeButtonInvalid: { borderColor: palette.error },
  timeText: { fontWeight: '700' },
  clearButton: { position: 'absolute', right: 10 },
})
