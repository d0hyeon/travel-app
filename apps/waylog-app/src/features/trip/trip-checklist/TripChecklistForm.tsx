import { useTripMembers } from '@waylog/domains/trip-member'
import { forwardRef, useImperativeHandle } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Chip, Stack, TextField, Typography } from '../../../shared/components/mui'

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
    const { control, handleSubmit, watch, setValue } = useForm<TripChecklistFormValue>({
      defaultValues: { title: '', content: '', ...defaultValues },
    })

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

        <Stack direction="row" gap={1}>
          <Controller control={control} name="startedAt" render={({ field }) => (
            <TextField placeholder="시작일" fullWidth variant="outlined" value={field.value ?? ''} onChangeText={field.onChange} />
          )} />
          <Controller control={control} name="endedAt" render={({ field }) => (
            <TextField placeholder="종료일" fullWidth variant="outlined" value={field.value ?? ''} onChangeText={field.onChange} />
          )} />
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
                  onClick={() =>
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
