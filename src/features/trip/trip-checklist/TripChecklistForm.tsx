import { Chip, Stack, TextField, Typography, type StackProps } from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers";
import { formatDate } from "date-fns";
import { Controller, useForm } from "react-hook-form";
import { useIsMobile } from "~shared/hooks/useIsMobile";
import { useTripMembers } from "../trip-member/useTripMembers";
import { useTrip } from "../useTrip";

export interface TripChecklistFormValue {
  title: string;
  content?: string;
  startedAt?: string;
  endedAt?: string;
  memberId?: string;
}

interface Props extends Omit<StackProps<'form'>, 'defaultValues' | 'onSubmit'> {
  tripId: string;
  defaultValues?: TripChecklistFormValue;
  onSubmit?: (value: TripChecklistFormValue) => void;
}

export function TripChecklistForm({
  tripId,
  defaultValues,
  children,
  onSubmit,
  ...stackProps
}: Props) {
  const {
    formState: { errors },
    register,
    handleSubmit,
    control
  } = useForm<TripChecklistFormValue>({
    defaultValues
  });

  const { data: { endDate } } = useTrip(tripId);
  const { data: members } = useTripMembers(tripId);
  const isMobile = useIsMobile();

  return (
    <Stack
      component="form"
      onSubmit={handleSubmit(data => onSubmit?.(data))}
      gap={2}
      {...stackProps}
    >
      <TextField label="제목" error={!!errors.title} {...register('title', { required: true, minLength: 3 })} />
      <TextField label="내용" {...register('content', { required: false })} multiline minRows={2} />
      <Stack direction="row" alignItems="center" gap={1}>
        <Controller
          control={control}
          name="startedAt"
          render={({ field: { value, onChange, ...field } }) => (
            // @ts-ignore
            <DateTimePicker
              label="시작"
              value={value ? new Date(value) : undefined}
              onChange={value => onChange(formatDate(value as Date, 'yyyy-MM-dd HH:mm'))}
              sx={isMobile ? {
                '.MuiPickersSectionList-root': { paddingY: 1.5 },
                '.MuiFormLabel-root': { lineHeight: 1 }
              } : {}}
              ampm={false}
              disableIgnoringDatePartForTimeValidation={false}
              {...field}
            />
          )}
        />
        <Typography variant="caption">
          ~
        </Typography>
        <Controller
          control={control}
          name="endedAt"
          render={({ field: { value, onChange, ...field } }) => (
            <DateTimePicker
              label="종료"
              value={value ? new Date(value) : undefined}
              onChange={value => onChange(formatDate(value as Date, 'yyyy-MM-dd HH:mm'))}
              sx={isMobile ? {
                '.MuiPickersSectionList-root': { paddingY: 1.5 },
                '.MuiFormLabel-root': { lineHeight: 1 }
              } : {}}
              maxDate={new Date(endDate)}
              ampm={false}
              disableFuture={false}
              views={['month', 'day', 'hours']}
              disableIgnoringDatePartForTimeValidation={false}
              {...field}
            />
          )}
        />
      </Stack>
      <Controller
        control={control}
        name="memberId"
        render={({ field: { value, onChange } }) => (
          <Stack gap={1} marginTop={1} paddingX={0.5}>
            <Typography variant="body2" color="textSecondary">담당자</Typography>
            <Stack direction="row" gap={0.5} paddingX={0.5}>
              {members.map(x => (
                <Chip
                  key={x.id}
                  size="small"
                  label={`${x.name}`}
                  variant={value === x.id ? 'filled' : 'outlined'}
                  color="primary"
                  onClick={() => onChange(x.id)}
                  sx={{ fontSize: 12 }}
                />
              ))}
            </Stack>
          </Stack>
        )}
      />

      {children}
    </Stack>
  )
}