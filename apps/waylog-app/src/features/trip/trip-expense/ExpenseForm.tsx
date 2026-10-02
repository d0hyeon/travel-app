import { useAuth } from '@waylog/domains/clients'
import { CurrencyCode as CurrencyCodeMap, CurrencyCodeLabel, getCurrenciesByDestinations, getUsedCurrencies, useExpenses, type CurrencyCode } from '@waylog/domains/modules/expense'
import { useTrip, useTripPlaces } from '@waylog/domains/modules/trip'
import { useTripMembers } from '@waylog/domains/modules/trip-member'
import { formatDisplayDate } from '@waylog/utility'
import { forwardRef, useCallback, useImperativeHandle } from 'react'
import { Controller, createFormControl, useFieldArray, useForm, useWatch } from 'react-hook-form'
import { Button, Chip, Divider, IconButton, Stack, TextField, Typography } from '~/shared/components/design-system'
import { Pressable, StyleSheet, View } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { BottomSheet } from '../../../shared/components/bottom-sheet/BottomSheet'
import { useOverlay } from '../../../shared/hooks/useOverlay'
import { PopMenu } from '../../../shared/components/PopMenu'
import { DateField } from '../../../shared/components/date-picker'
import { palette } from '../../../shared/config/tokens'
import { formatDate } from 'date-fns'

export interface PaymentField {
  memberId: string
  amount: number
}

export interface ExpenseFormValues {
  description: string
  date: string
  currency: CurrencyCode
  payments: PaymentField[]
  placeId?: string
  splitAmong: string[]
}

export interface ExpenseFormRef {
  submit: () => void
}

interface Props {
  tripId: string
  defaultValues?: Partial<ExpenseFormValues>
  onSubmit: (data: ExpenseFormValues) => void
}

export const expenseFormControl = createFormControl<ExpenseFormValues>({
  mode: 'onChange',
  defaultValues: {
    description: '일반',
    currency: 'KRW'
  },
})

// 웹 ExpenseForm 과 같은 값 모양을 유지한다.
export const ExpenseForm = forwardRef<ExpenseFormRef, Props>(function ExpenseForm(
  { tripId, defaultValues, onSubmit },
  ref,
) {
  const { data: trip } = useTrip(tripId)
  const { data: members } = useTripMembers(tripId)
  const { data: places } = useTripPlaces(tripId)
  const { data: auth } = useAuth({ required: false })

  const { data: expenses } = useExpenses(tripId)

  const currencies = getCurrenciesByDestinations(trip.destinations)
  const usedCurrencies = getUsedCurrencies(expenses)
  const destinationCurrencyCodes = currencies.map((item) => item.code)
  const sortedDestinationCurrencyCodes = [
    ...destinationCurrencyCodes.filter((code) => usedCurrencies.includes(code)),
    ...destinationCurrencyCodes.filter((code) => !usedCurrencies.includes(code)),
  ]
  const otherCurrencyCodes = (Object.values(CurrencyCodeMap) as CurrencyCode[]).filter((code) => !destinationCurrencyCodes.includes(code))
  const myMemberId = members.find((member) => member.userId === auth?.id)?.id

  const { control, handleSubmit, setValue } = useForm<ExpenseFormValues>({
    formControl: expenseFormControl,
    defaultValues: {
      date: formatDate(Date.now(), 'yyyy-MM-dd'),
      currency: currencies[0]?.code ?? 'KRW',
      payments: myMemberId != null ? [{ memberId: myMemberId, amount: 0 }] : [],
      ...defaultValues,
      splitAmong: defaultValues?.splitAmong ?? members.map((member) => member.id),
    },
  })
  const { fields: paymentFields, append, remove } = useFieldArray({
    control,
    name: 'payments',
    rules: {
      maxLength: 0,
      validate: (fields) => {
        const totalPrice = fields.reduce((acc, field) => acc + field.amount, 0);
        if (totalPrice === 0) {
          return '금액이 입력되지 않았어요.';
        }
      }
    }
  })

  const overlay = useOverlay()
  const currency = useWatch({ control, name: 'currency' })
  const placeId = useWatch({ control, name: 'placeId' })
  const payments = useWatch({ control, name: 'payments' })

  const addPayer = () => {
    const nextMember = members.find((member) => !payments.some((payment) => payment.memberId === member.id))
    if (nextMember == null) return
    append({ memberId: nextMember.id, amount: 0 })
  }

  const submit = useCallback(() => {
    handleSubmit((formValues) => {
      return onSubmit({
        ...formValues,
        description: formValues.description || '일반 지출',
      })
    })()
  }, [onSubmit])

  useImperativeHandle(
    ref,
    () => ({ submit }),
    [submit],
  )

  return (
    <Stack gap={2}>
      <Stack gap={0.5}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle2" >결제 금액</Typography>
          <Button size="small" onPress={addPayer} disabled={paymentFields.length >= members.length}>추가</Button>
        </Stack>
        {paymentFields.map((field, index) => (
          <Stack key={field.id} direction="row" gap={1} alignItems="flex-end">
            <Controller
              control={control}
              name={`payments.${index}.memberId`}
              render={({ field: { value, onChange } }) => (
                <Stack gap={0.5} style={styles.payerField}>
                  <Pressable onPress={() => overlay.open(({ isOpen, close }) => (
                    <BottomSheet isOpen={isOpen} onDismiss={close} snapPoints={[0.4]} defaultSnapIndex={0} safeArea>
                      <BottomSheet.Body style={styles.payerSheetBody}>
                        {members.map((member) => (
                          <Pressable key={member.id} onPress={() => { onChange(member.id); close() }} style={styles.payerSheetItem}>
                            <Typography>{member.name}</Typography>
                          </Pressable>
                        ))}
                      </BottomSheet.Body>
                    </BottomSheet>
                  ))} style={styles.payerTrigger}>
                    <TextField pointerEvents="none" placeholder="결제자" variant="standard" value={members.find((member) => member.id === value)?.name ?? ''} fullWidth editable={false} />
                    <MaterialIcons name="arrow-drop-down" size={24} color="#777" style={styles.payerTriggerIcon} />
                  </Pressable>
                </Stack>
              )}
            />
            <Controller
              control={control}
              name={`payments.${index}.amount`}
              render={({ field: { value, onChange } }) => (
                <Stack direction="row" alignItems="center" gap={1} style={styles.amountField}>
                  <View style={styles.amountInputContainer}>
                    <TextField
                      placeholder="0"
                      style={styles.amountInput}
                      variant="standard"
                      fullWidth
                      keyboardType="number-pad"
                      value={value > 0 ? value.toLocaleString() : ''}
                      onChangeText={(text) => onChange(Number(text.replace(/\D/g, '')) || 0)}
                    />
                  </View>
                  {trip.isOverseas && index === 0 ? (
                    <PopMenu
                      trigger={(
                        <Stack direction="row" alignItems="center" gap={0.5}>
                          <Typography color="primary">{CurrencyCodeLabel[currency] ?? currency}</Typography>
                          <MaterialIcons name="swap-horiz" size={22} color="#4C84FF" />
                        </Stack>
                      )}
                      items={(
                        <>
                          {sortedDestinationCurrencyCodes.map((code) => (
                            <PopMenu.Item key={code} onPress={() => setValue('currency', code)}>
                              <Stack direction="row" alignItems="center" gap={1}>
                                <Typography style={currency === code ? styles.currencyItemActive : styles.currencyItemInactive}>
                                  {CurrencyCodeLabel[code]}
                                </Typography>
                                {usedCurrencies.includes(code) && <Chip size="small" label="사용됨" />}
                              </Stack>
                            </PopMenu.Item>
                          ))}
                          <Divider />
                          {otherCurrencyCodes.map((code) => (
                            <PopMenu.Item key={code} onPress={() => setValue('currency', code)}>
                              <Stack direction="row" alignItems="center" gap={1}>
                                <Typography style={currency === code ? styles.currencyItemActive : styles.currencyItemInactive}>
                                  {CurrencyCodeLabel[code]}
                                </Typography>
                                {usedCurrencies.includes(code) && <Chip size="small" label="사용됨" />}
                              </Stack>
                            </PopMenu.Item>
                          ))}
                        </>
                      )}
                    />
                  ) : (
                    <Stack direction="row" alignItems="center" gap={0.5}>
                      <Typography color="primary">{CurrencyCodeLabel[currency] ?? currency}</Typography>
                      {trip.isOverseas && <View style={styles.currencyIconSpacer} />}
                    </Stack>
                  )}
                </Stack>
              )}
            />
            {paymentFields.length > 1 && (
              <IconButton size="small" onPress={() => remove(index)}>
                <MaterialIcons name="delete" size={22} color="#aaa" />
              </IconButton>
            )}
          </Stack>
        ))}
      </Stack>

      <Stack gap={0.5}>
        <Typography variant="subtitle2" >내용</Typography>
        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <TextField
              placeholder="점심 식사"
              fullWidth
              variant="standard"
              value={field.value}
              onChangeText={field.onChange}
            />
          )}
        />
      </Stack>

      <Stack gap={0.5}>
        <Typography variant="subtitle2">날짜</Typography>
        <Controller
          control={control}
          name="date"
          rules={{ required: true }}
          render={({ field }) => (
            <DateField
              placeholder="날짜 선택"
              value={field.value ? new Date(field.value) : undefined}
              onChange={(date) => field.onChange(formatDisplayDate(date))}
            />
          )}
        />
      </Stack>

      {places.length > 0 && (
        <Stack gap={1}>
          <Typography variant="caption" color="text.secondary">
            장소 (선택)
          </Typography>
          <PopMenu
            trigger={
              <TextField
                pointerEvents="none"
                placeholder="장소 선택"
                variant="standard"
                value={places.find((place) => place.id === placeId)?.name ?? ''}
                fullWidth
                editable={false}
              />
            }
            items={places.map((place) => (
              <PopMenu.Item
                key={place.id}
                onPress={() => setValue('placeId', place.id)}
                icon={place.id === placeId ? <MaterialIcons name="check" size={18} color="#4C84FF" /> : undefined}
              >
                <Typography variant="body2" style={place.id === placeId ? styles.placeItemActive : styles.placeItemInactive}>
                  {place.name}
                </Typography>
              </PopMenu.Item>
            ))}
          />
        </Stack>
      )}

      <Stack gap={1}>
        <Controller
          control={control}
          name="splitAmong"
          rules={{
            validate: (x) => {
              if (x.length === 0) {
                return '한명 이상 선택해 주세요';
              }
            }
          }}
          render={({ field: { value, onChange: setValue } }) => (
            <Stack gap={1}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2">누구와 나눌까요?</Typography>
                <Button
                  size="small"
                  variant="text"
                  onPress={() => {
                    setValue(value.length === members.length
                      ? []
                      : members.map((member) => member.id)
                    )
                  }}
                >
                  전체 선택
                </Button>
              </Stack>
              <Stack direction="row" gap={0.5} style={styles.wrapRow}>
                {members.map((member) => {
                  const included = value.includes(member.id)

                  return (
                    <Chip
                      key={member.id}
                      label={member.name}
                      size="small"
                      variant={included ? 'filled' : 'outlined'}
                      color={included ? 'primary' : 'default'}
                      onPress={() =>
                        setValue(included
                          ? value.filter((id) => id !== member.id)
                          : [...value, member.id],
                        )
                      }
                    />
                  )
                })}
              </Stack>
            </Stack>
          )}
        />

      </Stack>
    </Stack>
  )
})

const styles = StyleSheet.create({
  wrapRow: {
    flexWrap: 'wrap',
  },
  payerField: {
    flex: 3,
  },
  payerSheetBody: {
    paddingHorizontal: 0,
    paddingVertical: 8,
  },
  payerSheetItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  payerTrigger: {
    position: 'relative',
  },
  payerTriggerIcon: {
    position: 'absolute',
    right: 0,
    bottom: 8,
  },
  amountField: {
    flex: 7,
    borderBottomWidth: 1,
    borderColor: palette.divider,
  },
  amountInput: {
    textAlign: 'right',
    borderBottomWidth: 0,
  },
  amountInputContainer: {
    flex: 1,
  },
  currencyIconSpacer: {
    width: 22,
  },
  currencyItemActive: {
    color: '#4C84FF',
  },
  currencyItemInactive: {
    color: '#666',
  },
  placeItemActive: {
    color: '#4C84FF',
  },
  placeItemInactive: {
    color: palette.text,
  },
})
