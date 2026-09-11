import { MaterialIcons } from '@expo/vector-icons'
import {
  getCurrenciesByDestinations,
  getCurrencyName,
  getDefaultExchangeRate,
  getExchangeRate,
  setExchangeRate,
  type CurrencyCode,
} from '@waylog/domains/modules/expense'
import { useTrip } from '@waylog/domains/modules/trip'
import { useState } from 'react'
import { Pressable, StyleSheet } from 'react-native'
import { Button, Stack, TextField, Typography } from '~/shared/components/design-system'
import { BottomSheet } from '../../../shared/components/bottom-sheet/BottomSheet'
import { useOverlay } from '../../../shared/hooks/useOverlay'
import { palette } from '../../../shared/config/tokens'
import { KeyboardDismissArea } from '../../../shared/components/KeyboardDismissArea'
import { EditableText } from '../../../shared/components'

interface Props {
  tripId: string
}

/**
 * 웹 데스크탑 TripExchangeRageSettingButton 과 같은 역할.
 * 지출을 등록하기 전에도 환율을 정할 수 있어야 해서 사용된 통화가 아니라
 * 목적지에서 통화 목록을 뽑는다.
 */
export function TripExchangeRateSettingButton({ tripId }: Props) {
  const overlay = useOverlay()
  const { data: trip } = useTrip(tripId)

  const openRateSetting = () =>
    overlay.open(({ isOpen, close }) => (
      <ExchangeRateSheet tripId={tripId} isOpen={isOpen} onClose={close} />
    ))

  if (!trip.isOverseas) {
    return null
  }

  return (
    <Pressable accessibilityLabel="환율 설정" onPress={openRateSetting} style={styles.trigger}>
      <Stack direction="row" alignItems="center" gap={0.5}>
        <Typography variant="caption" style={styles.triggerLabel}>환율 설정</Typography>
        <MaterialIcons name="settings" size={14} color="#fff" />
      </Stack>
    </Pressable>
  )
}

interface SheetProps {
  tripId: string
  isOpen: boolean
  onClose: () => void
}

function ExchangeRateSheet({ tripId, isOpen, onClose }: SheetProps) {
  const { data: trip, update: updateTrip } = useTrip(tripId)
  const { exchangeRates } = trip

  const foreignCurrencies = getCurrenciesByDestinations(trip.destinations).filter(
    (currency) => currency.code !== 'KRW',
  )

  return (
    <KeyboardDismissArea>
      <BottomSheet isOpen={isOpen} onDismiss={onClose} snapPoints={[0.5]} defaultSnapIndex={0} safeArea>
        <BottomSheet.Header>
          <Typography variant="subtitle1" style={styles.sheetTitle}>환율 설정</Typography>
        </BottomSheet.Header>
        <BottomSheet.Body>
          {foreignCurrencies.map((currency) => (
            <ExchangeRateRow
              key={currency.code}
              code={currency.code}
              rate={getExchangeRate(currency.code, exchangeRates)}
              onSubmit={(rate) => {
                void updateTrip({ exchangeRates: setExchangeRate(exchangeRates, currency.code, rate) })
              }}
            />
          ))}
        </BottomSheet.Body>
        <BottomSheet.BottomActions>
          <Button variant="contained" size="large" fullWidth onPress={onClose}>확인</Button>
        </BottomSheet.BottomActions>
      </BottomSheet>
    </KeyboardDismissArea>
  )
}

interface RowProps {
  code: CurrencyCode
  rate: number | null
  onSubmit: (rate: number) => void
}

function ExchangeRateRow({ code, rate, onSubmit }: RowProps) {
  const defaultRate = getDefaultExchangeRate(code)
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(String(rate ?? defaultRate))

  const submit = () => {
    const nextRate = Number(draft.replace(/[^0-9.]/g, ''))
    if (nextRate > 0) onSubmit(nextRate)
    setIsEditing(false)
  }

  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" style={styles.row}>
      <Typography variant="body2" color="text.secondary">{getCurrencyName(code)}</Typography>
      <EditableText
        defaultValue={rate?.toString()}
        onSubmit={(value) => onSubmit(Number(value.replace(/[^0-9.]/g, '')))}
        slotProps={{
          field: { keyboardType: 'number-pad' },
          textLayout: { style: styles.rateInput }
        }}
        style={styles.rateValue}
        color={palette.primary}
        format={(x) => Number(x).toLocaleString()}

        endIcon={
          <Typography variant="body2" style={styles.rateUnit}>
            원
          </Typography>
        }
      />

    </Stack>
  )
}

const styles = StyleSheet.create({
  trigger: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 999, backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  triggerLabel: { color: '#fff', fontWeight: '700' },
  sheetTitle: { fontWeight: '800' },
  row: { paddingLeft: 20, paddingRight: 12, paddingVertical: 8 },

  rateInput: { borderBottomWidth: 1, borderStyle: 'solid', borderColor: palette.primary },
  rateValue: { textAlign: 'right', fontWeight: 400, padding: 8, margin: -8, },
  rateUnit: { fontWeight: '600', color: palette.primary, },
})
