import {
  formatCurrency,
  getDefaultExchangeRate,
  getExchangeRate,
  getUsedCurrencies,
  setExchangeRate,
  type CurrencyCode,
} from '@waylog/domains/modules/expense'
import { useTrip } from '@waylog/domains/modules/trip'
import { useState } from 'react'
import { StyleSheet, Pressable } from 'react-native'
import { Stack, TextField, Typography } from '~/shared/components/design-system'
import { palette } from '../../../shared/config/tokens'
import { useExpenseSummary } from './useExpenseSummary'
import { TripExchangeRateSettingButton } from './TripExchangeRateSettingButton'

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
      style={styles.header}
    >
      <Stack alignItems="flex-start" style={styles.summary}>
        <Typography variant="caption" style={styles.title}>
          총 지출
        </Typography>
        <Typography variant="h6" style={styles.title}>
          {formatCurrency(totalInKRW)}
        </Typography>
      </Stack>

      <Stack direction="row" gap={1} alignItems="flex-end">
        {trip.isOverseas && usedCurrencies.map((code) => (
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
        <TripExchangeRateSettingButton tripId={tripId} />
      </Stack>
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
        style={styles.exchangeRateInput}
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
        style={styles.exchangeRateLink}
      >
        {code} {value.toLocaleString()}원
      </Typography>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: palette.primary },
  summary: { flex: 1 },
  title: { color: '#fff' },
  exchangeRateInput: { minWidth: 90, color: '#fff', fontSize: 11, textAlign: 'right' },
  exchangeRateLink: { color: '#fff', fontSize: 11, textDecorationLine: 'underline' },
})
