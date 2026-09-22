import { Box, Button, Stack, Typography } from '@mui/material'
import { TransportType, TransportTypeLabel } from '@waylog/domains/modules/transport'
import type { TripTransportType } from '@waylog/domains/modules/trip-transport'
import { useState } from 'react'
import { TransportTypeIcon } from '~features/transport/TransportTypeIcon'
import {
  TransportFormBody,
  TransportFormFooter,
} from './TransportFormLayout.desktop'

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
    <>
      <TransportFormBody>
        <Stack gap={2}>
          <Typography fontSize={17} fontWeight={700}>
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
                    px: 2.5,
                    py: 2.25,
                    borderRadius: 4,
                    cursor: 'pointer',
                    border: '1.5px solid',
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    bgcolor: isSelected ? 'primary.50' : 'background.paper',
                    transition: 'border-color .15s, background-color .15s',
                  }}
                >
                  <Typography
                    fontSize={15}
                    fontWeight={700}
                    color={isSelected ? 'primary.main' : 'text.primary'}
                  >
                    {TransportTypeLabel[type]}
                  </Typography>
                  <TransportTypeIcon type={type} color={isSelected ? 'primary' : 'disabled'} />
                </Box>
              )
            })}
          </Stack>
        </Stack>
      </TransportFormBody>

      <TransportFormFooter>
        <Button
          variant="contained"
          disabled={selected == null}
          onClick={() => selected && onNext(selected)}
        >
          다음
        </Button>
      </TransportFormFooter>
    </>
  )
}
