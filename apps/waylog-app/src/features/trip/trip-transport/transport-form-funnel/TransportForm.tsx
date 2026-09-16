import { Controller, useForm } from 'react-hook-form'
import { ScrollView, StyleSheet, View } from 'react-native'
import { Button, Divider, TextField, Typography } from '~/shared/components/design-system'
import { palette } from '../../../../shared/config/tokens'
import { TransportScheduleFields } from './TransportScheduleFields'
import type { TransportFormValues } from './transportFormFunnel.types'

interface Props {
  defaultValues?: Partial<TransportFormValues>
  onNext: (value: TransportFormValues) => void
}

export function TransportForm({ defaultValues, onNext }: Props) {
  const {
    control,
    handleSubmit,
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
        <TransportScheduleFields
          control={control}
          departurePlaceholder="출발지"
          arrivalPlaceholder="도착지"
        />

        <Divider />

        <Typography style={styles.sectionLabel}>선택 입력 — 실시간 매칭이 필요할 때만</Typography>

        <Controller
          control={control}
          name="provider"
          render={({ field }) => (
            <TextField
              label="사업자"
              placeholder="예: JR도카이"
              value={field.value}
              onChangeText={field.onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="serviceNumber"
          render={({ field }) => (
            <TextField
              label="편명·호수"
              placeholder="예: 노조미 25호"
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
  sectionLabel: { fontSize: 12, color: palette.textSecondary, fontWeight: '700' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: palette.divider, flexDirection: 'row' },
})
