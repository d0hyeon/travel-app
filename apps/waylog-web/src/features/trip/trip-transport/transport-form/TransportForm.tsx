import { Button, Stack, type ButtonProps } from '@mui/material'
import { createFormControl, useForm, useFormState } from 'react-hook-form'
import { GroundRouteFields } from './GroundRouteFields'
import { TransportTimeFields } from './TransportTimeFields'
import type { TransportFormValues } from './transportForm.types'

const FORM_ID = 'ground-transport-form'

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

export function TransportForm({ defaultValues, onNext }: Props) {
  const { control, handleSubmit } = useForm<TransportFormValues>({
    values: defaultValues as TransportFormValues,
    formControl,
  })

  return (
    <Stack id={FORM_ID} component="form" onSubmit={handleSubmit(onNext)} gap={2}>
      <GroundRouteFields control={control} />
      <TransportTimeFields control={control} />
    </Stack>
  )
}

TransportForm.SubmitButton = function SubmitButton({ children = '다음', ...props }: ButtonProps) {
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
