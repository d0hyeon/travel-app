import { useState } from 'react'
import { Box, Button, Chip, Stack, TextField, Typography } from '@mui/material'

interface Props {
  destination: string
  onNext: (name: string, memberNames: string[]) => void
}

export function InfoStep({ destination, onNext }: Props) {
  const [name, setName] = useState('')
  const [memberInput, setMemberInput] = useState('')
  const [memberNames, setMemberNames] = useState<string[]>([])

  const addMember = () => {
    const trimmed = memberInput.trim()
    if (trimmed && !memberNames.includes(trimmed)) {
      setMemberNames([...memberNames, trimmed])
      setMemberInput('')
    }
  }

  return (
    <Stack spacing={3} px={3}>
      <TextField
        label="여행 이름"
        placeholder={`${destination} 여행`}
        value={name}
        onChange={(e) => setName(e.target.value)}
        fullWidth
      />

      <Box>
        <Typography variant="subtitle2" mb={1}>
          참석자
        </Typography>
        <Stack direction="row" spacing={1} mb={1.5}>
          <TextField
            label="이름"
            value={memberInput}
            onChange={(e) => setMemberInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addMember()}
            size="small"
            fullWidth
          />
          <Button onClick={addMember} variant="outlined" sx={{ flexShrink: 0 }}>
            추가
          </Button>
        </Stack>
        {memberNames.length > 0 && (
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {memberNames.map((m) => (
              <Chip
                key={m}
                label={m}
                onDelete={() => setMemberNames(memberNames.filter((n) => n !== m))}
              />
            ))}
          </Stack>
        )}
      </Box>

      <Button
        variant="contained"
        fullWidth
        size="large"
        onClick={() => onNext(name, memberNames)}
      >
        완료
      </Button>
    </Stack>
  )
}
