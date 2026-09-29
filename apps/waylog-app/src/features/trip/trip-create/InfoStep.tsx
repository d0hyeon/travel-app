import { StyleSheet } from 'react-native'
import { useState, useTransition } from 'react'
import { BottomArea } from '../../../shared/components/BottomArea'
import { Box, Button, TextField, Typography } from '~/shared/components/design-system'

interface Props {
  destination: string
  onNext: (name: string) => void | Promise<void>
}

export function InfoStep({ destination, onNext }: Props) {
  const [name, setName] = useState('')
  const [isPending, startTransition] = useTransition()

  return (
    <>
      <Box style={styles.fields}>
        <TextField
          label="여행 이름"
          placeholder={`${destination} 여행`}
          value={name}
          onChangeText={setName}
          size="small"
          fullWidth
        />
      </Box>

      <BottomArea position='fixed' bottom={0}>
        <Button
          fullWidth
          variant="contained"
          size="large"
          disabled={isPending}
          onPress={() => startTransition(() => onNext(name))}
        >
          완료
        </Button>
      </BottomArea>
    </>
  )
}

const styles = StyleSheet.create({
  fields: { paddingHorizontal: 24 },
  description: { marginTop: 24 },
})
