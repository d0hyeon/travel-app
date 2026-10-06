import { useForm } from 'react-hook-form'
import { ScrollView, StyleSheet, View } from 'react-native'
import { Button } from '~shared/components/design-system'
import { palette } from '~shared/config/tokens'
import { GroundRouteFields } from './fields/GroundRouteFields'
import { TransportTimeFields } from './fields/TransportTimeFields'
import type { TransportFormValues } from './transportForm.types'

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
        <GroundRouteFields control={control} />
        <TransportTimeFields control={control} />
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
