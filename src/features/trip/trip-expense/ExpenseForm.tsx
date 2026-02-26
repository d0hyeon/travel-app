import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  type BoxProps,
  type ButtonProps
} from "@mui/material"
import { DatePicker } from '@mui/x-date-pickers'
import { type ReactNode } from "react"
import { Controller, FormProvider, useFieldArray, useForm, useFormContext, useWatch } from "react-hook-form"
import { useTripMembers } from '~features/trip-member/useTripMembers'
import { useIsMobile } from '~shared/hooks/useIsMobile'
import { formatDateISO } from "../../../shared/utils/formats"
import { useTripPlaces } from '../trip-place/useTripPlaces'

export interface PaymentField {
  memberId: string
  amount: number;
}

export interface ExpenseFormValues {
  description: string
  date: string
  payments: PaymentField[];
  placeId?: string;
  splitAmong: string[];
}

interface Props extends Omit<BoxProps<'form'>, 'defaultValues' | "onSubmit" | "action"> {
  tripId: string;
  defaultValues?: Partial<ExpenseFormValues>;
  onSubmit: (data: ExpenseFormValues) => void
  action?: ReactNode;
}

export function ExpenseForm({
  tripId,
  defaultValues,
  action = <ExpenseForm.SubmitButton />,
  onSubmit,
  ...props
}: Props) {
  const { data: members } = useTripMembers(tripId);
  const { data: places } = useTripPlaces(tripId);

  const methods = useForm<ExpenseFormValues>({
    mode: 'onChange',
    defaultValues: {
      ...defaultValues,
      payments: defaultValues?.payments ?? [{ memberId: members[0]?.id ?? '', amount: 0 }],
      splitAmong: defaultValues?.splitAmong ?? members.map(m => m.id)
    },
  })
  const { control, handleSubmit, setValue } = methods;

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'payments',
  })

  const payments = useWatch({ control, name: 'payments' })
  const splitAmong = useWatch({ control, name: 'splitAmong' });

  const selectAllMembers = () => {
    setValue('splitAmong', members.map(m => m.id))
  }

  const totalAmount = payments?.reduce((sum, p) => {
    return sum + (p.amount ?? 0)
  }, 0) ?? 0

  const handleFormSubmit = handleSubmit((data) => {
    const payments = data.payments
      .filter(p => p.memberId && p.amount > 0)
      .map(p => ({ memberId: p.memberId, amount: p.amount }))

    onSubmit({ ...data, payments })
  })

  const isMobile = useIsMobile();

  return (
    <FormProvider {...methods}>
      <Box component="form" onSubmit={handleFormSubmit} {...props}>


        <Stack spacing={2.5}>

          {/* 지불한 사람 */}
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" marginBottom={isMobile ? 0.5 : 0}>
              <Typography variant="subtitle2">누가 얼마 냈나요?</Typography>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() => append({ memberId: members[0]?.id ?? '', amount: 0 })}
              >
                추가
              </Button>
            </Stack>

            <Stack spacing={1}>
              {fields.map((field, index) => (
                <Stack key={field.id} direction="row" spacing={1} alignItems="center">
                  <Controller
                    name={`payments.${index}.memberId`}
                    control={control}
                    render={({ field }) => (
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select {...field}>
                          {members.map(m => (
                            <MenuItem key={m.id} value={m.id}>
                              {m.emoji} {m.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                  <Controller
                    name={`payments.${index}.amount`}
                    control={control}
                    render={({ field: { value, onChange, ...field } }) => {
                      return (
                        <TextField
                          {...field}
                          value={value.toLocaleString()}
                          onChange={({ target: { value } }) => {
                            onChange(value === '' ? 0 : Number(value.replace(/[^0-9]/g, '')))
                          }}
                          size="small"

                          placeholder="금액"
                          slotProps={{
                            input: {
                              endAdornment: <InputAdornment position="end">원</InputAdornment>
                            }
                          }}
                          sx={{ flex: 1 }}
                        />
                      )
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    sx={{ opacity: fields.length === 1 ? 0.3 : 1 }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
            </Stack>

            {totalAmount > 0 && (
              <Typography variant="body2" color="primary" mt={1.5}>
                총 {totalAmount.toLocaleString()}원
              </Typography>
            )}
          </Box>

          {/* 정산 대상자 */}
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" marginBottom={isMobile ? 0.5 : 0} >
              <Typography variant="subtitle2">누구와 나눌까요?</Typography>
              <Button size="small" onClick={selectAllMembers}>전체 선택</Button>
            </Stack>
            <Controller
              control={control}
              name="splitAmong"
              rules={{
                validate: (value) => value.length === 0
                  ? '대상자를 선택해주세요'
                  : true
              }}
              render={({ field: { value, onChange: setValue, ...props } }) => (
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                  {members.map((member) => {
                    const isSelected = value.includes(member.id);

                    return (
                      <Chip
                        key={member.id}
                        label={`${member.emoji} ${member.name}`}
                        variant={isSelected ? 'filled' : 'outlined'}
                        color={isSelected ? 'primary' : 'default'}
                        onClick={() => {
                          setValue(isSelected
                            ? value.filter(id => id !== member.id)
                            : [...value, member.id]
                          )
                        }}
                        component="button"
                        sx={{ mb: 0.5 }}
                        {...props}
                      />
                    )
                  })}
                </Stack>
              )}
            />

            {splitAmong.length > 0 && totalAmount > 0 && (
              <Typography variant="caption" color="text.secondary" mt={1} display="block">
                1인당 {Math.round(totalAmount / splitAmong.length).toLocaleString()}원
              </Typography>
            )}
          </Box>
          {/* 설명 (선택) */}
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="내용 (선택)" placeholder="점심 식사" fullWidth size="small" />
            )}
          />
          {/* 날짜 (선택) */}
          <Controller
            name="date"
            control={control}
            render={({ field: { value, onChange, ...field } }) => (
              <DatePicker
                {...field}
                value={value ? new Date(value) : undefined}
                onChange={(value) => onChange(formatDateISO(value as unknown as string))}
                label="날짜 (선택)"
                slotProps={{
                  textField: { size: 'small' }
                }}
              />
            )}
          />

          {/* 장소 연결 */}
          <Controller
            name="placeId"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Autocomplete
                size="small"
                options={places}
                getOptionLabel={(option) => option.name}
                value={places.find((p) => p.id === value) ?? null}
                onChange={(_, newValue) => onChange(newValue?.id ?? '')}
                renderInput={(params) => (
                  <TextField {...params} label="장소 (선택)" placeholder="장소 검색..." />
                )}
                filterOptions={(options, { inputValue }) => {
                  const query = inputValue.toLowerCase()
                  return options.filter(
                    (option) =>
                      option.name.toLowerCase().includes(query) ||
                      option.address?.toLowerCase().includes(query)
                  )
                }}
                noOptionsText="검색 결과 없음"
                clearText="초기화"
              />
            )}
          />



          {action}
        </Stack>
      </Box>
    </FormProvider>
  )
}

ExpenseForm.SubmitButton = (props: Omit<ButtonProps, 'type'>) => {
  const { watch, formState: { isValid } } = useFormContext<ExpenseFormValues>();
  const payments = watch('payments');

  const totalAmount = payments.reduce((sum, p) => {
    return sum + (p.amount ?? 0)
  }, 0)

  return (
    <Button
      type="submit"
      variant="contained"
      fullWidth
      disabled={totalAmount === 0 || !isValid}
      {...props}
    >
      {props.children ?? '저장'}
    </Button>
  )
}