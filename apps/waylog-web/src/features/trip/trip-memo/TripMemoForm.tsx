import { Stack, TextField } from '@mui/material';
import { useForm } from 'react-hook-form';

export interface MemoFormValues {
  title: string;
  content: string;
}

interface Props {
  id: string;
  defaultValues?: Partial<MemoFormValues>;
  onSubmit: (values: MemoFormValues) => void | Promise<void>;
}

export function TripMemoForm({ id, defaultValues, onSubmit }: Props) {
  const { register, handleSubmit } = useForm<MemoFormValues>({
    defaultValues: { title: '', content: '', ...defaultValues },
  });

  return (
    <Stack
      component="form"
      id={id}
      onSubmit={handleSubmit(onSubmit)}
      gap={2}
    >
      <TextField
        autoFocus
        placeholder="제목"
        fullWidth
        variant="standard"
        slotProps={{ input: { disableUnderline: false } }}
        {...register('title')}
      />
      <TextField
        multiline
        minRows={8}
        maxRows={100}
        placeholder="메모를 입력하세요"
        fullWidth
        {...register('content', { required: true })}
      />
    </Stack>
  );
}
