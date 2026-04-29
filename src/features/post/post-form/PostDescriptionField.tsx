import { TextField } from '@mui/material'

interface Props {
  value: string
  onChange: (value: string) => void
}

export function PostDescriptionField({ value, onChange }: Props) {
  return (
    <TextField
      label="설명"
      placeholder="여행에 대해 한 줄 남겨주세요"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      multiline
      minRows={3}
      maxRows={8}
      size="small"
      variant="outlined"
      fullWidth
    />
  )
}
