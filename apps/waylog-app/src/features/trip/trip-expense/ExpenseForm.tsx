import { useAuth } from '@waylog/domains/clients'
import { CurrencyCode as CurrencyCodeMap, CurrencyCodeLabel, getCurrenciesByDestinations, type CurrencyCode } from '@waylog/domains/modules/expense'
import { useTrip, useTripPlaces } from '@waylog/domains/modules/trip'
import { useTripMembers } from '@waylog/domains/modules/trip-member'
import { formatDisplayDate } from '@waylog/utility'
import { forwardRef, useCallback, useImperativeHandle } from 'react'
import { Controller, createFormControl, useFieldArray, useForm, useWatch } from 'react-hook-form'
import { Button, Chip, IconButton, Stack, TextField, Typography } from '~/shared/components/design-system'
import { Pressable, StyleSheet } from 'react-native'
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

  const currencies = getCurrenciesByDestinations(trip.destinations)
  const myMemberId = members.find((member) => member.userId === auth?.id)?.id

  const { control, handleSubmit, setValue } = useForm<ExpenseFormValues>({
    formControl: expenseFormControl,
    defaultValues: {
      date: formatDate(Date.now(), 'yyyy-MM-dd'),
      currency: currencies[0]?.code ?? 'KRW',
      payments: myMemberId != null ? [{ memberId: myMemberId, amount: 0 }] : [],
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
      {currencies.length > 1 && (
        <Stack gap={1}>
          <Typography variant="caption" color="text.secondary">
            통화
          </Typography>
          <Stack direction="row" gap={0.5} style={styles.wrapRow}>
            {currencies.map((item) => (
              <Chip
                key={item.code}
                label={item.code}
                size="small"
                variant={currency === item.code ? 'filled' : 'outlined'}
                color={currency === item.code ? 'primary' : 'default'}
                onPress={() => setValue('currency', item.code)}
              />
            ))}
          </Stack>
        </Stack>
      )}

      <Stack gap={0.5}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle2" style={styles.sectionTitle}>결제 금액</Typography>
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
                <Stack style={styles.amountField}>
                  <TextField
                    placeholder="0"
                    style={styles.amountInput}
                    variant="standard"
                    keyboardType="number-pad"
                    value={value > 0 ? value.toLocaleString() : ''}
                    onChangeText={(text) => onChange(Number(text.replace(/\D/g, '')) || 0)}
                  />
                  {/* 통화는 지출 전체에 하나뿐이라 첫 행에서만 바꾼다. */}
                  {index === 0 && (
                    <Stack style={styles.currencyMenuAnchor}>
                      <PopMenu
                        trigger={(
                          <Stack direction="row" alignItems="center" gap={0.5}>
                            <Typography color="primary">{CurrencyCodeLabel[currency] ?? currency}</Typography>
                            <MaterialIcons name="swap-horiz" size={22} color="#4C84FF" />
                          </Stack>
                        )}
                        items={Object.values(CurrencyCodeMap).map((code) => (
                          <PopMenu.Item key={code} onPress={() => setValue('currency', code)}>
                            <Typography style={currency === code ? styles.currencyItemActive : styles.currencyItemInactive}>
                              {CurrencyCodeLabel[code]}
                            </Typography>
                          </PopMenu.Item>
                        ))}
                      />
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
        <Typography variant="subtitle2" style={styles.sectionTitle}>내용</Typography>
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
        <Typography variant="subtitle2" style={styles.sectionTitle}>날짜</Typography>
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
                value={places.find((place) => place.placeId === placeId)?.name ?? ''}
                fullWidth
                editable={false}
              />
            }
            items={places.map((place) => (
              <PopMenu.Item
                key={place.placeId}
                onPress={() => setValue('placeId', place.placeId)}
                icon={place.placeId === placeId ? <MaterialIcons name="check" size={18} color="#4C84FF" /> : undefined}
              >
                <Typography style={place.placeId === placeId ? styles.placeItemActive : styles.placeItemInactive}>
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
                <Typography variant="subtitle2" style={styles.sectionTitle}>누구와 나눌까요?</Typography>
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
  sectionTitle: {
    fontWeight: '800',
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
    position: 'relative',
  },
  amountInput: {
    textAlign: 'right',
    paddingRight: 72,
  },
  currencyMenuAnchor: {
    position: 'absolute',
    right: 0,
    bottom: 7,
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
