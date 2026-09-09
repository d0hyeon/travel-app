import { useTrip } from '@waylog/domains/modules/trip'
import { useTripMembers } from '@waylog/domains/modules/trip-member'
import { endOfDay, format as formatDate } from 'date-fns'
import { forwardRef, useImperativeHandle } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { DateField } from '../../../shared/components/date-picker'
import { Chip, Stack, TextField, Typography } from '~/shared/components/design-system'

// 웹과 저장 형식을 맞춘다.
const DATE_TIME_PATTERN = 'yyyy-MM-dd HH:mm'

export interface TripChecklistFormValue {
  title: string
  content?: string
  startedAt?: string
  endedAt?: string
  memberId?: string
}

export interface TripChecklistFormRef {
  submit: () => void
}

interface Props {
  tripId: string
  defaultValues?: TripChecklistFormValue
  onSubmit?: (value: TripChecklistFormValue) => void
}

// 웹은 form={id} 로 바깥 버튼과 잇지만 RN 에는 없다. ref.submit() 으로 대체한다.
export const TripChecklistForm = forwardRef<TripChecklistFormRef, Props>(
  function TripChecklistForm({ tripId, defaultValues, onSubmit }, ref) {
    const { data: members } = useTripMembers(tripId)
    const {
      data: { endDate },
    } = useTrip(tripId)
    const {
      control,
      handleSubmit,
      watch,
      setValue,
      formState: { errors },
    } = useForm<TripChecklistFormValue>({
      defaultValues: { title: '', content: '', ...defaultValues },
    })

    // 웹의 maxDate 를 승계한다. 앱 DateField 는 제약을 받지 않으므로 제출 시 검증한다.
    const lastMoment = endOfDay(new Date(endDate))
    const validateWithinTrip = (value?: string) =>
      !value || new Date(value) <= lastMoment || '여행 종료일 이후로는 지정할 수 없습니다'

    useImperativeHandle(
      ref,
      () => ({ submit: () => void handleSubmit((value) => onSubmit?.(value))() }),
      [handleSubmit, onSubmit],
    )

    const selectedMemberId = watch('memberId')

    return (
      <Stack gap={2}>
        <Controller
          control={control}
          name="title"
          rules={{ required: true }}
          render={({ field }) => (
            <TextField
              autoFocus
              placeholder="할 일"
              fullWidth
              variant="standard"
              value={field.value}
              onChangeText={field.onChange}
            />
          )}
        />

        <Stack gap={0.5}>
          <Stack direction="row" alignItems="center" gap={1}>
            <Stack sx={{ flex: 1 }}>
              <Controller
                control={control}
                name="startedAt"
                rules={{ validate: validateWithinTrip }}
                render={({ field }) => (
                  <DateField
                    type="dateTime"
                    placeholder="시작"
                    value={field.value ? new Date(field.value) : undefined}
                    onChange={(date) => field.onChange(formatDate(date, DATE_TIME_PATTERN))}
                  />
                )}
              />
            </Stack>
            <Typography variant="caption" color="text.secondary">
              ~
            </Typography>
            <Stack sx={{ flex: 1 }}>
              <Controller
                control={control}
                name="endedAt"
                rules={{ validate: validateWithinTrip }}
                render={({ field }) => (
                  <DateField
                    type="dateTime"
                    placeholder="종료"
                    value={field.value ? new Date(field.value) : undefined}
                    onChange={(date) => field.onChange(formatDate(date, DATE_TIME_PATTERN))}
                  />
                )}
              />
            </Stack>
          </Stack>
          {(errors.startedAt ?? errors.endedAt) != null && (
            <Typography variant="caption" color="error">
              {errors.startedAt?.message ?? errors.endedAt?.message}
            </Typography>
          )}
        </Stack>

        <Controller
          control={control}
          name="content"
          render={({ field }) => (
            <TextField
              placeholder="메모 (선택)"
              fullWidth
              multiline
              minRows={3}
              value={field.value ?? ''}
              onChangeText={field.onChange}
            />
          )}
        />

        {members.length > 0 && (
          <Stack gap={1}>
            <Typography variant="caption" color="text.secondary">
              담당자
            </Typography>
            <Stack direction="row" gap={0.5} sx={{ flexWrap: 'wrap' }}>
              {members.map((member) => (
                <Chip
                  key={member.id}
                  label={member.name}
                  size="small"
                  variant={selectedMemberId === member.id ? 'filled' : 'outlined'}
                  color={selectedMemberId === member.id ? 'primary' : 'default'}
                  onPress={() =>
                    setValue('memberId', selectedMemberId === member.id ? undefined : member.id)
                  }
                />
              ))}
            </Stack>
          </Stack>
        )}
      </Stack>
    )
  },
)
