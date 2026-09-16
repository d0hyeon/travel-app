import { MaterialIcons } from '@expo/vector-icons'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Button, Divider, TextField, Typography } from '~/shared/components/design-system'
import { palette, radius } from '../../../../shared/config/tokens'
import { TransportScheduleFields } from './TransportScheduleFields'
import { useFlightSearchOverlay } from './useFlightSearchOverlay'
import type { TransportFormValues } from './transportFormFunnel.types'

interface Props {
  defaultValues?: Partial<TransportFormValues>
  onNext: (value: TransportFormValues) => void
}

export function FlightTransportForm({ defaultValues, onNext }: Props) {
  const flightSearch = useFlightSearchOverlay()
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

  // 조회 결과를 폼이 직접 받는다. 밖에서 defaultValues 로 밀어넣으면
  // 이미 마운트된 입력의 표시값이 갱신되지 않는다.
  // shouldValidate 가 없으면 다 채워도 isValid 가 그대로라 버튼이 잠긴다.
  const searchFlight = async () => {
    const flight = await flightSearch.open()
    if (flight == null) return

    setValue('departureName', flight.origin.name, { shouldValidate: true })
    setValue('arrivalName', flight.destination.name, { shouldValidate: true })
    setValue('departureAt', flight.scheduled_out, { shouldValidate: true })
    setValue('arrivalAt', flight.scheduled_in, { shouldValidate: true })
    // 항공편 조회는 IANA 타임존을 준다. 좌표에서 알아낼 필요가 없다.
    setValue('departureTimezone', flight.origin.timezone, { shouldValidate: true })
    setValue('arrivalTimezone', flight.destination.timezone, { shouldValidate: true })
    setValue('airline', flight.operatorName, { shouldValidate: true })
    setValue('flightNumber', flight.ident_iata, { shouldValidate: true })
  }

  // 조회로 채웠으면 무엇을 골랐는지 검색 필드에 남긴다.
  // 조회로 채웠으면 무엇을 골랐는지 검색 필드에 남긴다.
  const airline = useWatch({ control, name: 'airline' })
  const flightNumber = useWatch({ control, name: 'flightNumber' })
  const selectedFlightLabel = [airline, flightNumber].filter(Boolean).join(' ')

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.field}>
          <Typography style={styles.label}>항공사 또는 편명 검색</Typography>
          <Pressable onPress={searchFlight} style={styles.searchControl}>
            <Typography style={selectedFlightLabel === '' ? styles.placeholder : styles.searchValue}>
              {selectedFlightLabel === '' ? '예: KE721, 대한항공' : selectedFlightLabel}
            </Typography>
            <MaterialIcons name="search" size={18} color={palette.textSecondary} />
          </Pressable>
          <Typography style={styles.hint}>조회 없이도 아래에서 직접 입력해 등록할 수 있어요</Typography>
        </View>

        <Divider />

        <TransportScheduleFields
          control={control}
          departurePlaceholder="출발 공항"
          arrivalPlaceholder="도착 공항"
        />

        <Controller
          control={control}
          name="airline"
          render={({ field }) => (
            <TextField label="항공사" value={field.value} onChangeText={field.onChange} />
          )}
        />
        <Controller
          control={control}
          name="flightNumber"
          render={({ field }) => (
            <TextField label="편명" value={field.value} onChangeText={field.onChange} />
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
  searchControl: {
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
  searchValue: { fontSize: 15 },
  hint: { fontSize: 11.5, color: palette.textSecondary },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: palette.divider, flexDirection: 'row' },
})
