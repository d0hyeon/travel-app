import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
  useTheme,
  type BoxProps,
  type ButtonProps
} from "@mui/material"
import { DatePicker } from '@mui/x-date-pickers'
import { Suspense, useState, type ReactNode } from "react"
import { Controller, FormProvider, useFieldArray, useForm, useFormContext, useWatch } from "react-hook-form"
import { useTripMembers } from '~app/trip/trip-member/useTripMembers'
import { useIsMobile } from '~shared/hooks/useIsMobile'
import { formatDateISO } from "../../../shared/utils/formats"
import { useTripPlaces } from '../trip-place/useTripPlaces'
import { useTrip } from '../useTrip'
import { getCurrencyByDestination } from '~app/expense/currency'
import type { Place } from '~app/place/place.types'

export interface PaymentField {
  memberId: string
  amount: number;
}

export interface ExpenseFormValues {
  description: string
  date: string
  currency: string
  payments: PaymentField[];
  placeId?: string;
  splitAmong: string[];
}

interface InternalExpenseFormValues extends ExpenseFormValues {
  totalAmount: number;
}

interface Props extends Omit<BoxProps<'form'>, 'defaultValues' | "onSubmit" | "action"> {
  tripId: string;
  defaultValues?: Partial<ExpenseFormValues>;
  onSubmit: (data: ExpenseFormValues) => void
  action?: ReactNode;
}
export function ExpenseForm(props: Props) {
  return (
    <Suspense fallback={<ExpenseForm.Pending {...props} />}>
      <ExpenseForm.Resolved {...props} />
    </Suspense>
  )
}
ExpenseForm.Resolved = ({
  tripId,
  defaultValues,
  action = <ExpenseForm.SubmitButton />,
  onSubmit,
  ...props
}: Props) => {
  const { data: trip } = useTrip(tripId);
  const { data: members } = useTripMembers(tripId);
  const { data: places } = useTripPlaces(tripId);

  // 해외 여행일 경우 화폐 정보
  const isOverseas = trip.isOverseas;
  const destinationCurrency = getCurrencyByDestination(trip.destination);

  const methods = useForm<InternalExpenseFormValues>({
    mode: 'onChange',
    defaultValues: {
      ...defaultValues,
      currency: defaultValues?.currency ?? 'KRW',
      payments: defaultValues?.payments ?? members.map(({ id }) => ({ amount: 0, memberId: id })),
      splitAmong: defaultValues?.splitAmong ?? members.map(m => m.id),
      totalAmount: defaultValues?.payments?.reduce((acc, payment) => acc + payment.amount, 0) ?? 0
    },
  })
  const { control, handleSubmit, setValue } = methods;

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'payments',
  })

  const payments = useWatch({ control, name: 'payments' })
  const selectedCurrency = useWatch({ control, name: 'currency' });
  const currencyUnit = selectedCurrency === 'KRW' ? '원' : destinationCurrency.name;

  const selectAllMembers = () => {
    setValue('splitAmong', members.map(m => m.id))
  }

  const totalAmount = useWatch({ control, name: 'totalAmount' });

  const handleFormSubmit = handleSubmit((data) => {
    const payments = data.payments
      .filter(p => p.memberId && p.amount > 0)
      .map(p => ({ memberId: p.memberId, amount: p.amount }))

    onSubmit({ ...data, payments })
  })

  const toggleCurrency = () => {
    if (!isOverseas) return
    const newCurrency = selectedCurrency === 'KRW' ? destinationCurrency.code : 'KRW'
    setValue('currency', newCurrency)
  }

  const [visibleSplit, setVisibleSplit] = useState(totalAmount > 0);
  const isMobile = useIsMobile();
  const theme = useTheme();

  return (
    <FormProvider {...methods}>
      <Box component="form" onSubmit={handleFormSubmit} {...props}>
        <Stack spacing={2}>
          <Box>
            <Controller
              control={control}
              name="totalAmount"
              render={({ field: { value, onChange, ...props } }) => (
                <Stack gap={0.5}>
                  <Typography variant="subtitle2" fontSize="13px" color="textSecondary">
                    <Box display="inline" color={theme.palette.primary.main}>*</Box>
                    총 금액
                  </Typography>
                  <TextField
                    variant="standard"
                    value={value === 0 ? '' : value.toLocaleString()}
                    onChange={({ target: { value } }) => {
                      const price = value === '' ? 0 : Number(value.replace(/[^0-9]/g, ''));
                      const splitedPrices = Math.ceil(price / payments.length);

                      onChange(price);
                      payments.forEach((_, i) => setValue(`payments.${i}.amount`, splitedPrices))
                    }}
                    onBlur={(event) => {
                      props.onBlur();
                      if (event.target.value !== '') {
                        setVisibleSplit(true);
                      }
                    }}
                    size="small"
                    fullWidth
                    placeholder="금액"
                    slotProps={{
                      inputLabel: {
                        sx: {
                          '&::before': {
                            content: '"*"',
                            color: theme.palette.primary.main
                          }
                        }
                      },
                      input: {
                        endAdornment: (
                          <InputAdornment
                            position="end"
                            onClick={toggleCurrency}
                            sx={isOverseas ? {
                              cursor: 'pointer',
                              userSelect: 'none',
                              color: 'primary.main',
                              fontWeight: 'medium',
                              '&:hover': { opacity: 0.7 },
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.25,
                              paddingBottom: 0.5,
                            } : undefined}
                          >
                            {currencyUnit}
                            {isOverseas && <SwapHorizIcon sx={{ fontSize: 16 }} />}
                          </InputAdornment>
                        )
                      }
                    }}
                  />
                </Stack>
              )}
            />

            <Accordion expanded={visibleSplit} sx={{ boxShadow: 'none', margin: '0 !important', '&::before': { display: 'none' } }}>
              <AccordionSummary sx={theme => ({ height: 0, overflow: 'hidden', transition: 'height 300ms', fontSize: 12, padding: 0, paddingLeft: 0.5, boxShadow: 'none', minHeight: 'auto !important', color: theme.palette.text.secondary, '&.Mui-expanded': { color: theme.palette.primary.main } })} slotProps={{ content: { sx: { margin: '0 !important' } } }}>
              </AccordionSummary>
              <AccordionDetails sx={{ padding: 0, paddingX: 1, marginTop: 1 }}>
                <Stack spacing={1}>
                  {fields.map((field, index) => (
                    <Stack key={field.id} direction="row" spacing={1} alignItems="center">
                      <Controller
                        name={`payments.${index}.memberId`}
                        control={control}
                        render={({ field }) => (
                          <FormControl size="small" sx={{ minWidth: 120 }}>
                            <Select variant="standard" {...field}>
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
                        render={({ field: { value, onChange, ...field } }) => (
                          <TextField
                            {...field}
                            variant="standard"
                            value={value.toLocaleString()}
                            onChange={({ target: { value } }) => {
                              const price = value === '' ? 0 : Number(value.replace(/[^0-9]/g, ''));
                              const restPrice = totalAmount - price;
                              const splitedPrice = restPrice / (payments.length - 1);

                              onChange(Math.min(price, totalAmount));
                              payments.forEach((_, i) => {
                                if (i === index) return;
                                setValue(`payments.${i}.amount`, Math.max(0, splitedPrice))
                              })
                            }}
                            size="small"
                            placeholder="금액"
                            sx={{ flex: 1 }}
                          />
                        )}
                      />
                      <IconButton
                        size="small"
                        onClick={() => {
                          remove(index);
                          const splitedPrice = Math.ceil(totalAmount / (payments.length - 1))
                          payments.forEach((_, i) => {
                            if (i === index) return;
                            setValue(`payments.${i}.amount`, Math.max(0, splitedPrice))
                          })
                        }}
                        disabled={fields.length === 1}
                        sx={{ opacity: fields.length === 1 ? 0.3 : 1 }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  ))}
                </Stack>
                <Stack
                  direction="row"
                  justifyContent="end"
                  alignItems="center"
                  marginTop={0.5}
                >
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    disabled={members.length === payments.length}
                    onClick={() => append({ memberId: members[0]?.id ?? '', amount: 0 })}
                  >
                    추가
                  </Button>
                </Stack>

              </AccordionDetails>
            </Accordion>

          </Box>

          {/* 설명 */}
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Stack gap={0.5}>
                <Typography variant="subtitle2" fontSize="13px" color="textSecondary">
                  내용
                </Typography>
                <TextField variant="standard" {...field} placeholder="점심 식사" fullWidth size="small" />
              </Stack>
            )}
          />
          {/* 날짜 */}
          <Controller
            name="date"
            control={control}
            render={({ field: { value, onChange, ...field } }) => (
              <Stack gap={0.5}>
                <Typography variant="subtitle2" fontSize="13px" color="textSecondary">
                  날짜
                </Typography>
                <DatePicker
                  {...field}
                  value={value ? new Date(value) : undefined}
                  onChange={(value) => onChange(formatDateISO(value as unknown as string))}
                  slotProps={{
                    textField: {
                      size: 'small',
                      variant: 'standard',
                      sx: {
                        '.MuiFormLabel-root': { fontSize: 13, },
                        '.MuiPickersInputBase-root': { paddingBottom: 0.5 }
                      }
                    }
                  }}
                />
              </Stack>
            )}
          />

          {/* 장소 연결 */}
          <Controller
            name="placeId"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Stack gap={0.5}>
                <Typography variant="subtitle2" fontSize="13px" color="textSecondary">
                  장소
                </Typography>
                <Autocomplete
                  size="small"
                  options={places}
                  getOptionLabel={(option) => option.name}
                  value={places.find((p) => p.id === value) ?? null}
                  onChange={(_, newValue) => onChange(newValue?.id ?? '')}
                  renderInput={(params) => (
                    <TextField {...params} variant="standard" placeholder="장소 검색..." />
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
                  slotProps={{
                    popper: {
                      placement: isMobile ? 'top' : 'auto'
                    }
                  }}
                />
              </Stack>
            )}
          />


          {/* 정산 대상자 */}
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" marginBottom={isMobile ? 0.5 : 0} marginTop={1.5}>
              <Typography variant="body2" color="textSecondary">누구와 나눌까요?</Typography>
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
                        sx={{ mb: 0.5, fontSize: 11 }}
                        size="small"
                        {...props}
                      />
                    )
                  })}
                </Stack>
              )}
            />
          </Box>

          {action}
        </Stack>
      </Box>
    </FormProvider>
  )
}

ExpenseForm.Pending = ({
  defaultValues,
  action = <ExpenseForm.SubmitButton />,
  ...props
}: Omit<Props, 'onSubmit'>) => {
  const methods = useForm<ExpenseFormValues>({
    mode: 'onChange',
    defaultValues: defaultValues,
  })
  const { control, register } = methods;

  const { fields } = useFieldArray({
    control,
    name: 'payments',
  })

  const isMobile = useIsMobile();

  return (
    <FormProvider {...methods}>
      <Box component="form" {...props}>
        <Stack spacing={2.5}>
          {/* 지불한 사람 */}
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" marginBottom={isMobile ? 0.5 : 0}>
              <Typography variant="subtitle2">누가 얼마 냈나요?</Typography>
              <Button size="small" startIcon={<AddIcon />}>추가</Button>
            </Stack>

            <Stack spacing={1}>
              {fields.map((field, index) => (
                <Stack key={field.id} direction="row" spacing={1} alignItems="center">
                  <Controller
                    name={`payments.${index}.memberId`}
                    control={control}
                    render={({ field }) => (
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select readOnly {...field}>

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
                          disabled
                        />
                      )
                    }}
                  />
                  <IconButton size="small" disabled sx={{ opacity: 0.3 }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
            </Stack>

          </Box>

          {/* 정산 대상자 */}
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" marginBottom={isMobile ? 0.5 : 0} >
              <Typography variant="subtitle2" color="textSecondary">누구와 나눌까요?</Typography>
              <Button size="small" disabled>전체 선택</Button>
            </Stack>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              <Chip component="button" sx={{ mb: 0.5 }} label="..." />
              <Chip component="button" sx={{ mb: 0.5 }} label="..." />
            </Stack>

            <Typography variant="caption" color="text.secondary" mt={1} display="block">
              1인당 ...원
            </Typography>
          </Box>
          {/* 설명 */}
          <TextField label="내용" placeholder="점심 식사" fullWidth size="small" disabled {...register('description')} />
          {/* 날짜 */}
          <Controller
            name="date"
            control={control}
            render={({ field: { value, onChange, ...field } }) => (
              <DatePicker
                {...field}
                value={value ? new Date(value) : undefined}
                onChange={(value) => onChange(formatDateISO(value as unknown as string))}
                label="날짜"
                slotProps={{
                  textField: { size: 'small' }
                }}
                disabled
              />
            )}
          />

          {/* 장소 연결 */}
          <Controller
            name="placeId"
            control={control}
            render={({ field }) => (
              <Autocomplete
                {...field}
                size="small"
                options={[] satisfies Place[]}
                renderInput={(params) => (
                  <TextField {...params} label="장소" placeholder="장소 검색..." />
                )}
                disabled
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
  const { formState: { isValid } } = useFormContext<ExpenseFormValues>();
  return (
    <Button
      type="submit"
      variant="contained"
      fullWidth
      disabled={!isValid}
      {...props}
    >
      {props.children ?? '저장'}
    </Button>
  )
}