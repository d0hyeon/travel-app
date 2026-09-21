import { Box, Button, Stack, Typography } from '@mui/material'
import { TransportType, TransportTypeLabel } from '@waylog/domains/modules/transport'
import type { TripTransportType } from '@waylog/domains/modules/trip-transport'
import { useState } from 'react'
import { TransportTypeIcon } from '../TransportTypeIcon'

const SELECTABLE_TYPES: TripTransportType[] = [
  TransportType.항공,
  TransportType.기차,
  TransportType.버스,
]

interface Props {
  defaultValue?: TripTransportType
  onNext: (type: TripTransportType) => void
}

export function TransportTypeStep({ defaultValue, onNext }: Props) {
  const [selected, setSelected] = useState<TripTransportType | undefined>(defaultValue)

  return (
    <Stack p={2} gap={2} height="100%">
      <Typography variant="h6" fontWeight={700}>
        어떤 교통편인가요?
      </Typography>

      <Stack gap={1.5}>
        {SELECTABLE_TYPES.map((type) => {
          const isSelected = selected === type

          return (
            <Box
              key={type}
              component="button"
              type="button"
              onClick={() => setSelected(type)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                px: 2,
                py: 2,
                borderRadius: 3,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: isSelected ? 'primary.main' : 'divider',
                bgcolor: isSelected ? 'action.selected' : 'background.paper',
                transition: 'border-color .15s, background-color .15s',
              }}
            >
              <Typography fontWeight={600}>{TransportTypeLabel[type]}</Typography>
              <TransportTypeIcon
                type={type}
                fontSize="small"
                color={isSelected ? 'primary' : 'disabled'}
              />
            </Box>
          )
        })}
      </Stack>

      <Stack flex={1} justifyContent="end">
        <Button
          variant="contained"
          size="large"
          disabled={selected == null}
          onClick={() => selected && onNext(selected)}
        >
          다음
        </Button>
      </Stack>
    </Stack>
  )
}
