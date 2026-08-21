import { forwardRef, useImperativeHandle } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Stack } from '../../../shared/components/mui'
import { TextField } from '../../../shared/components/mui/TextField'

export interface MemoFormValues {
  title: string
  content: string
}

export interface TripMemoFormRef {
  submit: () => void
}

interface Props {
  defaultValues?: Partial<MemoFormValues>
  onSubmit: (values: MemoFormValues) => void | Promise<void>
}

// 웹은 form={id} 로 바깥 버튼과 연결하지만 RN 에는 그 개념이 없다.
// ref.submit() 으로 대체하고 입력·검증 규칙은 웹과 같게 둔다.
export const TripMemoForm = forwardRef<TripMemoFormRef, Props>(function TripMemoForm(
  { defaultValues, onSubmit },
  ref,
) {
  const { control, handleSubmit } = useForm<MemoFormValues>({
    defaultValues: { title: '', content: '', ...defaultValues },
  })

  useImperativeHandle(ref, () => ({ submit: () => void handleSubmit(onSubmit)() }), [
    handleSubmit,
    onSubmit,
  ])

  return (
    <Stack gap={2}>
      <Controller
        control={control}
        name="title"
        render={({ field }) => (
          <TextField
            autoFocus
            placeholder="제목"
            fullWidth
            variant="standard"
            value={field.value}
            onChangeText={field.onChange}
          />
        )}
      />
      <Controller
        control={control}
        name="content"
        rules={{ required: true }}
        render={({ field }) => (
          <TextField
            multiline
            minRows={8}
            placeholder="메모를 입력하세요"
            fullWidth
            value={field.value}
            onChangeText={field.onChange}
          />
        )}
      />
    </Stack>
  )
})
