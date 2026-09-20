import { Button, Stack } from '@mui/material'
import { useForm } from 'react-hook-form'
import { GroundRouteFields } from './GroundRouteFields'
import { TransportTimeFields } from './TransportTimeFields'
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
    <Stack component="form" onSubmit={handleSubmit(onNext)} p={2} gap={2}>
      <GroundRouteFields control={control} />
      <TransportTimeFields control={control} />

      <Button type="submit" variant="contained" size="large" disabled={!isValid} sx={{ mt: 1 }}>
        다음
      </Button>
    </Stack>
  )
}
