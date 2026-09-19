import { Controller, useForm } from 'react-hook-form'
import { ScrollView, StyleSheet, View } from 'react-native'
import { Button, Divider, TextField } from '~/shared/components/design-system'
import { palette } from '../../../../shared/config/tokens'
import { AirlineField } from './AirlineField'
import { FlightRouteFields } from './FlightRouteFields'
import { TransportTimeFields } from './TransportTimeFields'
import type { TransportFormValues } from './transportFormFunnel.types'

// 실시간 상태는 편번호를 숫자로 바꿔 맞춘다. 'KE721' 이나 '721A' 가 들어오면
// NaN 이 되어 매칭이 영영 실패하고, 사용자는 알림이 안 오는 이유를 알 수 없다.
const FLIGHT_NUMBER_PATTERN = /^\d+$/

interface Props {
  defaultValues?: Partial<TransportFormValues>
  onNext: (value: TransportFormValues) => void
}

export function FlightTransportForm({ defaultValues, onNext }: Props) {
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

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <FlightRouteFields control={control} setValue={setValue} />
        <TransportTimeFields control={control} />

        <Divider />

        <AirlineField control={control} setValue={setValue} />

        <Controller
          control={control}
          name="flightNumber"
          rules={{ required: true, pattern: FLIGHT_NUMBER_PATTERN }}
          render={({ field }) => (
            <TextField
              label="편번호"
              placeholder="예: 721"
              keyboardType="number-pad"
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
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: palette.divider, flexDirection: 'row' },
})
