import { useAuth } from '@waylog/domains/auth'
import { getCurrenciesByDestinations, type CurrencyCode } from '@waylog/domains/expense'
import { useTrip, useTripPlaces } from '@waylog/domains/trip'
import { useTripMembers } from '@waylog/domains/trip-member'
import { formatDisplayDate } from '@waylog/domains/utils'
import { forwardRef, useImperativeHandle, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Chip, Stack, TextField, Typography } from '../../../shared/components/mui'

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
// 날짜 선택(DatePicker)은 오늘 기준 기본값으로 두고 후속 작업으로 남긴다.
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
      date: formatDisplayDate(new Date()),
      currency: (currencies[0]?.code ?? 'KRW') as CurrencyCode,
      payments: myMemberId != null ? [{ memberId: myMemberId, amount: 0 }] : [],
      splitAmong: members.map((member) => member.id),
      ...defaultValues,
    },
  })

  const [amount, setAmount] = useState(String(defaultValues?.payments?.[0]?.amount ?? ''))
  const currency = watch('currency')
  const splitAmong = watch('splitAmong')
  const placeId = watch('placeId')
  const payerId = watch('payments')[0]?.memberId

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
      <Controller
        control={control}
        name="description"
        rules={{ required: true }}
        render={({ field }) => (
          <TextField
            autoFocus
            placeholder="지출 내용"
            fullWidth
            variant="standard"
            value={field.value}
            onChangeText={field.onChange}
          />
        )}
      />

      <TextField
        placeholder="금액"
        fullWidth
        variant="standard"
        keyboardType="number-pad"
        value={amount}
        onChangeText={setAmount}
      />

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

      <Stack gap={1}>
        <Typography variant="caption" color="text.secondary">
          결제자
        </Typography>
        <Stack direction="row" gap={0.5} sx={{ flexWrap: 'wrap' }}>
          {members.map((member) => (
            <Chip
              key={member.id}
              label={member.name}
              size="small"
              variant={payerId === member.id ? 'filled' : 'outlined'}
              color={payerId === member.id ? 'primary' : 'default'}
              onClick={() => setValue('payments', [{ memberId: member.id, amount: 0 }])}
            />
          ))}
        </Stack>
      </Stack>

      <Stack gap={1}>
        <Typography variant="caption" color="text.secondary">
          나눠 낼 사람
        </Typography>
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

      {places.length > 0 && (
        <Stack gap={1}>
          <Typography variant="caption" color="text.secondary">
            장소 (선택)
          </Typography>
          <Stack direction="row" gap={0.5} sx={{ flexWrap: 'wrap' }}>
            {places.map((place) => (
              <Chip
                key={place.id}
                label={place.name}
                size="small"
                variant={placeId === place.placeId ? 'filled' : 'outlined'}
                color={placeId === place.placeId ? 'primary' : 'default'}
                onClick={() =>
                  setValue('placeId', placeId === place.placeId ? undefined : place.placeId)
                }
              />
            ))}
          </Stack>
        </Stack>
      )}
    </Stack>
  )
})
