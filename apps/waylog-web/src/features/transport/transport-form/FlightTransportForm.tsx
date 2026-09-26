import { Button, Divider, Stack, TextField, type ButtonProps } from '@mui/material'
import { Controller, createFormControl, useForm, useFormState } from 'react-hook-form'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { AirlineField } from '../transport-airline/AirlineField'
import { FlightRouteFields } from './fields/FlightRouteFields'
import { FieldPair } from './fields/scheduleFieldParts'
import { TransportTimeFields } from './fields/TransportTimeFields'
import type { TransportFormValues } from './transportForm.types'

const FLIGHT_NUMBER_PATTERN = /^\d+$/
const FORM_ID = 'flight-transport-form'

// 제출 버튼이 폼 밖 액션 영역에 놓인다. 폼 인스턴스를 컴포넌트 밖에서 만들어,
// 버튼이 prop 없이 같은 상태를 구독한다.
const { formControl } = createFormControl<TransportFormValues>({
  // isValid 는 검증이 돈 뒤에만 참이 된다. 제출 시점에만 검증하면
  // 다 채워도 버튼이 계속 잠긴다.
  mode: 'onChange',
})

interface Props {
  defaultValues?: Partial<TransportFormValues>
  onNext: (value: TransportFormValues) => void
}

export function FlightTransportForm({ defaultValues, onNext }: Props) {
  const isMobile = useIsMobile()
  const { control, handleSubmit, setValue } = useForm<TransportFormValues>({
    values: defaultValues as TransportFormValues,
    formControl,
  })

  return (
    <Stack id={FORM_ID} component="form" onSubmit={handleSubmit(onNext)} gap={2}>
      <FlightRouteFields control={control} setValue={setValue} />
      <TransportTimeFields control={control} />


      <Stack direction="column" gap={2}>
        <FieldPair label="항공사">
          <AirlineField control={control} setValue={setValue} />
        </FieldPair>
        <FieldPair label="편번호">
          <Controller
            control={control}
            name="flightNumber"
            rules={{ required: true, pattern: FLIGHT_NUMBER_PATTERN }}
            render={({ field }) => (
              <TextField
                placeholder="예: 721"
                fullWidth
                slotProps={{ htmlInput: { inputMode: 'numeric' } }}
                {...field}
                value={field.value ?? ''}
              />
            )}
          />
        </FieldPair>
      </Stack>
    </Stack>
  )
}

FlightTransportForm.SubmitButton = function SubmitButton({ children = '다음', ...props }: ButtonProps) {
  const { isValid } = useFormState({ control: formControl.control })

  return (
    <Button
      type="submit"
      form={FORM_ID}
      variant="contained"
      size="large"
      fullWidth
      disabled={!isValid}
      {...props}
    >
      {children}
    </Button>
  )
}
