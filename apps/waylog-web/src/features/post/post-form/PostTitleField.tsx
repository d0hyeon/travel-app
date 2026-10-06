import { TextField } from '@mui/material'

interface Props {
  value: string
  onChange: (value: string) => void
}

export function PostTitleField({ value, onChange }: Props) {
  return (
    <TextField
      label="제목"
      placeholder="포스트 제목 (선택)"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      size="small"
      variant="standard"
      fullWidth
    />
  )
}
