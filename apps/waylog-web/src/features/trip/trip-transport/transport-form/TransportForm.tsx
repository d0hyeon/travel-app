import { Button, Divider, Stack, TextField, Typography } from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { GroundRouteFields } from './GroundRouteFields'
import { TransportTimeFields } from './TransportTimeFields'
import type { TransportFormValues } from './transportForm.types'

interface Props {
  defaultValues?: Partial<TransportFormValues>
  onNext: (value: TransportFormValues) => void
}

export function TransportForm({ defaultValues, onNext }: Props) {
  const isMobile = useIsMobile()
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

      <Divider />

      <Typography variant="caption" color="text.secondary" fontWeight={700}>
        선택 입력 — 실시간 매칭이 필요할 때만
      </Typography>

      <Stack direction={isMobile ? 'column' : 'row'} gap={2}>
        <Controller
          control={control}
          name="provider"
          render={({ field }) => (
            <TextField
              label="사업자"
              placeholder="예: JR도카이"
              fullWidth
              {...field}
              value={field.value ?? ''}
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
              fullWidth
              {...field}
              value={field.value ?? ''}
            />
          )}
        />
      </Stack>

      <Button type="submit" variant="contained" size="large" disabled={!isValid} sx={{ mt: 1 }}>
        다음
      </Button>
    </Stack>
  )
}
