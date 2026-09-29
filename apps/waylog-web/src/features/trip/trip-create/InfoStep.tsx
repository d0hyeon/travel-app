import { Box, Button, TextField, Typography } from '@mui/material';
import { useState, useTransition } from 'react';
import { BottomArea } from '~shared/components/BottomArea';

const BOTTOM_AREA_HEIGHT = 64

interface Props {
  destination: string
  onNext: (name: string) => void | Promise<void>
}

export function InfoStep({ destination, onNext }: Props) {
  const [name, setName] = useState('');
  const [isPending, startTransition] = useTransition();

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
      </Box>

      <BottomArea>
        <Button
          variant="contained"
          fullWidth
          size="large"
          loading={isPending}
          onClick={() => startTransition(() => onNext(name))}
        >
          완료
        </Button>
      </BottomArea>
    </>
  )
}
