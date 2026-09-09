import { TextField } from '../../../../shared/components/mui'

interface Props {
  value: string
  onChange: (value: string) => void
}

export function PostDescriptionField({ value, onChange }: Props) {
  return (
    <TextField
      placeholder="여행에 대해 한 줄 남겨주세요"
      value={value}
      onChangeText={onChange}
      multiline
      minRows={3}
      variant="standard"
      fullWidth
    />
  )
}
