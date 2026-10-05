import {
  formatCurrency,
  getDefaultExchangeRate,
  getExchangeRate,
  getUsedCurrencies,
  setExchangeRate,
  type CurrencyCode,
} from '@waylog/domains/modules/expense'
import { useTrip } from '@waylog/domains/modules/trip'
import { StyleSheet } from 'react-native'
import { Stack, Typography } from '~shared/components/design-system'
import { EditableText } from '~shared/components'
import { palette } from '~shared/config/tokens'
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
  return (
    <EditableText
      value={value.toString()}
      onSubmit={(rate) => {
        const parsed = Number(rate.replace(/[^0-9.]/g, ''))
        if (parsed > 0) onSubmit(parsed)
      }}
      slotProps={{ field: { keyboardType: 'number-pad' } }}
      format={(rate) => `${code} ${Number(rate).toLocaleString()}원`}
      variant="caption"
      style={styles.exchangeRateLink}
    />
  )
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: palette.primary },
  summary: { flex: 1 },
  title: { color: '#fff' },
  exchangeRateLink: { color: '#fff', fontSize: 11, textDecorationLine: 'underline' },
})
