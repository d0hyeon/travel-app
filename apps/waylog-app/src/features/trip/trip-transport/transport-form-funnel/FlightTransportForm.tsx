import { MaterialIcons } from '@expo/vector-icons'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Button, Divider, TextField, Typography } from '~/shared/components/design-system'
import { palette, radius } from '../../../../shared/config/tokens'
import { TransportScheduleFields } from './TransportScheduleFields'
import { useAirlineSelectOverlay } from './useAirlineSelectOverlay'
import { useAirportSelectOverlay } from './useAirportSelectOverlay'
import type { TransportFormValues } from './transportFormFunnel.types'

interface Props {
  defaultValues?: Partial<TransportFormValues>
  onNext: (value: TransportFormValues) => void
}

export function FlightTransportForm({ defaultValues, onNext }: Props) {
  const airportSelect = useAirportSelectOverlay()
  const airlineSelect = useAirlineSelectOverlay()
  const {
    control,
    handleSubmit,
    setValue,
    formState: { isValid },
  } = useForm<TransportFormValues>({
    values: defaultValues as TransportFormValues,
    // isValid 는 검증이 돈 뒤에만 참이 된다. 제출 시점에만 검증하면
    // 다 채워도 버튼이 계속 잠긴다.
    mode: 'onChange',
  })

  // shouldValidate 가 없으면 다 채워도 isValid 가 그대로라 버튼이 잠긴다.
  const selectDeparture = async () => {
    const airport = await airportSelect.open('출발 공항 선택')
    if (airport == null) return

    setValue('departureName', airport.nameKo, { shouldValidate: true })
    setValue('departureAirportCode', airport.code, { shouldValidate: true })
    setValue('departureTimezone', airport.timezone, { shouldValidate: true })
  }

  const selectArrival = async () => {
    const airport = await airportSelect.open('도착 공항 선택')
    if (airport == null) return

    setValue('arrivalName', airport.nameKo, { shouldValidate: true })
    setValue('arrivalAirportCode', airport.code, { shouldValidate: true })
    setValue('arrivalTimezone', airport.timezone, { shouldValidate: true })
  }

  const selectAirline = async () => {
    const airline = await airlineSelect.open()
    if (airline == null) return

    setValue('airline', airline.nameKo, { shouldValidate: true })
    setValue('airlineCode', airline.code, { shouldValidate: true })
  }

  const airline = useWatch({ control, name: 'airline' })

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <TransportScheduleFields
          control={control}
          departurePlaceholder="출발 공항"
          arrivalPlaceholder="도착 공항"
          onDepartureClick={selectDeparture}
          onArrivalClick={selectArrival}
        />

        <Divider />

        <View style={styles.field}>
          <Typography style={styles.label}>항공사</Typography>
          <Pressable onPress={selectAirline} style={styles.selectControl}>
            <Typography style={airline == null ? styles.placeholder : styles.selectValue}>
              {airline ?? '목록에서 선택'}
            </Typography>
            <MaterialIcons name="search" size={18} color={palette.textSecondary} />
          </Pressable>
        </View>

        <Controller
          control={control}
          name="flightNumber"
          render={({ field }) => (
            <TextField
              label="편번호"
              placeholder="예: 721"
              value={field.value}
              onChangeText={field.onChange}
            />
          )}
        />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          variant="contained"
          size="large"
          fullWidth
          disabled={!isValid}
          onPress={handleSubmit(onNext)}
        >
          다음
        </Button>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { padding: 16, gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 12.5, color: palette.textSecondary, fontWeight: '600' },
  selectControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: palette.divider,
    borderRadius: radius.md,
  },
  placeholder: { fontSize: 15, color: palette.textSecondary },
  selectValue: { fontSize: 15 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: palette.divider, flexDirection: 'row' },
})
