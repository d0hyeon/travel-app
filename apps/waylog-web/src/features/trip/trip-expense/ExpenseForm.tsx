import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  TextField,
  Typography,
  useTheme,
  type BoxProps,
  type ButtonProps
} from "@mui/material"
import { DatePicker } from '@mui/x-date-pickers'
import { Suspense, type ReactNode } from "react"
import { Controller, FormProvider, useFieldArray, useForm, useFormContext, useWatch } from "react-hook-form"
import { useAuth } from '~features/auth/useAuth'
import { CurrencyCode as CurrencyCodeMap, getCurrenciesByDestinations, getCurrencyName, getUsedCurrencies, type CurrencyCode } from '@waylog/domains/expense'
import { useExpenses } from '~features/expense/useExpenses'
import { useTripMembers } from '~features/trip/trip-member/useTripMembers'
import { useTrip } from '~features/trip/useTrip'
import { PopMenu } from '~shared/components/PopMenu'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { SortCommand } from '~shared/utils/sorts'
import { assert } from '@waylog/domains/utils'
import { formatDisplayDate } from "../../../shared/utils/formats"
import { useTripPlaces } from '../trip-place/useTripPlaces'

export interface PaymentField {
  memberId: string
  amount: number;
}

export interface ExpenseFormValues {
  description: string
  date: string
  currency: CurrencyCode;
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
export function ExpenseForm(props: Props) {
  return (
    <Suspense fallback={<ExpenseForm.Pending {...props} />}>
      <ExpenseForm.Resolved {...props} />
    </Suspense>
  )
}
ExpenseForm.Resolved = Resolved;
function Resolved({
  tripId,
  defaultValues,
  action = <ExpenseForm.SubmitButton />,
  onSubmit,
  ...props
}: Props) {
  const { data: trip } = useTrip(tripId);
  const { data: members } = useTripMembers(tripId);
  const { data: places } = useTripPlaces(tripId);
  const { data: expenses } = useExpenses(tripId);

  // 여행 목적지 기반 화폐 목록 (KRW 항상 포함)
  const availableCurrencies = getCurrenciesByDestinations(trip.destinations);
  const availableCurrencyCodes = new Set(availableCurrencies.map(c => c.code));
  // 목적지에 없는 나머지 화폐 (직접 추가용)
  const otherCurrencies = (Object.values(CurrencyCodeMap) as CurrencyCode[])
    .filter(code => !availableCurrencyCodes.has(code));
  // 사용된 통화 목록 (KRW 제외)
  const usedCurrencies = getUsedCurrencies(expenses);

  const { data: { id: userId } } = useAuth();
  const writer = members.find(x => x.userId === userId);

  const methods = useForm<ExpenseFormValues>({
    mode: 'onChange',
    defaultValues: {
      ...defaultValues,
      currency: defaultValues?.currency ?? 'KRW',
      payments: defaultValues?.payments ?? [{ amount: 0, memberId: writer!.id }],
      splitAmong: defaultValues?.splitAmong ?? members.map(m => m.id),
    },
  })
  const { control, handleSubmit, register, setValue } = methods;
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'payments',
  })

  const payments = useWatch({ control, name: 'payments' })
  const selectedCurrency = useWatch({ control, name: 'currency' });
  const currencyUnit = getCurrencyName(selectedCurrency);

  const selectAllMembers = () => {
    setValue('splitAmong', members.map(m => m.id))
  }

  const totalAmount = payments.reduce((acc, item) => acc + item.amount, 0);

  const handleFormSubmit = handleSubmit((data) => {
    const payments = data.payments
      .filter(p => p.memberId && p.amount > 0)
      .map(p => ({ memberId: p.memberId, amount: p.amount }))

    onSubmit({ ...data, payments })
  })

  const handleCurrencySelect = (code: CurrencyCode) => {
    setValue('currency', code)
  }

  const isMobile = useIsMobile();

  return (
    <FormProvider {...methods}>
      <Box component="form" onSubmit={handleFormSubmit} {...props}>
        <Stack spacing={2}>
          <Stack gap={1}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={0.5}>
              <Typography variant="subtitle2">
                결제 금액
              </Typography>
              <Button
                size="small"
                disabled={members.length === payments.length}
                onClick={() => {
                  const paymentMIds = payments.map(p => p.memberId);
                  const nextMember = members.find(member => !paymentMIds.includes(member.id));
                  assert(!!nextMember)

                  append({ memberId: nextMember.id, amount: 0 })
                }}
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
                        <Select variant="standard" {...field}>
                          {members.map(m => (
                            <MenuItem key={m.id} value={m.id}>
                              {m.name}
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
                        value={value === 0 ? '' : value.toLocaleString()}
                        onChange={({ target: { value } }) => onChange(value !== '' ? Number(value.replace(/\D/, '')) : 0)}
                        size="small"
                        placeholder="0"
                        sx={{ flex: 1, textAlign: 'right' }}
                        slotProps={{
                          htmlInput: { sx: { textAlign: 'right' } },
                          input: {
                            endAdornment: (
                              <InputAdornment position='end' sx={{ paddingBottom: 0.4 }}>
                                {index === 0 ? (
                                  <PopMenu
                                    list={(
                                      <PopMenu.List>
                                        {availableCurrencies
                                          .toSorted((a) => usedCurrencies.includes(a.code) ? SortCommand.Shift : SortCommand.Maintain)
                                          .map(({ code }) => (
                                            <PopMenu.Item
                                              key={code}
                                              onClick={() => handleCurrencySelect(code)}
                                              sx={{ fontWeight: 700, color: code === selectedCurrency ? 'primary.main' : 'inherit' }}
                                            >
                                              {getCurrencyName(code)}
                                              {usedCurrencies.includes(code) && (
                                                <Chip size="small" label="사용됨" sx={{ ml: 1, height: 18, fontSize: 10 }} />
                                              )}
                                            </PopMenu.Item>
                                          ))}
                                        <Divider />
                                        {otherCurrencies.map((code) => (
                                          <PopMenu.Item
                                            key={code}
                                            onClick={() => handleCurrencySelect(code)}
                                            sx={{
                                              fontWeight: code === selectedCurrency ? 700 : 'normal',
                                              color: code === selectedCurrency ? 'primary.main' : 'text.secondary',
                                            }}
                                          >
                                            {getCurrencyName(code)}
                                            {usedCurrencies.includes(code) && (
                                              <Chip size="small" label="사용됨" sx={{ ml: 1, height: 18, fontSize: 10 }} />
                                            )}
                                          </PopMenu.Item>
                                        ))}
                                      </PopMenu.List>
                                    )}
                                  >

                                    <Typography
                                      variant="caption"
                                      sx={{
                                        cursor: 'pointer',
                                        userSelect: 'none',
                                        color: 'primary.main',
                                        fontWeight: 'medium',
                                        '&:hover': { opacity: 0.7 },
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.25,
                                      }}
                                    >
                                      {currencyUnit}
                                      <SwapHorizIcon sx={{ fontSize: 16 }} />
                                    </Typography>
                                  </PopMenu>
                                ) : (
                                  <Typography variant="caption">{currencyUnit}</Typography>
                                )}
                              </InputAdornment>
                            )
                          }
                        }}
                      />
                    )}
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


          </Stack>

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
                  onChange={(value) => onChange(formatDisplayDate(value as unknown as string))}
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
                        label={member.name}
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
ExpenseForm.Pending = Pending;
function Pending({
  defaultValues,
  action = <ExpenseForm.SubmitButton />,
  ...props
}: Omit<Props, 'onSubmit'>) {
  const methods = useForm<ExpenseFormValues>({
    mode: 'onChange',
    defaultValues: defaultValues,
  })
  const { control } = methods;

  const isMobile = useIsMobile();
  const theme = useTheme();

  return (
    <FormProvider {...methods}>
      <Box component="form" {...props}>
        <Stack spacing={2}>
          <Stack gap={1}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={0.5}>
              <Typography variant="subtitle2">
                결제 금액
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  cursor: 'pointer',
                  userSelect: 'none',
                  color: 'primary.main',
                  fontWeight: 'medium',
                  '&:hover': { opacity: 0.7 },
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.25,
                }}
              >
                원
                <SwapHorizIcon sx={{ fontSize: 16 }} />
              </Typography>
            </Stack>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Select variant="standard" disabled>
                  <MenuItem>Loading</MenuItem>
                </Select>
                <TextField
                  variant="standard"
                  size="small"
                  placeholder="금액"
                  disabled
                  sx={{ flex: 1 }}
                />
                <IconButton size="small" disabled sx={{ opacity: 0.3 }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>

            </Stack>
            <Stack
              direction="row"
              justifyContent="end"
              alignItems="center"
              marginTop={0.5}
            >
              <Button size="small" startIcon={<AddIcon />} disabled>
                추가
              </Button>
            </Stack>

          </Stack>

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
                  onChange={(value) => onChange(formatDisplayDate(value as unknown as string))}
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
          <Stack gap={0.5}>
            <Typography variant="subtitle2" fontSize="13px" color="textSecondary">
              장소
            </Typography>
            <Autocomplete
              size="small"
              options={[]}
              value=""
              renderValue={() => <Skeleton />}
              renderInput={(params) => (
                <TextField {...params} variant="standard" placeholder="장소 검색..." />
              )}
              clearText="초기화"
              disabled
            />
          </Stack>


          {/* 정산 대상자 */}
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" marginBottom={isMobile ? 0.5 : 0} marginTop={1.5}>
              <Typography variant="body2" color="textSecondary">누구와 나눌까요?</Typography>
              <Button size="small">전체 선택</Button>
            </Stack>

            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              <Skeleton variant="rounded" />
              <Skeleton variant="rounded" />
            </Stack>

          </Box>

          {action}
        </Stack>
      </Box>
    </FormProvider>
  )
}

ExpenseForm.SubmitButton = SubmitButton;

function SubmitButton(props: Omit<ButtonProps, 'type'>) {
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