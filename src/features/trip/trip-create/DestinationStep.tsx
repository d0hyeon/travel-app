import { useState } from 'react'
import { Box, Button, Chip, Stack, Typography } from '@mui/material'
import { BottomActions } from '~shared/components/bottom-sheet/compounds'
import { LocationGroups, LocationOptions, type LocationOption } from '../trip.constants';

export type Destination = LocationOption;

const DestinationGroupOptions = LocationGroups.map((group) => ({
  label: group,
  destinations: LocationOptions.filter((destination) => destination.group === group),
}))

interface Props {
  defaultValue: Destination[]
  onNext: (destinations: Destination[]) => void
}

export function DestinationStep({ defaultValue, onNext }: Props) {
  const [selected, setSelected] = useState<Destination[]>(defaultValue)

  const toggle = (dest: Destination) => {
    setSelected((prev) =>
      prev.some((d) => d.name === dest.name)
        ? prev.filter((d) => d.name !== dest.name)
        : [...prev, dest]
    )
  }

  return (
    <>
      <Stack spacing={0} px={3} pb={10}>
        <Stack spacing={2.5} mb={3}>
          {DestinationGroupOptions.map((group) => (
            <Box key={group.label}>
              <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block" mb={1}>
                {group.label}
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {group.destinations.map((dest) => {
                  const isSelected = selected.some((d) => d.name === dest.name)
                  return (
                    <Chip
                      key={dest.name}
                      label={dest.name}
                      onClick={() => toggle(dest)}
                      variant={isSelected ? 'filled' : 'outlined'}
                      color={isSelected ? 'primary' : 'default'}
                      sx={{ cursor: 'pointer' }}
                    />
                  )
                })}
              </Stack>
            </Box>
          ))}
        </Stack>
      </Stack>

      <BottomActions position="fixed" bottom={0} bgcolor="background.paper">
        <Button
          variant="contained"
          fullWidth
          size="large"
          disabled={selected.length === 0}
          onClick={() => onNext(selected)}
        >
          다음
        </Button>
      </BottomActions>
    </>
  )
}
