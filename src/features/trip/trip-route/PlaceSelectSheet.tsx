import CheckIcon from '@mui/icons-material/Check'
import { Box, Button, Checkbox, Chip, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { DraggableBottomSheet } from '../../../shared/components/DraggableBottomSheet'
import { ListItem } from '../../../shared/components/ListItem'
import { PlaceCategoryColorCode, type Place } from '../../place/place.types'
import { BottomArea } from '~shared/components/BottomArea'

interface PlaceSelectSheetProps {
  isOpen: boolean
  onClose: () => void
  places: Place[]
  selectedPlaceIds: string[]
  onConfirm: (placeIds: string[]) => void
}

export function PlaceSelectSheet({
  isOpen,
  onClose,
  places,
  selectedPlaceIds,
  onConfirm,
}: PlaceSelectSheetProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const handleToggle = (placeId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(placeId)) {
        next.delete(placeId)
      } else {
        next.add(placeId)
      }
      return next
    })
  }

  const handleConfirm = () => {
    onConfirm(Array.from(selected))
    setSelected(new Set())
    onClose()
  }

  const handleClose = () => {
    setSelected(new Set())
    onClose()
  }

  const availablePlaces = places.filter((p) => !selectedPlaceIds.includes(p.id))

  return (
    <DraggableBottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      snapPoints={[0.5, 0.75]}
      defaultSnapIndex={0}
    >
      <Stack sx={{ px: 2, pb: 5 }}>
        <Typography variant="h6" bgcolor="#fff" sx={{ mb: 1, position: 'sticky', top: 0, zIndex: 10 }}>
          장소 선택
        </Typography>

        <Box paddingBottom={10} >
          {availablePlaces.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
              추가할 수 있는 장소가 없습니다
            </Typography>
          ) : (
            <Stack spacing={0.75}>
              {availablePlaces.map((place) => {
                const isSelected = selected.has(place.id);

                return (
                  <ListItem
                    key={place.id}
                    sx={{
                      cursor: 'pointer',
                      borderColor: isSelected ? 'primary.main' : 'divider',
                      bgcolor: isSelected ? 'primary.50' : undefined,
                    }}
                    onClick={() => handleToggle(place.id)}
                    leftAddon={
                      <Checkbox
                        checked={isSelected}
                        size="small"
                        sx={{ p: 0, mr: 1 }}
                      />
                    }
                  >
                    <Stack direction="row" gap={0.5} alignItems="center">
                      {!!place.category && (
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: PlaceCategoryColorCode[place.category],
                          }}
                        />
                      )}
                      <ListItem.Title>{place.name}</ListItem.Title>
                    </Stack>
                    {place.address && (
                      <ListItem.Text variant="body2" color="text.secondary" fontSize={12}>
                        {place.address}
                      </ListItem.Text>
                    )}
                    {place.tags.length > 0 && (
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                        {place.tags.map((x) => (
                          <Chip key={x} label={x} size="small" />
                        ))}
                      </Stack>
                    )}
                  </ListItem>
                )
              })}
            </Stack>
          )}
        </Box>

        <BottomArea direction="row" marginLeft={-2} spacing={1} sx={{ pt: 2 }}>
          <Button variant="outlined" onClick={handleClose} sx={{ flex: 1 }}>
            취소
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={selected.size === 0}
            startIcon={<CheckIcon />}
            sx={{ flex: 1 }}
          >
            추가 ({selected.size})
          </Button>
        </BottomArea>
      </Stack>
    </DraggableBottomSheet>
  )
}