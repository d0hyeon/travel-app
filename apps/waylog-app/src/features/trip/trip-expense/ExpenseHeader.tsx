import {
  formatCurrency,
  getDefaultExchangeRate,
  getExchangeRate,
  getUsedCurrencies,
  setExchangeRate,
  type CurrencyCode,
} from '@waylog/domains/expense'
import { useTrip } from '@waylog/domains/trip'
import { useState } from 'react'
import { Pressable } from 'react-native'
import { Stack, TextField, Typography } from '../../../shared/components/mui'
import { palette } from '../../../shared/config/tokens'
import { useExpenseSummary } from './useExpenseSummary'

interface Props {
  tripId: string
}

// 웹 ExpenseHeader.mobile 을 옮긴다. 해외 여행이면 통화별 환율을 눌러 고친다.
export function ExpenseHeader({ tripId }: Props) {
  const { data: trip, update: updateTrip } = useTrip(tripId)
  const { totalInKRW, expenses } = useExpenseSummary(tripId)

  const { exchangeRates } = trip
  const usedCurrencies = getUsedCurrencies(expenses)

  return (
    <Stack
      direction="row"
      gap={1}
      justifyContent="space-between"
      alignItems="flex-end"
      sx={{ paddingHorizontal: 16, paddingVertical: 12, backgroundColor: palette.primary }}
    >
      <Stack alignItems="flex-start" sx={{ flex: 1 }}>
        <Typography variant="caption" sx={{ color: '#fff' }}>
          총 지출
        </Typography>
        <Typography variant="h6" sx={{ color: '#fff' }}>
          {formatCurrency(totalInKRW)}
        </Typography>
      </Stack>

      {trip.isOverseas && usedCurrencies.length > 0 && (
        <Stack direction="row" gap={1} alignItems="flex-end">
          {usedCurrencies.map((code) => (
            <ExchangeRateField
              key={code}
              code={code as CurrencyCode}
              value={getExchangeRate(code, exchangeRates) ?? getDefaultExchangeRate(code)}
              onSubmit={(rate) => {
                const newRates = setExchangeRate(exchangeRates, code as CurrencyCode, rate)
                void updateTrip({ exchangeRates: newRates })
              }}
            />
          ))}
        </Stack>
      )}
    </Stack>
  )
}

interface FieldProps {
  code: CurrencyCode
  value: number
  onSubmit: (rate: number) => void
}

function ExchangeRateField({ code, value, onSubmit }: FieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(String(value))

  if (isEditing) {
    return (
      <TextField
        autoFocus
        variant="standard"
        keyboardType="number-pad"
        value={draft}
        onChangeText={setDraft}
        sx={{ minWidth: 90, color: '#fff', fontSize: 11, textAlign: 'right' }}
        onBlur={() => {
          const rate = Number(draft.replace(/[^0-9.]/g, ''))
          if (rate > 0) onSubmit(rate)
          setIsEditing(false)
        }}
      />
    )
  }

  return (
    <Pressable onPress={() => setIsEditing(true)}>
      <Typography
        variant="caption"
        sx={{ color: '#fff', fontSize: 11, textDecorationLine: 'underline' }}
      >
        {code} {value.toLocaleString()}원
      </Typography>
    </Pressable>
  )
}
