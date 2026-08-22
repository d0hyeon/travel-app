import { useAuth } from '@waylog/domains/auth'
import { CurrencyCode as CurrencyCodeMap, CurrencyCodeLabel, getCurrenciesByDestinations, type CurrencyCode } from '@waylog/domains/modules/expense'
import { useTrip, useTripPlaces } from '@waylog/domains/modules/trip'
import { useTripMembers } from '@waylog/domains/modules/trip-member'
import { formatDisplayDate } from '@waylog/utility'
import { forwardRef, useImperativeHandle, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Button, Chip, Stack, TextField, Typography } from '../../../shared/components/mui'
import { Pressable } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { BottomSheet } from '../../../shared/components/bottom-sheet/BottomSheet'
import { useOverlay } from '../../../shared/hooks/useOverlay'
import { PopMenu } from '../../../shared/components/PopMenu'
import { DateField } from '../../../shared/components/date-picker'

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

  const { control, handleSubmit, watch, setValue } = useForm<ExpenseFormValues>({
    defaultValues: {
      description: '',
      date: '',
      currency: (currencies[0]?.code ?? 'KRW') as CurrencyCode,
      payments: myMemberId != null ? [{ memberId: myMemberId, amount: 0 }] : [],
      splitAmong: members.map((member) => member.id),
      ...defaultValues,
    },
  })

  const [amount, setAmount] = useState(String(defaultValues?.payments?.[0]?.amount ?? ''))
  const overlay = useOverlay()
  const currency = watch('currency')
  const splitAmong = watch('splitAmong')
  const placeId = watch('placeId')
  const payerId = watch('payments')[0]?.memberId
  const paymentRows = watch('payments')
  const addPayer = () => {
    const nextMember = members.find((member) => !paymentRows.some((payment) => payment.memberId === member.id))
    if (nextMember == null) return
    setValue('payments', [...paymentRows, { memberId: nextMember.id, amount: 0 }])
  }

  useImperativeHandle(
    ref,
    () => ({
      submit: () =>
        void handleSubmit((values) =>
          onSubmit({
            ...values,
            payments: payerId != null ? [{ memberId: payerId, amount: Number(amount) || 0 }] : [],
          }),
        )(),
    }),
    [handleSubmit, onSubmit, amount, payerId],
  )

  return (
    <Stack gap={2}>
      {currencies.length > 1 && (
        <Stack gap={1}>
          <Typography variant="caption" color="text.secondary">
            통화
          </Typography>
          <Stack direction="row" gap={0.5} sx={{ flexWrap: 'wrap' }}>
            {currencies.map((item) => (
              <Chip
                key={item.code}
                label={item.code}
                size="small"
                variant={currency === item.code ? 'filled' : 'outlined'}
                color={currency === item.code ? 'primary' : 'default'}
                onClick={() => setValue('currency', item.code as CurrencyCode)}
              />
            ))}
          </Stack>
        </Stack>
      )}

      <Stack gap={0.5}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle2" sx={{ fontWeight: '800' }}>결제 금액</Typography>
          <Button size="small" onClick={addPayer} disabled={paymentRows.length >= members.length}>추가</Button>
        </Stack>
        <Stack direction="row" gap={1} alignItems="flex-end">
        <Stack gap={0.5} sx={{ flex: 3 }}>
          <Pressable onPress={() => overlay.open(({ isOpen, close }) => (
            <BottomSheet isOpen={isOpen} onClose={close} snapPoints={[0.4]} defaultSnapIndex={0} safeArea>
              <BottomSheet.Body sx={{ paddingHorizontal: 0, paddingVertical: 8 }}>
                {members.map((member) => (
                  <Pressable key={member.id} onPress={() => { setValue('payments', [{ memberId: member.id, amount: 0 }]); close() }} style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
                    <Typography>{member.name}</Typography>
                  </Pressable>
                ))}
              </BottomSheet.Body>
            </BottomSheet>
          ))} style={{ position: 'relative' }}>
            <TextField pointerEvents="none" placeholder="결제자" variant="standard" value={members.find((member) => member.id === payerId)?.name ?? ''} fullWidth editable={false} />
            <MaterialIcons name="arrow-drop-down" size={24} color="#777" style={{ position: 'absolute', right: 0, bottom: 8 }} />
          </Pressable>
        </Stack>
        <Stack sx={{ flex: 7, position: 'relative' }}>
          <TextField
            placeholder="0"
            sx={{ textAlign: 'right', paddingRight: 72 }}
            variant="standard"
            keyboardType="number-pad"
            value={amount}
            onChangeText={setAmount}
          />
          <Stack sx={{ position: 'absolute', right: 0, bottom: 7 }}>
            <PopMenu
              trigger={(
                <Stack direction="row" alignItems="center" gap={0.5}>
                  <Typography color="primary">{CurrencyCodeLabel[currency] ?? currency}</Typography>
                  <MaterialIcons name="swap-horiz" size={22} color="#4C84FF" />
                </Stack>
              )}
              items={CurrencyCodeMap && Object.values(CurrencyCodeMap).map((code) => (
                <PopMenu.Item key={code} onClick={() => setValue('currency', code)}>
                  <Typography sx={{ color: currency === code ? '#4C84FF' : '#666' }}>
                    {CurrencyCodeLabel[code]}
                  </Typography>
                </PopMenu.Item>
              ))}
            />
          </Stack>
        </Stack>
        {paymentRows.length > 1 && (
          <Pressable onPress={() => setValue('payments', paymentRows.slice(0, -1))}>
            <MaterialIcons name="delete" size={22} color="#aaa" />
          </Pressable>
        )}
        </Stack>
      </Stack>

      <Stack gap={0.5}>
        <Typography variant="subtitle2" sx={{ fontWeight: '800' }}>내용</Typography>
        <Controller
          control={control}
          name="description"
          rules={{ required: true }}
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
        <Typography variant="subtitle2" sx={{ fontWeight: '800' }}>날짜</Typography>
        <Controller
          control={control}
          name="date"
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
          <TextField
            placeholder="장소 검색..."
            variant="standard"
            value={places.find((place) => place.placeId === placeId)?.name ?? ''}
            fullWidth
          />
        </Stack>
      )}

      <Stack gap={1}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle2" sx={{ fontWeight: '800' }}>누구와 나눌까요?</Typography>
          <Button
            size="small"
            variant="text"
            onClick={() => setValue('splitAmong', splitAmong.length === members.length ? [] : members.map((member) => member.id))}
          >
            전체 선택
          </Button>
        </Stack>
        <Stack direction="row" gap={0.5} sx={{ flexWrap: 'wrap' }}>
          {members.map((member) => {
            const included = splitAmong.includes(member.id)

            return (
              <Chip
                key={member.id}
                label={member.name}
                size="small"
                variant={included ? 'filled' : 'outlined'}
                color={included ? 'primary' : 'default'}
                onClick={() =>
                  setValue(
                    'splitAmong',
                    included
                      ? splitAmong.filter((id) => id !== member.id)
                      : [...splitAmong, member.id],
                  )
                }
              />
            )
          })}
        </Stack>
      </Stack>
    </Stack>
  )
})
