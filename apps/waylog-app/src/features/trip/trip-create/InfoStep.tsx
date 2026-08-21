import { useState, useTransition } from 'react'
import { BottomArea } from '../../../shared/components/BottomArea'
import { Box, Button, TextField, Typography } from '../../../shared/components/mui'

interface Props {
  destination: string
  onNext: (name: string) => void | Promise<void>
}

export function InfoStep({ destination, onNext }: Props) {
  const [name, setName] = useState('')
  const [isPending, startTransition] = useTransition()

  return (
    <>
      <Box sx={{ paddingHorizontal: 24 }}>
        <TextField
          label="여행 이름"
          placeholder={`${destination} 여행`}
          value={name}
          onChangeText={setName}
          size="small"
          fullWidth
        />
        <Typography variant="body2" color="text.secondary" sx={{ marginTop: 24 }}>
          멤버는 여행 생성 후 초대 링크로 추가할 수 있어요
        </Typography>
      </Box>

      <BottomArea>
        <Button
          fullWidth
          variant="contained"
          size="large"
          disabled={isPending}
          onClick={() => startTransition(() => onNext(name))}
        >
          완료
        </Button>
      </BottomArea>
    </>
  )
}
