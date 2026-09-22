import { Box, Stack } from '@mui/material'
import { TRANSPORT_FORM_STEPS } from './transportForm.types'

interface Props {
  stepIndex: number
}

export function TransportFormStepIndicator({ stepIndex }: Props) {
  return (
    <Stack direction="row" gap="4px" alignItems="center">
      {TRANSPORT_FORM_STEPS.map((step, index) => (
        <Box
          key={step}
          sx={{
            width: index === stepIndex ? 16 : 6,
            height: 6,
            borderRadius: '3px',
            bgcolor: index <= stepIndex ? 'primary.main' : 'action.disabledBackground',
            transition: 'all .2s',
          }}
        />
      ))}
    </Stack>
  )
}
