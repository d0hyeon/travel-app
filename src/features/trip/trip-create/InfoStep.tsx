import { useState } from 'react'
import { Box, Button, TextField, Typography } from '@mui/material'
import { BottomArea } from '~shared/components/BottomArea'

const BOTTOM_AREA_HEIGHT = 64

interface Props {
  destination: string
  onNext: (name: string) => void
}

export function InfoStep({ destination, onNext }: Props) {
  const [name, setName] = useState('')

  return (
    <>
      <Box px={3} pb={`${BOTTOM_AREA_HEIGHT + 16}px`}>
        <TextField
          label="여행 이름"
          placeholder={`${destination} 여행`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          size="small"
          variant="standard"
          fullWidth
        />
        <Typography variant="body2" color="text.secondary" mt={3}>
          멤버는 여행 생성 후 초대 링크로 추가할 수 있어요
        </Typography>
      </Box>

      <BottomArea>
        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={() => onNext(name)}
        >
          완료
        </Button>
      </BottomArea>
    </>
  )
}
